import { BulkOperationType, CosmosClient, OperationResponse } from "@azure/cosmos"

import { PlaystoricalDb, PlaystoricalDbCreateOpts, PlaystoricalDbUpsertOpts } from "../../../models";
import { executeBatchOps, executeBulkOps, getBulkOps, getContainerAsync } from "./cosmosdb.helper"

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
        if (opts?.batchTransaction) {
            await this.upsertBatch(items, containerId, opts)
        } else {
            await this.upsertBulk(items, containerId, opts)
        }
    }

    /**
     * upserts items as batch transaction
    **/
    async upsertBatch(items: any[], containerId: string, opts?: PlaystoricalDbUpsertOpts) {
        try {
            // TODO & Fix: If you don't put in the correct partitionKey (when its required), we dont get an error!
            const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)

            const batchedOps = getBulkOps(items, BulkOperationType.Upsert, opts)

            // TODO Handle failures better from promise reject.
            // TODO: Remove flatMap here, just get the ops without the above bulk stuff.
            const opResponses = await executeBatchOps(container, batchedOps.flatMap(c => c.ops), opts)
            const totalRespCharge = this.getBatchRequestChargeTotal(opResponses)

            console.info(`[Upsert] Total RUs: ${totalRespCharge}`)
        }
        catch (e) {
            throw e
        }
    }

    /**
     * upserts items in bulk, not caring about a transaction
    **/
    async upsertBulk(items: any[], containerId: string, opts?: PlaystoricalDbUpsertOpts) {
        try {
            // TODO & Fix: If you don't put in the correct partitionKey (when its required), we dont get an error!
            const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)

            const batchedOps = getBulkOps(items, BulkOperationType.Upsert, opts)

            // TODO Handle failures better from promise reject.
            const opResponses = await executeBulkOps(container, batchedOps)
            const totalRespCharge = this.getBulkRequestChargeTotal(opResponses)

            console.info(`[Upsert] Total RUs: ${totalRespCharge}`)
        }
        catch (e) {
            throw e
        }
    }

    /**
     * creates items as batch transaction
    **/
    async create<T>(items: T[], containerId: string, opts?: PlaystoricalDbCreateOpts) {
        const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)

        const batchedOps = getBulkOps(items, BulkOperationType.Create, opts)

        // TODO: Remove flatMap here, just get the ops without the above bulk stuff.
        const opResponses = await executeBatchOps(container, batchedOps.flatMap(c => c.ops), opts)
        const totalRespCharge = this.getBatchRequestChargeTotal(opResponses || [])

        console.info(`[Create] Total RUs: ${totalRespCharge}`)
    }

    async exists(id: string, containerId: string): Promise<boolean> {
        const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)

        const res = await container.item(id).read()

        return !!res?.item
    }

    private getBatchRequestChargeTotal(opResponses: any[]): number {
        return opResponses.reduce((accOpTotal, currOp) => {
            const totalPerRes: number = this.getBulkRequestChargeTotal(currOp.result)
            return accOpTotal + totalPerRes
        }, 0)
    }

    private getBulkRequestChargeTotal(results: OperationResponse[]): number {
        return (results || []).reduce((prevRes, currRes) => prevRes + (currRes?.requestCharge || 0), 0)
    }
}