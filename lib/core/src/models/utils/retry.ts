import AsyncRetry from "async-retry";

export type RetryOptions = Pick<AsyncRetry.Options, 'retries' | 'factor' | 'minTimeout'>