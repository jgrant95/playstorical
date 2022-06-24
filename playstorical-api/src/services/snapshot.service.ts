import { Result, Snapshot, SnapshotTrack } from "@playstorical/core/models"
import { getMusicProvider, getPlaystoricalDbProvider } from "@playstorical/core/modules"
import { validatePlaylist } from "../helpers/playlist.helper"

import NodeCache from "node-cache";
import moment from "moment";
import { getSnapshotTracks } from "@playstorical/core/helpers";

const db = getPlaystoricalDbProvider('cosmosdb')

export async function capture(data: { playlistId, snapshotId, provider }, cache: NodeCache): Promise<Result> {
    // validate input
    const { playlistId, snapshotId, provider } = data

    // check snapshot doesn't already exist in db
    if (snapshotId) {
        const existingSnapshot: Snapshot = await db.get<Snapshot>(snapshotId, 'snapshot', { partitionKeyValue: snapshotId })

        if (existingSnapshot) {
            return getExistingSnapshotResult(existingSnapshot, 'Music provider not used')
        }
    }

    // get music provider
    const musicProvider = getMusicProvider(provider, cache)

    // get playlist from provider
    await musicProvider.authenticate()
    const playlist = await musicProvider.getPlaylist(playlistId)

    // validate playlist - what to do when; snapshotId/playlistId is different (log?), playlist is missing etc
    // should this connect as middleware or just return validation obj or somin else?
    // const validator = { validate: (_req: any, _playlist: any) => ({ errors: [], warnings: [] }) }
    // validator.validate(req, playlist)
    validatePlaylist({ playlistId }, { playlist })
    if (!playlist) throw new Error('Playlist not found') // Figure out how this can be identified by the validate function

    const nextTracksReq = playlist?.tracks.next

    // get all tracks for playlist and validate they are ok
    let snapshotTracks: SnapshotTrack[] = [...getSnapshotTracks(playlist.snapshot_id, playlist.tracks.items)]

    if (nextTracksReq) {
        const tracks = await musicProvider.getAdditionalTracks(playlistId, { nextReqUrl: nextTracksReq })

        if (tracks) {
            snapshotTracks.push(...getSnapshotTracks(playlist.snapshot_id, tracks))

            // ensure playlist has not changed whilst retrieving tracks
            const postSnapshotId = await musicProvider.getPlaylistSnapshotId(playlistId)

            if (playlist?.snapshot_id !== postSnapshotId) {
                // Todo: Implement retry functionality when we fail because the playlist has changed
                throw new Error('Playlist was changed whilst retrieving tracks. Failed to capture.')
            }
        }
    }

    // Todo: move to validate func, figuring out how we want to maintain this functionality in the future
    if (snapshotId && snapshotId !== playlist.snapshot_id) {
        // if snapshot returned doesn't match validated snapshotId, we need to validate it again
        const existingProviderSnapshot = await db.get<Snapshot>(playlist.snapshot_id, 'snapshot', { partitionKeyValue: playlist.snapshot_id })

        if (existingProviderSnapshot) {
            return getExistingSnapshotResult(existingProviderSnapshot)
        }
    }

    console.log(`Capturing snapshot. PlaylistId: ${playlistId}, SnapshotId: ${playlist.snapshot_id}`)

    const snapshotCreatedAt = moment()

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

    // console.log(`Creating snapshot and ${snapshotTracks.length} tracks`)

    // insert snapshot and tracks
    await db.create([
        snapshot,
        ...snapshotTracks
    ].map(s => ({
        ...s,
        createdAt: snapshotCreatedAt
    })), 'snapshot', { partitionKey: 'snapshotId' })

    // return response object (w/ id)
    return {
        ok: true,
        message: `Snapshot captured. Id: ${snapshot.id}`
    }
}

function getExistingSnapshotResult(snapshot: Snapshot, additionalMsg?: string): { ok: true, message: string } {
    const message = additionalMsg
        ? `Snapshot already exists with Id: ${snapshot?.id}, nothing new was captured. ${additionalMsg}.`
        : `$Snapshot already exists with Id: ${snapshot?.id} , nothing new was captured.`

    return { ok: true, message }
}