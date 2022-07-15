export declare type PaginationRequest<T> = (params: {
    offset: number;
    limit: number;
}) => Promise<PaginationResult<T>>;
export interface PaginationResult<T> {
    total: number;
    offset: number;
    limit: number;
    entity: T;
}
//# sourceMappingURL=pagination.model.d.ts.map