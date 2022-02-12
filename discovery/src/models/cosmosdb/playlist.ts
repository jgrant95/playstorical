import moment from "moment";

export type PlaylistType = 'header'

export interface PlaylistBase {
    id: string
    playlistId: string
    type: PlaylistType
}

export interface PlaylistHeader extends PlaylistBase {
    currentSnapshotId: string
    createDate: moment.Moment
    createBy: string
    updatedDate?: moment.Moment
    updatedBy?: string
}