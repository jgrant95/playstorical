import { ApisauceInstance } from "apisauce"

import { ApiPromise } from "../models/api.model"
import { configureAxiosRetry, createApiClient } from "../helpers/api.helpers"

const apiUrl = process.env.PLAYSTORICAL_API_URL || 'http://localhost:3000'

export class PlaystoricalApi {
    apiUrl: string
    apiClient: ApisauceInstance

    constructor(opts?: any) {
        this.apiUrl = opts?.apiUrl || apiUrl
        this.apiClient = createApiClient(this.apiUrl)

        configureAxiosRetry(this.apiClient)
    }

    captureSnapshot(playlistId: string, snapshotId: string, provider: string): ApiPromise<string> {
        return this.apiClient.post(`snapshot/capture`, { playlistId, snapshotId, provider })
    }
}