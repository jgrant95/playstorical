import { AzureFunction, Context } from "@azure/functions"

import { DiscoveryPlaylistHeader } from '@playstorical/core/models'
import { PlaystoricalApi } from "playstorical-functions/services/playstorical-api"

const api = new PlaystoricalApi()

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: DiscoveryPlaylistHeader[]): Promise<void> {
    if (!!documents && documents.length > 0) {
        context.log(`Start processing ${documents.length} items...`);

        await Promise.all(documents.map(async (header) => {
            await captureSnapshot(header)
        }))
    }
}

async function captureSnapshot(header: DiscoveryPlaylistHeader) {
    const { ok, status, data, problem } = await api.captureSnapshot(header.playlistId, header.currentSnapshotId, header.provider)

    if (!ok) {
        throw new Error(`Failed to call api to capture snapshot. Status: ${status}, Problem: ${problem}. ${data}`)
    }

    console.info(`Snapshot captured successfully. ${data}`)

    // TODO: Should we update the header to say it was updated - yes. If this is done by a user, we want to know when and where
    // unless discovery doesnt really care, that's more to playstorical?
}

export default cosmosDBTrigger;
