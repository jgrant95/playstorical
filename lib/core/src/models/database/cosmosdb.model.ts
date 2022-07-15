import { BulkOperationType, CreateOperationInput, UpsertOperationInput } from "@azure/cosmos";

export type BulkOps = {
    batch: number;
    ops: BulkOperations[];
}

export type BulkOperations = CreateOperationInput | UpsertOperationInput
export type BulkOperationType = typeof BulkOperationType.Create | typeof BulkOperationType.Upsert

export type FailedBulkOperation = BulkOperations & {
    error: any
}
export interface OperationErrorResponse {
    failedOps: FailedBulkOperation[]
}