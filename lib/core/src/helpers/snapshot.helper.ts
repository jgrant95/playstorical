import moment from "moment";

import { SnapshotTrack } from "../models"

export function getSnapshotTracks(snapshotId: string, tracks: SpotifyApi.PlaylistTrackObject[]): SnapshotTrack[] {
    const createdAt = moment()

    return (tracks || []).map(trackObj => ({
        id: trackObj.track.id,
        snapshotId: snapshotId,
        data: trackObj,
        type: 'snapshot-track',
        createdAt: createdAt
    }))
}