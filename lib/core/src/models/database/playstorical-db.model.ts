// Todo: Improve response from db
export interface PlaystoricalDb {
    upsert: <T>(items: T[], containerId: string, opts?: PlaystoricalDbUpsertOpts) => Promise<any>
    // insert: <T>(items: T[], containerId: string, opts?: PlaystoricalDbInsertOpts) => Promise<any>
}

export type PlaystoricalDbInsertOpts = {
    partitionKey: string
}

export type PlaystoricalDbUpsertOpts = PlaystoricalDbInsertOpts & {}

export type PlaystoricalDbProvider = 'cosmosdb'