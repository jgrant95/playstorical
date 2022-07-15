import { BlobServiceClient, ContainerClient } from "@azure/storage-blob"
import { Readable } from "stream"

const AZURE_BLOB_CONNECTION_STRING = process.env.AZURE_BLOB_CONNECTION_STRING || 'DefaultEndpointsProtocol=https;AccountName=playstoricalstorage;AccountKey=Rjd026cPyWbxLsUbTO4Nyv1Yhp/RlzUzxZgw5n+UdZ0DaPtTCXJwCb9O8HJJ6cE00guAhqrdKd7t+AStD41sPQ==;EndpointSuffix=core.windows.net'

export interface UploadResult {
    success: boolean
    id: string
    error?: string
}

export class BlobStorage {
    private _client: BlobServiceClient

    constructor() {
        this._client = BlobServiceClient.fromConnectionString(AZURE_BLOB_CONNECTION_STRING)
    }

    public async getContainerClient(container: string): Promise<ContainerClient | null> {
        const containerClient = this._client.getContainerClient(container);

        try {
            await containerClient.createIfNotExists();

            return containerClient
        } catch (err: any) {
            if (err?.message) console.log(err.message)

            console.log(
                `Getting (potentially creating) a container failed, requestId - ${err?.request?.requestId}, statusCode - ${err?.statusCode}, errorCode - ${err?.details?.errorCode}`
            );

            return null
        }
    }

    async uploadStream(id: string, stream: Readable, container: ContainerClient): Promise<UploadResult> {
        try {
            console.time('get blob block')
            const blockBlobClient = container.getBlockBlobClient(id);
            console.timeEnd('get blob block')

            console.time('upload')
            await blockBlobClient.uploadStream(stream)
            console.timeEnd('upload')

            return { id, success: true }
        } catch (err: any) {
            const msg = `Uploading blob failed, requestId - ${err?.request?.requestId}, statusCode - ${err?.statusCode}, errorCode - ${err?.details?.errorCode}`

            return { id, success: false, error: msg }
        }
    }

    public async upload(id: string, file: Buffer, container: ContainerClient): Promise<UploadResult> {
        try {
            const blockBlobClient = container.getBlockBlobClient(id);

            await blockBlobClient.uploadData(file)

            return { id, success: true }
        } catch (err: any) {
            const msg = `Uploading blob failed, requestId - ${err?.request?.requestId}, statusCode - ${err?.statusCode}, errorCode - ${err?.details?.errorCode}`

            return { id, success: false, error: msg }

        }
    }
    public async download() { }
}