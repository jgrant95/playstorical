import { MusicProvider, SnapshotObject } from "@playstorical/core/models";
import moment from "moment";

export type SnapshotType = 'snapshot' | 'snapshot-track'

export interface SnapshotBase {
    id: string
    snapshotId: string
    createdAt: moment.Moment
    updatedAt?: moment.Moment
    readonly type: SnapshotType
}

export interface Snapshot extends SnapshotBase {
    type: 'snapshot'
    playlistId: string
    provider: MusicProvider
    data: SnapshotObject
    metadata: {
        initAdditionalTracksReq: string | null
    }
}

export interface SnapshotTrack extends SnapshotBase {
    type: 'snapshot-track'
    data: SpotifyApi.PlaylistTrackObject
}