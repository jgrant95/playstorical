import { BulkOperationType, CosmosClient } from "@azure/cosmos"

import { PlaystoricalDb, PlaystoricalDbUpsertOpts } from "../../../models";
import { executeBulkOps, getBatchedOps, getContainerAsync } from "./cosmosdb.helper"

const key = process.env.COSMOS_KEY || "gWwpHThNpxe8P74p19WDIwgo1Y4Pl7HMXoc13sGK7bsFzYPa8nc6Dd4V25ioR36RuiCdDwIngecZWxcyImdKpQ==";
const endpoint = process.env.COSMOS_ENDPOINT || "https://test-sql-1.documents.azure.com:443/";
const databaseId = process.env.COSMOS_DATABASE || "test-sql-2";

export class Comosdb implements PlaystoricalDb {
    private _cosmosdbClient!: CosmosClient

    constructor(opts?: any) {
        this._cosmosdbClient = new CosmosClient({ endpoint, key });
    }

    async upsert(items: any[], containerId: string, opts?: PlaystoricalDbUpsertOpts) {
        const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)

        const batchedOps = getBatchedOps(items, BulkOperationType.Upsert, opts)

        const opResponses = await executeBulkOps(container, batchedOps)
        const totalRespCharge = opResponses.reduce((prev, curr) => prev + curr.requestCharge, 0)

        console.info(`[Upsert] Total RUs: ${totalRespCharge}`)
    }

    // async insert<T>(items: T[], containerId: string, opts) {
    //     // const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)
    // }
}