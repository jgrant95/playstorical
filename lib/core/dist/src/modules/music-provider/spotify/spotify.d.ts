import SpotifyWebApi from "spotify-web-api-node";
import { PlaylistResponse } from "src/models";
export declare class SpotifyDiscoverer {
    private _creds;
    spotifyApi: SpotifyWebApi;
    constructor(credentials: {});
    authenticate(): Promise<void>;
    getCategoryIds(): Promise<string[]>;
    getPlaylistIds(categoryId: string): Promise<PlaylistResponse[]>;
    private getPaginatedResults;
}
//# sourceMappingURL=spotify.d.ts.map