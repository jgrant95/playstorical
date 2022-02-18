import { Container, CosmosClient, UpsertOperationInput } from "@azure/cosmos";
export declare function getContainerAsync(client: CosmosClient, databaseId: string, containerId: string): Promise<Container>;
export declare function getUpsertOp(item: any, partitionKey?: string): UpsertOperationInput;
//# sourceMappingURL=cosmosdb.helper.d.ts.map