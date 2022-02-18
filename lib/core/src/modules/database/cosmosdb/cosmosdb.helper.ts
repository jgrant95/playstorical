import { Container, CosmosClient, CreateOperationInput, UpsertOperationInput } from "@azure/cosmos";
import { BatchedOps, BatchedOperationType, BatchedOperations } from "../../../models/database/cosmosdb.model";

export async function getContainerAsync(client: CosmosClient, databaseId: string, containerId: string): Promise<Container> {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });

    console.time('get-container')
    const container = database.container(containerId);
    console.timeEnd('get-container')

    return container
}

export function getOp(item: any, operationType: BatchedOperationType, partitionKey?: string): UpsertOperationInput | CreateOperationInput {
    return {
        operationType,
        partitionKey: partitionKey ? item[partitionKey] : undefined,
        resourceBody: item,
    }
}

export function getBatchedOps<T>(items: T[], operationType: BatchedOperationType, opts?: { partitionKey }): BatchedOps[] {
    const batchedOps = items.reduce((arr: { batch: number, ops: BatchedOperations[] }[], curr, index) => {
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

export async function executeBatchedOps(container: Container, batchedOps: BatchedOps[]) {
    const execute = async (container: Container, batchedOps: BatchedOps[], isRetry?: boolean) => {
        batchedOps.forEach(async batch => {
            const operationType = batch.ops[0]?.operationType // TODO: These should get used per op rather than just the first
            const partitionKey = batch.ops[0]?.partitionKey as any // TODO: Improve typing here

            console.log(`[${operationType}] Batch ${batch.batch} Started...`)
            try {
                const bulkUpsertResp = await container.items.bulk(batch.ops)

                const isFailedStatus = (res: any) => res.statusCode === 200 && res.statusCode === 201

                const failedUpserts = bulkUpsertResp.filter(isFailedStatus)
                if (bulkUpsertResp.some(isFailedStatus)) {
                    console.error('Failed to upsert some of bulk ops.', bulkUpsertResp.map(r => r.resourceBody?.id))
                    return
                }

                await execute(container, [{
                    batch: batch.batch,
                    ops: failedUpserts.map(res => getOp(res.resourceBody, operationType, partitionKey))
                }],
                    true)

                console.log(`[UPSERT] Batch ${batch.batch} Complete!`)
            } catch (e) {
                console.log('Failed to bulk upsert', e)
            }
        });
    }

    await execute(container, batchedOps)
}