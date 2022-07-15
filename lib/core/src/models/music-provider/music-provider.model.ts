export interface MusicProvider {
    authenticate: (opts?: {}) => void

    /**
     * @returns `SnapshotObjectFull` when successful
     * @returns `null` when playlist was not found
    */
    getPlaylist(playlistId: string): Promise<SnapshotObject | null>

    getCategoryIds: (opts?: {}) => Promise<string[]>

    getPlaylistIds: (categoryId: string) => Promise<PlaylistResponse[]>

    getPlaylistTracks: (playlistId: string, opts: { offset, limit }) => Promise<SnapshotTrackResponse | null>

    getAdditionalTracks(playlistId: string, opts: { nextReqUrl: string }): Promise<SpotifyApi.PlaylistTrackObject[] | null>
}

export interface PlaylistResponse {
    playlistId: string
    snapshotId: string
}

export type MusicProviderType = 'spotify'

export type SnapshotObject = Omit<SpotifyApi.PlaylistObjectFull, 'tracks'>
export type SnapshotObjectFull = SpotifyApi.PlaylistObjectFull

export type SnapshotTrackResponse = SpotifyApi.PlaylistTrackResponse