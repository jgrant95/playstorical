import { CosmosClient, UpsertOperationInput } from "@azure/cosmos"

import { DiscoveryDb, DiscoveryDbUpsertOpts } from "models/database"
import { getContainerAsync, getUpsertOp } from "./cosmosdb.helper"

const key = process.env.COSMOS_KEY || "gWwpHThNpxe8P74p19WDIwgo1Y4Pl7HMXoc13sGK7bsFzYPa8nc6Dd4V25ioR36RuiCdDwIngecZWxcyImdKpQ==";
const endpoint = process.env.COSMOS_ENDPOINT || "https://test-sql-1.documents.azure.com:443/";
const databaseId = process.env.COSMOS_DATABASE || "test-sql-2";

export class Comosdb implements DiscoveryDb {
    private _cosmosdbClient!: CosmosClient

    constructor(opts?: any) {
        this._cosmosdbClient = new CosmosClient({ endpoint, key });
    }

    async upsert(items: any[], opts?: DiscoveryDbUpsertOpts) {
        const container = await getContainerAsync(this._cosmosdbClient, databaseId, 'discovery')

        const batchedOps = items.reduce((arr: { batch: number, ops: UpsertOperationInput[] }[], curr, index) => {
            let currentBatch = arr.length ? Math.max(...arr.map(x => x.batch)) : 0

            // Add new batch with ops
            if (index % 100 === 0 || index == 1) {
                currentBatch = currentBatch + 1
                arr.push({ batch: currentBatch, ops: [] })
            }

            const current = arr.find(x => x.batch === currentBatch)

            current?.ops?.push(getUpsertOp(curr as any, opts?.partitionKey))

            return arr
        }, [])

        console.log(batchedOps.map(x => x.batch))

        const saveOps = async (batchedOps: { batch: number, ops: UpsertOperationInput[] }[], isRetry?: boolean) => {
            batchedOps.forEach(async batch => {
                console.log(`[UPSERT] Batch ${batch.batch} Started...`)
                try {
                    const bulkUpsertResp = await container.items.bulk(batch.ops)

                    const isFailedStatus = (res: any) => res.statusCode === 200 && res.statusCode === 201

                    const failedUpserts = bulkUpsertResp.filter(isFailedStatus)
                    if (bulkUpsertResp.some(isFailedStatus)) {
                        console.error('Failed to upsert some of bulk ops.', bulkUpsertResp.map(r => r.resourceBody?.id))
                        return
                    }

                    await saveOps([{
                        batch: batch.batch,
                        ops: failedUpserts.map(res => getUpsertOp(res.resourceBody, opts?.partitionKey))
                    }],
                        true)

                    console.log(`[UPSERT] Batch ${batch.batch} Complete!`)
                } catch (e) {
                    console.log('Failed to bulk upsert', e)
                }
            });
        }
    }
}