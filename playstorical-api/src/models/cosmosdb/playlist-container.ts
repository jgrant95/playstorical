import moment from "moment";

import { Snapshot } from "./snapshot-container";

export type PlaylistType = 'playlist' | 'snapshot-header'

export interface PlaylistBase {
    id: string
    playlistId: string
    readonly type: PlaylistType
}

export interface Playlist extends PlaylistBase {
    type: 'playlist'
    currentSnapshot: Snapshot
}

export interface SnapshotHeader extends PlaylistBase {
    type: 'snapshot-header'
    createdAt: moment.Moment
}