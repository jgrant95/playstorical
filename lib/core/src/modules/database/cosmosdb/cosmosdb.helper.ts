import { Container, CosmosClient, CreateOperationInput, OperationResponse, Response, UpsertOperationInput } from "@azure/cosmos";
import { tryExecute } from "../../../helpers";

import { PlaystoricalDbCreateOpts } from "../../../models";
import { BulkOps, BulkOperationType, BulkOperations } from "../../../models/database/cosmosdb.model";

export async function getContainerAsync(client: CosmosClient, databaseId: string, containerId: string): Promise<Container> {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });

    const container = database.container(containerId);

    return container
}

export function getOp(item: any, operationType: BulkOperationType, partitionKey?: string): UpsertOperationInput | CreateOperationInput {
    return {
        operationType,
        resourceBody: item,
    }
}

export function getBulkOps<T>(items: T[], operationType: BulkOperationType, opts?: { partitionKey, batchQuantity?: number }): BulkOps[] {
    const batchedOps = items.reduce((arr: { batch: number, ops: BulkOperations[] }[], curr, index) => {
        let currentBatch = arr.length ? Math.max(...arr.map(x => x.batch)) : 0
        const batchQuantity = opts?.batchQuantity ?? 100

        // Add new batch with ops
        if (index % batchQuantity === 0) {
            currentBatch = currentBatch + 1
            arr.push({ batch: currentBatch, ops: [] })
        }

        const current = arr.find(x => x.batch === currentBatch)

        current?.ops?.push(getOp(curr as any, operationType, opts?.partitionKey))

        return arr
    }, [])

    return batchedOps
}

// Batch is a transactional db operation
// Todo: generics for response returned?
export async function executeBatchOps(container: Container, ops: BulkOperations[], opts?: PlaystoricalDbCreateOpts): Promise<Response<any>> {
    if (ops.length > 100) throw new Error('Ops must be less than 100')

    return await tryExecute(async () => {
        const partitionKeyValue = opts?.partitionKey ? (ops[0]?.resourceBody[opts.partitionKey] as any) : undefined

        return container.items.batch(ops, partitionKeyValue)
            .then(function (bulkResp) {
                const statusCode: number = bulkResp.result?.statusCode || bulkResp.result[0]?.statusCode
                if (statusCode !== 200 && statusCode !== 201) {
                    console.error(bulkResp.result)
                    return Promise.reject(new Error(`Batch execution failed. Status: ${statusCode}`))
                }

                return Promise.resolve(bulkResp)
            })
            .catch((err) => Promise.reject(err))
    }, {
        id: 'batch-execute',
        onError: (e) => {
            if (isReqRateTooLarge429(e)) return

            console.log('[batch-execute] Failed', e)
        }
    })
}

export async function executeBulkOps(container: Container, bulkOps: BulkOps[]): Promise<OperationResponse[]> {
    const execute = async (container: Container, bulkOps: BulkOps[]): Promise<OperationResponse[]> => {
        const results: OperationResponse[] = []
        for (const bulk of bulkOps) {
            let opsRemaining: BulkOperations[] = [...bulk.ops]

            const result = await tryExecute(async () => {
                const initOpCount = opsRemaining.length
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
                        return Promise.reject(`Failed to upsert some (${opsRemaining.length / initOpCount}) of bulk ops.`)
                    }

                    return Promise.resolve(bulkUpsertResp)
                } catch (e) {
                    console.log('Failed to bulk upsert', e)

                    throw new Error('Failed to bulk upsert. Error logged.')
                }
            }, {
                id: 'bulk-execute',
                onError: (e) => {
                    if (isReqRateTooLarge429(e)) return

                    console.log('[bulk-execute] Failed', e)
                }
            })

            results.push(...result)
        }

        return results
    }

    return await execute(container, bulkOps)
}

function isReqRateTooLarge429(e) {
    return e?.message?.includes && e.message.includes('StatusCode: 429')
}
