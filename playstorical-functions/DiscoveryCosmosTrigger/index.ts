import { AzureFunction, Context } from "@azure/functions"

import { DiscoveryPlaylistHeader } from '@playstorical/core/models'
import { Queuer } from "@playstorical/core/modules"

const queuer = new Queuer(['capture-snapshot'])

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: DiscoveryPlaylistHeader[]): Promise<void> {
    if (!!documents && documents.length > 0) {
        context.log(`Start processing ${documents.length} items...`);

        await Promise.all(documents.map(async (header) => {
            await captureSnapshot(header)
        }))
    }
}

async function captureSnapshot({ currentSnapshotId, ...header }: DiscoveryPlaylistHeader) {
    const captureDto = {
        ...header,
        snapshotId: currentSnapshotId
    }

    const result = await queuer.sendToQueue(captureDto, 'capture-snapshot')
    if (result.ok === false) {
        throw new Error(`Failed to call api to capture snapshot. Error: ${result.error}`)
    }

    console.info(result.message)

    // TODO: Should we update the header to say it was updated - yes. If this is done by a user, we want to know when and where
    // unless discovery doesnt really care, that's more to playstorical?
}

export default cosmosDBTrigger;
