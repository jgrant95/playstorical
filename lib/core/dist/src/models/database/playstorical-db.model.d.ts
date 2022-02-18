export interface PlaystoricalDb {
    upsert: <T>(items: T[], opts?: PlaystoricalDbUpsertOpts) => Promise<any>;
}
export interface PlaystoricalDbUpsertOpts {
    partitionKey: string;
}
export declare type PlaystoricalDbProvider = 'COSMOSDB';
//# sourceMappingURL=playstorical-db.model.d.ts.map