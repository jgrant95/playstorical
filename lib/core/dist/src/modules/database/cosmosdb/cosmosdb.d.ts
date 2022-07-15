import { PlaystoricalDb, PlaystoricalDbUpsertOpts } from "src/models";
export declare class Comosdb implements PlaystoricalDb {
    private _cosmosdbClient;
    constructor(opts?: any);
    upsert(items: any[], opts?: PlaystoricalDbUpsertOpts): Promise<void>;
}
//# sourceMappingURL=cosmosdb.d.ts.map