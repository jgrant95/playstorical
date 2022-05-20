import AsyncRetry from "async-retry"

import { RetryOptions } from "../models"

export async function tryExecute<T>(fn: (bail: (e) => void) => T, opts: { id: string, retry?: RetryOptions, onError?: (e, attempt: number) => void }) {
    // Todo: Fix issue where incoming opts if set to zero, gets set to default values here
    const retryOpts = {
        factor: opts.retry?.factor || 2,
        minTimeout: opts.retry?.minTimeout || 5000,
        retries: opts.retry?.retries || 3
    }

    let attempt = 0
    try {
        return await AsyncRetry(async (bail) => fn(bail), {
            onRetry: (err) => {
                const waitMs = retryOpts.factor ** attempt * retryOpts.minTimeout

                attempt++

                if (opts.onError) {
                    opts.onError(err, attempt)
                }

                console.log(`[${opts.id}] - Retry ${attempt} will be attempted in ${waitMs}ms`)
            },
            ...retryOpts
        })
    }
    catch (err) {
        console.log(`[${opts.id}] - Failed attempts to execute. (${attempt}/${retryOpts.retries} retries).`)

        throw err
    }
}