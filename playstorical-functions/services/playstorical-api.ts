import { ApisauceInstance } from "apisauce"

import { ApiPromise } from "../models/api.model"
import { configureAxiosRetry, createApiClient } from "../helpers/api.helpers"

export class PlaystoricalApi {
    apiUrl: string
    apiClient: ApisauceInstance

    constructor(opts?: any) {
        this.apiUrl = opts?.apiUrl || 'http://localhost:3000'
        this.apiClient = createApiClient(this.apiUrl)

        configureAxiosRetry(this.apiClient)
    }

    captureSnapshot(playlistId: string, snapshotId: string, provider: string): ApiPromise<string> {
        return this.apiClient.post(`snapshot/capture`, { playlistId, snapshotId, provider })
    }
}