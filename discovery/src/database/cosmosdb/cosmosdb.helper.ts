import { Container, CosmosClient, UpsertOperationInput } from "@azure/cosmos";

export async function getContainerAsync(client: CosmosClient, databaseId: string, containerId: string): Promise<Container> {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });

    console.time('get-container')
    const container = database.container(containerId);
    console.timeEnd('get-container')

    return container
}

export function getUpsertOp(item: any, partitionKey?: string): UpsertOperationInput {
    return {
        operationType: "Upsert",
        partitionKey: partitionKey ? item[partitionKey] : undefined,
        resourceBody: item,
    }
}