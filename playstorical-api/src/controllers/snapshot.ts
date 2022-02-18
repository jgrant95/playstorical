import { Request, Response, NextFunction } from "express";

import { getMusicProvider, getPlaystoricalDbProvider } from '@playstorical/core/modules'
import { validatePlaylist } from "../helpers/playlist.helper";
import { Snapshot, SnapshotTrack } from "../models/cosmosdb";
import { generateId } from "../helpers/utils.helper";

// import { Snapshot } from "models/cosmosdb";

const capture = async (req: Request, res: Response, next: NextFunction) => {
    // validate input
    const { playlistId, snapshotId, providerType } = req.body

    // get music provider
    const provider = getMusicProvider(providerType)

    // get playlist from provider
    provider.authenticate()
    const playlist = await provider.getPlaylist(playlistId)

    // validate playlist - what to do when; snapshotId/playlistId is different (log?), playlist is missing etc
    // should this connect as middleware or just return validation obj or somin else?
    // const validator = { validate: (_req: any, _playlist: any) => ({ errors: [], warnings: [] }) }
    // validator.validate(req, playlist)
    validatePlaylist({ playlistId, snapshotId }, { playlist })
    if (!playlist) throw new Error('Playlist not found') // Figure out how this can be identified by the validate function

    // create cosmosdb lib instance
    const db = getPlaystoricalDbProvider('cosmosdb')

    const snapshotTracks: SnapshotTrack[] = (playlist.tracks?.items || []).map(track => ({
        id: generateId(),
        snapshotId: playlist.snapshot_id,
        data: track,
        type: 'snapshot-track'
    }))

    // setup object to insert
    const snapshot: Snapshot = {
        id: generateId(),
        playlistId,
        snapshotId: playlist.snapshot_id,
        data: playlist,
        provider: providerType,
        type: 'snapshot'
    }

    // insert object
    const doc = db.insert(snapshot)

    // return response object (w/ id)
    return res.status(200).json(doc)
}