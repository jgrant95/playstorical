import moment from "moment";

export type DiscoveryPlaylistType = 'header'

export interface DiscoveryPlaylistBase {
    id: string
    playlistId: string
    type: DiscoveryPlaylistType
}

export interface DiscoveryPlaylistHeader extends DiscoveryPlaylistBase {
    currentSnapshotId: string
    provider: 'spotify'
    createDate: moment.Moment
    createBy: string
    updatedDate?: moment.Moment
    updatedBy?: string
}