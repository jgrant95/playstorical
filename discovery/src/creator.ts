import { DiscoveryPlaylistHeader } from "@playstorical/core/models";
import { CreatorOpts, CREATOR_PROCESS } from "./models/creator-model";
import moment from "moment";

import { getMusicProvider, getPlaystoricalDbProvider } from '@playstorical/core/modules'
import { PlaystoricalDb, PlaystoricalDbProvider } from "@playstorical/core/models";

// const redirectUri = 'http://localhost:4200/callback'
// const clientId = '8087412e6ce64950b2d699062cd80e83'
// const clientSecret = '5e1ea8df6f2c403c90ff91c981e297e2'

export class Creator {
    private _context: { db: PlaystoricalDb }
    public _test = 0

    get context() {
        return this._context;
    }

    constructor(opts: { database: PlaystoricalDbProvider }) {
        this._context = {
            db: getPlaystoricalDbProvider(opts.database)
        }
    }

    /**
     * Start a creator process
     */
    public async start(processType: CREATOR_PROCESS, opts?: CreatorOpts) {
        const process = this.getProcess(processType)

        if (!process) throw new Error(`Process type ${processType} not supported.`)

        await process()
    }

    private getProcess(process: CREATOR_PROCESS) {
        if (process === 'BY_CATEGORY') {
            return async () => await this.byCategory()
        }
    }

    private async byCategory() {
        try {
            const provider = getMusicProvider('spotify')

            await provider.authenticate()

            const cats = await provider.getCategoryIds()

            console.log(cats.length, cats)

            const allPlaylistReq = cats.map(id => provider.getPlaylistIds(id));

            const playlists = (await Promise.all(allPlaylistReq)).flat()

            console.log(playlists.length, '...playlists fetched.')

            const playlistHeaders: DiscoveryPlaylistHeader[] = playlists
                .filter(resp => !!resp)
                .map(resp => {
                    return {
                        id: resp.playlistId,
                        playlistId: resp.playlistId,
                        currentSnapshotId: resp.snapshotId,
                        createDate: moment(),
                        provider: 'spotify',
                        createBy: 'Development',
                        type: 'header'
                    }
                })

            await this.context.db.upsert(playlistHeaders, 'discovery', { partitionKey: 'playlistId', batchTransaction: false })
        }
        catch (e) {
            console.log('Failed to get playlists by category', e)
            throw e
        }
    }
}
