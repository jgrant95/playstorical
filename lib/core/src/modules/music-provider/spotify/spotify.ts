import AsyncRetry from "async-retry"
import SpotifyWebApi from "spotify-web-api-node"

import { MusicProvider, PlaylistResponse, PaginationRequest, SnapshotObjectFull } from "../../../models"

export class Spotify implements MusicProvider {
    private _creds
    spotifyApi!: SpotifyWebApi

    constructor(credentials: {}) {
        this._creds = credentials
    }

    async authenticate() {
        if (!this.spotifyApi) {
            this.spotifyApi = new SpotifyWebApi(this._creds)
        }

        console.log('Authenticating...')

        const authResp = await this.spotifyApi.clientCredentialsGrant()
        console.log('token...', authResp.body.access_token)
        this.spotifyApi.setAccessToken(authResp.body.access_token)

        console.log('Authenticated...')
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

            throw new Error('ERROR!')
        }
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