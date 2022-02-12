import { getDiscoveryDbProvider } from "database/discovery-databse.helper";
import { PlaylistHeader } from "models/cosmosdb/playlist";
import { CreatorOpts, CREATOR_PROCESS } from "models/creator-model";
import { DiscoveryDb, DiscoveryDbProvider } from "models/database";
import moment from "moment";
import { SpotifyDiscoverer } from "spotify";

const redirectUri = 'http://localhost:4200/callback'
const clientId = '8087412e6ce64950b2d699062cd80e83'
const clientSecret = '5e1ea8df6f2c403c90ff91c981e297e2'

export class Creator {
    public _context: { db: DiscoveryDb }
    public _test = 0

    constructor(opts: { database: DiscoveryDbProvider }) {
        this._context = {
            db: getDiscoveryDbProvider(opts.database)
        }
    }

    /**
     * Start a creator process
     */
    async start(processType: CREATOR_PROCESS, opts?: CreatorOpts) {
        const process = this.getProcess(processType)

        if (!process) throw new Error(`Process type ${processType} not supported.`)

        const res = await process()
    }

    private getProcess(process: CREATOR_PROCESS) {
        if (process === 'BY_CATEGORY') {
            return () => this.byCategory()
        }
    }

    private async byCategory() {
        const spotify = new SpotifyDiscoverer(
            {
                clientId,
                clientSecret,
                redirectUri
            })

        await spotify.authenticate()

        const cats = await spotify.getCategoryIds()

        console.log(cats.length, cats)

        const allPlaylistReq = cats.map(id => spotify.getPlaylistIds(id));

        const playlists = (await Promise.all(allPlaylistReq)).flat()

        console.log(playlists.length, '...playlists fetched.')

        const playlistHeaders: PlaylistHeader[] = playlists.map(resp => {
            return {
                id: resp.playlistId,
                playlistId: resp.playlistId,
                currentSnapshotId: resp.snapshotId,
                createDate: moment(),
                createBy: 'Development',
                type: 'header'
            }
        })

        await this._context.db.upsert(playlistHeaders, { partitionKey: 'playlistId' })
    }
}