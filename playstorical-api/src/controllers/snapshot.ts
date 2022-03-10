import { Request } from "express";

import { getMusicProvider, getPlaystoricalDbProvider } from '@playstorical/core/modules'
import { Snapshot, SnapshotTrack } from '@playstorical/core/models'
import { getSnapshotTracks } from '@playstorical/core/helpers'
import { validatePlaylist } from "../helpers/playlist.helper";
import moment from "moment";

export const capture = async (req: Request, res, next) => {
    // validate input
    const { playlistId, snapshotId, provider } = req.body

    // get music provider
    const musicProvider = getMusicProvider(provider)

    // get playlist from provider
    await musicProvider.authenticate()
    const playlist = await musicProvider.getPlaylist(playlistId)

    // validate playlist - what to do when; snapshotId/playlistId is different (log?), playlist is missing etc
    // should this connect as middleware or just return validation obj or somin else?
    // const validator = { validate: (_req: any, _playlist: any) => ({ errors: [], warnings: [] }) }
    // validator.validate(req, playlist)
    validatePlaylist({ playlistId, snapshotId }, { playlist })
    if (!playlist) throw new Error('Playlist not found') // Figure out how this can be identified by the validate function

    // create cosmosdb lib instance
    const db = getPlaystoricalDbProvider('cosmosdb')
    const existingSnapshot = await db.get<Snapshot>(playlist.snapshot_id, 'snapshot', { partitionKeyValue: playlist.snapshot_id })

    if (existingSnapshot) {
        console.info(`Existing snapshot exists with Id: ${existingSnapshot?.id}`)
        return res.status(200).json({
            id: existingSnapshot?.id,
            message: 'Snapshot already exists, nothing new was captured.'
        })
    }

    const snapshotCreatedAt = moment()

    const snapshotTracks = getSnapshotTracks(playlist.snapshot_id, playlist.tracks.items)
        .reduce((prev: SnapshotTrack[], track: SnapshotTrack) => {
            const updatedTrack: SnapshotTrack = {
                ...track,
                createdAt: snapshotCreatedAt
            }

            return [
                ...prev,
                updatedTrack
            ]
        }, [])

    const snapshotData: any = {
        ...playlist
    }
    delete snapshotData.tracks

    // setup object to insert
    const snapshot: Snapshot = {
        id: playlist.snapshot_id,
        playlistId,
        snapshotId: playlist.snapshot_id,
        data: snapshotData,
        provider,
        type: 'snapshot',
        createdAt: snapshotCreatedAt,
        metadata: {
            initAdditionalTracksReq: playlist.tracks.next
        }
    }

    const createLogTime = `Creating snapshot and ${snapshotTracks.length} tracks`
    console.time(createLogTime)

    // insert snapshot and tracks
    await db.create([
        snapshot,
        ...snapshotTracks
    ], 'snapshot', { partitionKey: 'snapshotId' })

    console.timeEnd(createLogTime)

    // return response object (w/ id)
    res.status(200).json(snapshot.id)
}