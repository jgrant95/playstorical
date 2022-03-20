import { ApisauceInstance, create } from "apisauce"
import axiosRetry from "axios-retry"

import type { AxiosInstance } from "axios"

const retryCount = process.env.RETRY_COUNT || 3
const defaultResponseCodesToRetry = [100, 199, 429, 429, 500, 599]

export const configureAxiosRetry = (apiClient: ApisauceInstance): void => {
  axiosRetry(apiClient.axiosInstance as AxiosInstance, {
    retries: +retryCount,
    retryDelay: (retryCount, error) => {
      console.log(`${error.config.url}: Retry attempt #${retryCount}`)
      return 100
    },
    retryCondition: error => {
      console.log(error.response)
      return defaultResponseCodesToRetry.includes(error?.response?.status ?? 0)
    },
  })
}

export const createApiClient = (baseURL: string) => create({ baseURL: baseURL })
