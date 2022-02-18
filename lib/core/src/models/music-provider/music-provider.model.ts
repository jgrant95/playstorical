export interface MusicProvider {
    authenticate: (opts?: {}) => void

    /**
     * @returns `SnapshotObjectFull` when successful
     * @returns `null` when playlist was not found
    */
    getPlaylist(playlistId: string): Promise<SnapshotObject | null>

    getCategoryIds: (opts?: {}) => Promise<string[]>

    getPlaylistIds: (categoryId: string) => Promise<PlaylistResponse[]>
}

export interface PlaylistResponse {
    playlistId: string
    snapshotId: string
}

export type MusicProviderType = 'spotify'

export type SnapshotObject = Omit<SpotifyApi.PlaylistObjectFull, 'tracks'>
export type SnapshotObjectFull = SpotifyApi.PlaylistObjectFull