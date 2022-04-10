import moment from "moment";

import { SnapshotTrack } from "../models"

export function getSnapshotTracks(snapshotId: string, tracks: SpotifyApi.PlaylistTrackObject[]): SnapshotTrack[] {
    const createdAt = moment()

    return (tracks || []).reduce((acc: SnapshotTrack[], trackObj: SpotifyApi.PlaylistTrackObject) => {
        try {
            const track: SnapshotTrack = {
                id: trackObj.track.id,
                snapshotId: snapshotId,
                data: trackObj,
                type: 'snapshot-track',
                createdAt: createdAt
            }
            acc.push(track)
        }
        catch (err) {
            console.warn(`Failed to map snapshot track: ${trackObj?.track?.id}. SnapshotId: ${snapshotId}`)
        }

        return acc
    }, [])
}