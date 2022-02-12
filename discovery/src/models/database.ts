export interface DiscoveryDb {
    upsert: <T>(items: T[], opts?: DiscoveryDbUpsertOpts) => Promise<any>
}

export interface DiscoveryDbUpsertOpts {
    partitionKey: string
}

export type DiscoveryDbProvider = 'COSMOSDB'