import AsyncRetry from "async-retry"
import SpotifyWebApi from "spotify-web-api-node"
import NodeCache from "node-cache";

import { MusicProvider, PlaylistResponse, PaginationRequest, SnapshotObjectFull, SnapshotTrackResponse } from "../../../models"

const SPOTIFY_TOKEN_CACHE_KEY = 'spotify-token'

export class Spotify implements MusicProvider {
    private _creds
    private _cache?: NodeCache
    spotifyApi!: SpotifyWebApi

    // Todo: setup caching for token next!
    constructor(credentials: {}, cache?: NodeCache) {
        this._creds = credentials

        if (cache) this._cache = cache
    }

    async authenticate() {
        try {
            if (!this.spotifyApi) {
                this.spotifyApi = new SpotifyWebApi(this._creds)
            }

            let token = this._cache?.get<string>(SPOTIFY_TOKEN_CACHE_KEY)
            if (!token) {
                console.log('Authenticating...')

                const authResp = await this.spotifyApi.clientCredentialsGrant()
                console.log('token...', authResp.body.access_token)

                this._cache?.set(SPOTIFY_TOKEN_CACHE_KEY, authResp.body.access_token, authResp.body.expires_in - 1)

                token = authResp.body.access_token
            }

            this.spotifyApi.setAccessToken(token)

            console.log('Authenticated...')
        } catch (err) {
            console.log(`Parsed error: `, JSON.stringify(err))

            throw err
        }
    }

    async getPlaylist(playlistId: string): Promise<SnapshotObjectFull | null> {
        try {
            if (!this.spotifyApi) throw new Error('Must be authenticated!')

            console.log('Retrieving playlist ids...')

            const resp = await this.spotifyApi.getPlaylist(playlistId)

            if (resp.statusCode === 404) {
                console.log(`Playlist ${playlistId} from Spotify was not found.`, resp)

                return null
            }

            if (resp.statusCode !== 200) {
                console.log(`Failed to get playlist ${playlistId} from Spotify.`, resp)

                throw new Error(`Failed to get playlist ${playlistId} from Spotify.`)
            }

            return resp.body
        }
        catch (e) {
            console.log('ERROR!', e)
            console.log(`Parsed error: `, JSON.stringify(e))

            throw new Error('ERROR!')
        }
    }

    async getPlaylistSnapshotId(playlistId: string): Promise<string | null> {
        try {
            if (!this.spotifyApi) throw new Error('Must be authenticated!')

            console.log('Retrieving playlist ids...')

            const resp = await this.spotifyApi.getPlaylist(playlistId, { fields: 'snapshot_id' })

            if (resp.statusCode === 404) {
                console.log(`Playlist ${playlistId} snapshot id from Spotify was not found.`, resp)

                return null
            }

            if (resp.statusCode !== 200) {
                console.log(`Failed to get playlist ${playlistId} snapshot id from Spotify.`, resp)

                throw new Error(`Failed to get playlist ${playlistId} snapshot id from Spotify.`)
            }

            return resp.body.snapshot_id
        }
        catch (e) {
            console.log(`ERROR! could not get snapshot id for playlist ${playlistId}!`, e)
            console.log(`Parsed error: `, JSON.stringify(e))

            throw new Error(`ERROR! could not get snapshot id for playlist ${playlistId}!`)
        }
    }

    async getPlaylistTracks(playlistId: string, opts: { offset, limit }): Promise<SnapshotTrackResponse | null> {
        try {
            if (!this.spotifyApi) throw new Error('Must be authenticated!')

            console.log('Retrieving playlist ids...')

            const resp = await this.spotifyApi.getPlaylistTracks(playlistId, opts)

            if (resp.statusCode === 404) {
                console.log(`Playlist tracks for playlist ${playlistId} from Spotify was not found.`, resp)

                return null
            }

            if (resp.statusCode !== 200) {
                console.log(`Failed to get playlist tracks, PlaylistId ${playlistId} from Spotify.`, resp)

                throw new Error(`Failed to get playlist tracks, PlaylistId ${playlistId} from Spotify.`)
            }

            return resp.body
        }
        catch (e) {
            console.log(`Parsed error: `, JSON.stringify(e))

            throw e
        }
    }

    async getAdditionalTracks(playlistId: string, opts: { nextReqUrl: string }): Promise<SpotifyApi.PlaylistTrackObject[] | null> {
        if (!opts.nextReqUrl) {
            return null
        }

        const getTracks = async (nextReqUrl): Promise<SpotifyApi.PlaylistTrackObject[]> => {
            const nextTracksUrl = new URL(nextReqUrl)?.searchParams
            const offset = nextTracksUrl?.get('offset')
            const limit = nextTracksUrl?.get('limit')

            const resp = await this.getPlaylistTracks(playlistId, { offset, limit })

            if (resp === null) {
                return []
            }

            if (resp.next) {
                return [
                    ...resp.items,
                    ...(await getTracks(resp.next))
                ]
            }

            return resp.items
        }

        const tracks = await getTracks(opts.nextReqUrl)

        return tracks
    }

    async getCategoryIds(): Promise<string[]> {
        try {
            if (!this.spotifyApi) throw new Error('Must be authenticated!')

            console.log('Retrieving categories...')

            const getCategories: PaginationRequest<string[]> = async (params: { offset: number, limit: number }) => {
                const resp = await this.spotifyApi.getCategories(params)
                const items = resp.body.categories.items

                return Promise.resolve({
                    entity: items && items.map(x => x.id),
                    total: resp.body.categories.total,
                    limit: resp.body.categories.limit,
                    offset: resp.body.categories.offset
                })
            };

            return this.getPaginatedResults<string>(getCategories, 'category')
        }
        catch (e) {
            console.log('ERROR!', e)
            console.log(`Parsed error: `, JSON.stringify(e))

            throw new Error('ERROR!')
        }
    }

    async getPlaylistIds(categoryId: string): Promise<PlaylistResponse[]> {
        try {
            if (!this.spotifyApi) throw new Error('Must be authenticated!')

            console.log('Retrieving playlist ids...')

            const getPlaylistsByCategory: PaginationRequest<PlaylistResponse[]> = async (params: { offset: number, limit: number }) => {
                try {
                    const resp = await this.spotifyApi.getPlaylistsForCategory(categoryId, params)

                    const items = resp.body.playlists.items

                    return Promise.resolve({
                        entity: items && items.map(x => ({ playlistId: x.id, snapshotId: x.snapshot_id })),
                        total: resp.body.playlists.total,
                        limit: resp.body.playlists.limit,
                        offset: resp.body.playlists.offset
                    })
                } catch (e) {
                    // console.log('wave 1', e)
                    throw e
                }
            };

            return this.getPaginatedResults<PlaylistResponse>(getPlaylistsByCategory, categoryId)
        }
        catch (e) {
            console.log('ERROR!', e)
            console.log(`Parsed error: `, JSON.stringify(e))

            throw new Error('ERROR!')
        }
    }

    private getPaginatedResults<T>(req: PaginationRequest<T[]>, id?: string): Promise<T[]> {
        const limit = 20
        let offset = 0
        let total: number | null = null

        const results: T[] = []

        return new Promise<T[]>(async (res, rej) => {
            try {
                while (total === null || total >= limit + offset) {
                    const executeReq = async () => {
                        try {
                            const result = await req({ offset, limit })

                            if (result) {
                                if (result.entity) results.push(...result.entity)
                                if (total === null || result.total > total) {
                                    total = result.total
                                }
                            }

                            offset = offset + limit
                        } catch (e) {
                            if (total === null) total = -1

                            throw e
                        }
                    }

                    const attemptMax = 3
                    const retryFactor = 2
                    const retryMinTimeoutMs = 5000

                    let attempt = 0
                    await AsyncRetry(async (bail) => {
                        try {
                            console.log(`[ID: ${id}] Started - ${limit + offset}/${total}`)

                            await executeReq()

                            console.log(`[ID: ${id}] Completed - ${limit + offset}/${total}`)
                        }
                        catch (e: any) {
                            console.log(`[ID: ${id}] Failed to execute:`, e)
                            console.log(`[ID: ${id}] Parsed error: `, JSON.stringify(e))

                            const status = e.statusCode

                            // Prevents us from throwing error and stopping over potential calls
                            if (attempt === attemptMax) return

                            // Handle Rate Limiting
                            if (status === 429) {
                                const rateLimitMinTimeoutMs = 30000
                                const waitMs = retryFactor ** attempt * rateLimitMinTimeoutMs
                                console.log(`Rate limited. Waiting additional ${waitMs}ms`)

                                await new Promise(resolve => setTimeout(resolve, waitMs));
                            }

                            if (status === 404) {
                                bail(new Error('Not Found'))
                                return
                            }

                            throw e
                        }
                    }, {
                        retries: attemptMax,
                        minTimeout: retryMinTimeoutMs,
                        factor: retryFactor,
                        onRetry: (_err) => {
                            const waitMs = retryFactor ** attempt * retryMinTimeoutMs

                            attempt++

                            console.log(`Retry ${attempt} will be attempted in ${waitMs}ms`)
                        },
                    }).catch((err) => {
                        console.log(`[ID: ${id}]`, err)
                    })
                }

                return res(results)
            }
            catch (e) {
                const message = (e as any)?.body?.error?.message || 'Please view error logs'
                const log = `An error occurred when pagination request called. ${message}`

                console.log(log, e)
                return rej(log)
            }
        })
    }
}