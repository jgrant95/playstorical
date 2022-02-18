import { OperationInput, BulkOperationType, CreateOperationInput, UpsertOperationInput } from "@azure/cosmos";

export type BatchedOps = {
    batch: number;
    ops: BatchedOperations[];
}

export type BatchedOperations = CreateOperationInput | UpsertOperationInput
export type BatchedOperationType = typeof BulkOperationType.Create | typeof BulkOperationType.Upsert