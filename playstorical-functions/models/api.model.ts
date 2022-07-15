import { ApiResponse } from "apisauce";

export type ApiPromise<T, U = T> = Promise<ApiResponse<T, U>>
