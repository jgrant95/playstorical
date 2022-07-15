"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyDiscoverer = void 0;
const async_retry_1 = __importDefault(require("async-retry"));
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
class SpotifyDiscoverer {
    constructor(credentials) {
        this._creds = credentials;
    }
    authenticate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.spotifyApi) {
                this.spotifyApi = new spotify_web_api_node_1.default(this._creds);
            }
            console.log('Authenticating...');
            const authResp = yield this.spotifyApi.clientCredentialsGrant();
            console.log('token...', authResp.body.access_token);
            this.spotifyApi.setAccessToken(authResp.body.access_token);
            console.log('Authenticated...');
        });
    }
    getCategoryIds() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.spotifyApi)
                    throw new Error('Must be authenticated!');
                console.log('Retrieving categories...');
                const getCategories = (params) => __awaiter(this, void 0, void 0, function* () {
                    const resp = yield this.spotifyApi.getCategories(params);
                    const items = resp.body.categories.items;
                    return Promise.resolve({
                        entity: items && items.map(x => x.id),
                        total: resp.body.categories.total,
                        limit: resp.body.categories.limit,
                        offset: resp.body.categories.offset
                    });
                });
                return this.getPaginatedResults(getCategories, 'category');
            }
            catch (e) {
                console.log('ERROR!', e);
                throw new Error('ERROR!');
            }
        });
    }
    getPlaylistIds(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.spotifyApi)
                    throw new Error('Must be authenticated!');
                console.log('Retrieving playlist ids...');
                const getPlaylistsByCategory = (params) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const resp = yield this.spotifyApi.getPlaylistsForCategory(categoryId, params);
                        const items = resp.body.playlists.items;
                        return Promise.resolve({
                            entity: items && items.map(x => ({ playlistId: x.id, snapshotId: x.snapshot_id })),
                            total: resp.body.playlists.total,
                            limit: resp.body.playlists.limit,
                            offset: resp.body.playlists.offset
                        });
                    }
                    catch (e) {
                        // console.log('wave 1', e)
                        throw e;
                    }
                });
                return this.getPaginatedResults(getPlaylistsByCategory, categoryId);
            }
            catch (e) {
                console.log('ERROR!');
                throw new Error('ERROR!');
            }
        });
    }
    getPaginatedResults(req, id) {
        const limit = 20;
        let offset = 0;
        let total = null;
        const results = [];
        return new Promise((res, rej) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                while (total === null || total >= limit + offset) {
                    const executeReq = () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const result = yield req({ offset, limit });
                            if (result) {
                                if (result.entity)
                                    results.push(...result.entity);
                                if (total === null || result.total > total) {
                                    total = result.total;
                                }
                            }
                            offset = offset + limit;
                        }
                        catch (e) {
                            if (total === null)
                                total = -1;
                            throw e;
                        }
                    });
                    const attemptMax = 3;
                    const retryFactor = 2;
                    const retryMinTimeoutMs = 5000;
                    let attempt = 0;
                    yield (0, async_retry_1.default)((bail) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            console.log(`[ID: ${id}] Started - ${limit + offset}/${total}`);
                            yield executeReq();
                            console.log(`[ID: ${id}] Completed - ${limit + offset}/${total}`);
                        }
                        catch (e) {
                            console.log(`[ID: ${id}] Failed to execute:`, e);
                            const status = e.statusCode;
                            // Prevents us from throwing error and stopping over potential calls
                            if (attempt === attemptMax)
                                return;
                            // Handle Rate Limiting
                            if (status === 429) {
                                const rateLimitMinTimeoutMs = 30000;
                                const waitMs = Math.pow(retryFactor, attempt) * rateLimitMinTimeoutMs;
                                console.log(`Rate limited. Waiting additional ${waitMs}ms`);
                                yield new Promise(resolve => setTimeout(resolve, waitMs));
                            }
                            if (status === 404) {
                                bail(new Error('Not Found'));
                                return;
                            }
                            throw e;
                        }
                    }), {
                        retries: attemptMax,
                        minTimeout: retryMinTimeoutMs,
                        factor: retryFactor,
                        onRetry: (_err) => {
                            const waitMs = Math.pow(retryFactor, attempt) * retryMinTimeoutMs;
                            attempt++;
                            console.log(`Retry ${attempt} will be attempted in ${waitMs}ms`);
                        },
                    }).catch((err) => {
                        console.log(`[ID: ${id}]`, err);
                    });
                }
                return res(results);
            }
            catch (e) {
                const message = ((_c = (_b = (_a = e) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.message) || 'Please view error logs';
                const log = `An error occurred when pagination request called. ${message}`;
                console.log(log, e);
                return rej(log);
            }
        }));
    }
}
exports.SpotifyDiscoverer = SpotifyDiscoverer;
