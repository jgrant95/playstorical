// Todo: Improve response from db
export interface PlaystoricalDb {
    get: <T>(id: string, containerId: string, opts?: { partitionKeyValue }) => Promise<T>
    upsert: <T>(items: T[], containerId: string, opts?: PlaystoricalDbUpsertOpts) => Promise<any>
    create: <T>(items: T[], containerId: string, opts?: PlaystoricalDbCreateOpts) => Promise<any>
    exists: (id: string, containerId: string) => Promise<boolean>
}

export type PlaystoricalDbCreateOpts = {
    partitionKey: string
}

export type PlaystoricalDbUpsertOpts = PlaystoricalDbCreateOpts & {
    batchTransaction: boolean
}

export type PlaystoricalDbProvider = 'cosmosdb'