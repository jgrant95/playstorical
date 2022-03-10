import { BulkOperationType, CosmosClient } from "@azure/cosmos"

import { PlaystoricalDb, PlaystoricalDbCreateOpts, PlaystoricalDbUpsertOpts } from "../../../models";
import { executeBulkOps, getBulkOps, getContainerAsync } from "./cosmosdb.helper"

const key = process.env.COSMOS_KEY || "gWwpHThNpxe8P74p19WDIwgo1Y4Pl7HMXoc13sGK7bsFzYPa8nc6Dd4V25ioR36RuiCdDwIngecZWxcyImdKpQ==";
const endpoint = process.env.COSMOS_ENDPOINT || "https://test-sql-1.documents.azure.com:443/";
const databaseId = process.env.COSMOS_DATABASE || "test-sql-2";

export class Cosmosdb implements PlaystoricalDb {
    private _cosmosdbClient!: CosmosClient

    constructor(opts?: any) {
        this._cosmosdbClient = new CosmosClient({ endpoint, key });
    }

    async get<T>(id: string, containerId: string, opts?: { partitionKeyValue }): Promise<T> {
        const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)

        const res = await container.item(id, opts?.partitionKeyValue).read<T>()

        return res.resource as T
    }

    async upsert(items: any[], containerId: string, opts?: PlaystoricalDbUpsertOpts) {
        // TODO & Fix: If you don't put in the correct partitionKey (when its required), we dont get an error!
        const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)

        const batchedOps = getBulkOps(items, BulkOperationType.Upsert, opts)

        const opResponses = await executeBulkOps(container, batchedOps, opts)
        const totalRespCharge = this.getRequestChargeTotal(opResponses)

        console.info(`[Upsert] Total RUs: ${totalRespCharge}`)
    }

    async create<T>(items: T[], containerId: string, opts?: PlaystoricalDbCreateOpts) {
        const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)

        const batchedOps = getBulkOps(items, BulkOperationType.Create, opts)

        const opResponses = await executeBulkOps(container, batchedOps, opts)
        const totalRespCharge = this.getRequestChargeTotal(opResponses)

        console.info(`[Create] Total RUs: ${totalRespCharge}`)
    }

    async exists(id: string, containerId: string): Promise<boolean> {
        const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)

        const res = await container.item(id).read()

        return !!res?.item
    }

    private getRequestChargeTotal(opResponses: any[]) {
        return opResponses.reduce((accOpTotal, currOp) => {
            const totalPerRes: number = (currOp?.result || []).reduce((prevRes, currRes) => prevRes + currRes.requestCharge, 0)
            return accOpTotal + totalPerRes
        }, 0)
    }
}