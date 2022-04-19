import { Container, CosmosClient, CreateOperationInput, OperationResponse, UpsertOperationInput } from "@azure/cosmos";
import { tryExecute } from "src/helpers";

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
    const reqs = batchOps.map(bulk => tryExecute(async () => {
        return new Promise((resolve, reject) => {
            try {
                const partitionKeyValue = opts?.partitionKey ? (bulk.ops[0]?.resourceBody[opts.partitionKey] as any) : undefined

                container.items.batch(bulk.ops, partitionKeyValue)
                    .then(function (bulkResp) {
                        const statusCode: number = bulkResp.result?.statusCode || bulkResp.result[0]?.statusCode
                        if (statusCode !== 200 && statusCode !== 201) {
                            return reject(new Error(`${bulk.batch} Batch execution failed`))
                        }

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
        })
    }, { id: 'batch-execute' }))

    return await Promise.all(reqs.flatMap(r => r))
}

export async function executeBulkOps(container: Container, bulkOps: BulkBatchOps[]): Promise<OperationResponse[]> {
    const execute = async (container: Container, bulkOps: BulkBatchOps[]): Promise<OperationResponse[]> => {
        const reqs = bulkOps.map(async (bulk) => {
            let opsRemaining: BulkOperations[] = [...bulk.ops]

            return tryExecute(async () => {
                const operationType = opsRemaining[0]?.operationType // TODO: These should get used per op rather than just the first
                const partitionKey = opsRemaining[0]?.partitionKey as any // TODO: Improve typing here

                try {
                    const bulkUpsertResp = await container.items.bulk(opsRemaining)

                    const isFailedStatus = (res: any) => res.statusCode === 200 && res.statusCode === 201

                    opsRemaining = bulkUpsertResp
                        .filter(isFailedStatus)
                        .map(res => getOp(res.resourceBody, operationType, partitionKey))

                    if (opsRemaining.length > 0) {
                        console.error('Failed to execute some of bulk ops.', bulkUpsertResp.map(r => r.resourceBody?.id))

                        // This will trigger retry
                        return Promise.reject('Failed to upsert some of bulk ops. Retry attempted.')
                    }

                    return Promise.resolve(bulkUpsertResp)
                } catch (e) {
                    console.log('Failed to bulk upsert', e)

                    throw new Error('Failed to bulk upsert. Error logged.')
                }
            }, { id: 'bulk-execute' })
        });

        return (await Promise.all(reqs)).flat()
    }

    return await execute(container, bulkOps)
}