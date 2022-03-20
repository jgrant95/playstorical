import { Container, CosmosClient, CreateOperationInput, OperationResponse, UpsertOperationInput } from "@azure/cosmos";
import { PlaystoricalDbCreateOpts } from "../../../models";
import { BulkBatchOps, BulkOperationType, BulkOperations } from "../../../models/database/cosmosdb.model";

export async function getContainerAsync(client: CosmosClient, databaseId: string, containerId: string): Promise<Container> {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });

    console.time('get-container')
    const container = database.container(containerId);
    console.timeEnd('get-container')

    return container
}

export function getOp(item: any, operationType: BulkOperationType, partitionKey?: string): UpsertOperationInput | CreateOperationInput {
    return {
        operationType,
        resourceBody: item,
    }
}

export function getBulkOps<T>(items: T[], operationType: BulkOperationType, opts?: { partitionKey, batchQuantity?: number }): BulkBatchOps[] {
    const batchedOps = items.reduce((arr: { batch: number, ops: BulkOperations[] }[], curr, index) => {
        let currentBatch = arr.length ? Math.max(...arr.map(x => x.batch)) : 0
        const batchQuantity = opts?.batchQuantity ?? 100

        // Add new batch with ops
        if (index % batchQuantity === 0 || index == 1) {
            currentBatch = currentBatch + 1
            arr.push({ batch: currentBatch, ops: [] })
        }

        const current = arr.find(x => x.batch === currentBatch)

        current?.ops?.push(getOp(curr as any, operationType, opts?.partitionKey))

        return arr
    }, [])

    return batchedOps
}

export async function executeBatchOps(container: Container, batchOps: BulkBatchOps[], opts?: PlaystoricalDbCreateOpts): Promise<any> {
    const reqs = batchOps.map(bulk => new Promise((resolve, reject) => {
        try {
            const operationType = bulk.ops[0]?.operationType // TODO: These should get used per op rather than just the first
            const partitionKeyValue = opts?.partitionKey ? (bulk.ops[0]?.resourceBody[opts.partitionKey] as any) : undefined

            console.log(`[${operationType}] Bulk op ${bulk.batch} (${bulk.ops.length} items) Started...`)

            container.items.batch(bulk.ops, partitionKeyValue)
                .then(function (bulkResp) {
                    const statusCode: number = bulkResp.result?.statusCode || bulkResp.result[0]?.statusCode
                    if (statusCode !== 200 && statusCode !== 201) {
                        return reject(new Error(`${bulk.batch} Batch execution failed`))
                    }

                    console.log(`[${operationType}] Bulk Op ${bulk.batch} Complete!`)

                    return resolve(bulkResp)
                })
                .catch(e => {
                    console.log('Azure batch library failed', e)
                    return reject(new Error('Failed to execute batch ops :('))
                })
        }
        catch (e) {
            console.log('Failed to execute batch ops', e)
            return reject(new Error('Failed to execute batch ops :('))
        }
    }))

    return await Promise.all(reqs.flatMap(r => r))
}

export async function executeBulkOps(container: Container, bulkOps: BulkBatchOps[]): Promise<OperationResponse[]> {
    const execute = async (container: Container, bulkOps: BulkBatchOps[], isRetry?: boolean): Promise<OperationResponse[]> => {
        const reqs = bulkOps.map(async bulk => {
            const operationType = bulk.ops[0]?.operationType // TODO: These should get used per op rather than just the first
            const partitionKey = bulk.ops[0]?.partitionKey as any // TODO: Improve typing here

            console.log(`[${operationType}] Bulk op ${bulk.batch} Started...`, `isRetry: ${!!isRetry}`)
            try {
                const bulkUpsertResp = await container.items.bulk(bulk.ops)

                const isFailedStatus = (res: any) => res.statusCode === 200 && res.statusCode === 201

                const failedUpserts = bulkUpsertResp.filter(isFailedStatus)
                if (failedUpserts.length > 0) {
                    console.error('Failed to upsert some of bulk ops.', bulkUpsertResp.map(r => r.resourceBody?.id))

                    await execute(container, [{
                        batch: bulk.batch,
                        ops: failedUpserts.map(res => getOp(res.resourceBody, operationType, partitionKey))
                    }],
                        true)

                    return Promise.reject('Failed to upsert some of bulk ops. Retry attempted.')
                }

                console.log(`[${operationType}] Bulk Op ${bulk.batch} Complete!`)

                return Promise.resolve(bulkUpsertResp)
            } catch (e) {
                console.log('Failed to bulk upsert', e)

                throw new Error('Failed to bulk upsert. Error logged.')
            }
        });

        return (await Promise.all(reqs)).flat()
    }

    return await execute(container, bulkOps)
}