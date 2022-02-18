import { MusicProvider, SnapshotObject } from "@playstorical/core/models";

export type SnapshotType = 'snapshot' | 'snapshot-track'

export interface SnapshotBase {
    id: string
    snapshotId: string
    readonly type: SnapshotType
}

export interface Snapshot extends SnapshotBase {
    type: 'snapshot'
    playlistId: string
    provider: MusicProvider
    data: SnapshotObject
}

export interface SnapshotTrack extends SnapshotBase {
    type: 'snapshot-track'
    data: SpotifyApi.PlaylistTrackObject
}