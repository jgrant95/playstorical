import { BulkOperationType, CosmosClient } from "@azure/cosmos"

import { PlaystoricalDb, PlaystoricalDbUpsertOpts } from "../../../models";
import { executeBatchedOps, getBatchedOps, getContainerAsync } from "./cosmosdb.helper"

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

        const batchedOps = getBatchedOps(items, BulkOperationType.Upsert,)

        console.log(batchedOps.map(x => x.batch))

        // --> Jon, this is currently broken, take a look at the diff between what was moved into the export helper file and below
        await executeBatchedOps(container, batchedOps)

        // const saveOps = async (batchedOps: { batch: number, ops: UpsertOperationInput[] }[], isRetry?: boolean) => {
        //     batchedOps.forEach(async batch => {
        //         console.log(`[UPSERT] Batch ${batch.batch} Started...`)
        //         try {
        //             const bulkUpsertResp = await container.items.bulk(batch.ops)

        //             const isFailedStatus = (res: any) => res.statusCode === 200 && res.statusCode === 201

        //             const failedUpserts = bulkUpsertResp.filter(isFailedStatus)
        //             if (bulkUpsertResp.some(isFailedStatus)) {
        //                 console.error('Failed to upsert some of bulk ops.', bulkUpsertResp.map(r => r.resourceBody?.id))
        //                 return
        //             }

        //             await saveOps([{
        //                 batch: batch.batch,
        //                 ops: failedUpserts.map(res => getOp(res.resourceBody, opts?.partitionKey))
        //             }],
        //                 true)

        //             console.log(`[UPSERT] Batch ${batch.batch} Complete!`)
        //         } catch (e) {
        //             console.log('Failed to bulk upsert', e)
        //         }
        //     });
        // }
    }

    // async insert<T>(items: T[], containerId: string, opts) {
    //     // const container = await getContainerAsync(this._cosmosdbClient, databaseId, containerId)
    // }
}