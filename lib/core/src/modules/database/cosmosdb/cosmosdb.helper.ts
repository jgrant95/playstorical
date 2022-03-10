import { Container, CosmosClient, CreateOperationInput, UpsertOperationInput } from "@azure/cosmos";
import { PlaystoricalDbCreateOpts } from "../../../models";
import { BulkOps, BulkOperationType, BulkOperations } from "../../../models/database/cosmosdb.model";

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

export function getBulkOps<T>(items: T[], operationType: BulkOperationType, opts?: { partitionKey }): BulkOps[] {
    const batchedOps = items.reduce((arr: { batch: number, ops: BulkOperations[] }[], curr, index) => {
        let currentBatch = arr.length ? Math.max(...arr.map(x => x.batch)) : 0

        // Add new batch with ops
        if (index % 100 === 0 || index == 1) {
            currentBatch = currentBatch + 1
            arr.push({ batch: currentBatch, ops: [] })
        }

        const current = arr.find(x => x.batch === currentBatch)

        current?.ops?.push(getOp(curr as any, operationType, opts?.partitionKey))

        return arr
    }, [])

    return batchedOps
}

export async function executeBulkOps(container: Container, bulkOps: BulkOps[], opts?: PlaystoricalDbCreateOpts): Promise<any[]> {
    const execute = async (container: Container, bulkOps: BulkOps[], isRetry?: boolean): Promise<any[]> => {
        const reqs = bulkOps.map(async bulk => {
            const operationType = bulk.ops[0]?.operationType // TODO: These should get used per op rather than just the first
            const partitionKeyValue = opts?.partitionKey ? (bulk.ops[0]?.resourceBody[opts.partitionKey] as any) : undefined

            console.log(`[${operationType}] Bulk op ${bulk.batch} (${bulk.ops.length} items) Started...`, `isRetry: ${!!isRetry}`)
            try {
                const bulkResp = await container.items.batch(bulk.ops, partitionKeyValue)

                const statusCode: number = bulkResp.result?.statusCode || bulkResp.result[0]?.statusCode
                if (statusCode !== 200 && statusCode !== 201) {
                    throw bulkResp
                }

                console.log(`[${operationType}] Bulk Op ${bulk.batch} Complete!`)

                return Promise.resolve(bulkResp)
            } catch (e) {
                console.log(`[${operationType}]Failed to execute bulk ops`, e)

                throw new Error(`[${operationType}] Failed to execute bulk ops. Error logged.`)
            }
        });

        return await (await Promise.all(reqs)).flat()
    }

    return await execute(container, bulkOps)
}