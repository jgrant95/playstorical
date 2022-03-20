import { BulkOperationType, CreateOperationInput, UpsertOperationInput } from "@azure/cosmos";

export type BulkBatchOps = {
    batch: number;
    ops: BulkOperations[];
}

export type BulkOperations = CreateOperationInput | UpsertOperationInput
export type BulkOperationType = typeof BulkOperationType.Create | typeof BulkOperationType.Upsert