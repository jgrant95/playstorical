import { AzureFunction, Context } from "@azure/functions"

import { Snapshot, SnapshotBase, SnapshotTrack } from '@playstorical/core/models'
import { getMusicProvider, getPlaystoricalDbProvider } from '@playstorical/core/modules'
import { getSnapshotTracks } from '@playstorical/core/helpers'

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: (Snapshot | SnapshotTrack)[]): Promise<void> {
    if (!!documents && documents.length > 0) {
        context.log(`Start processing ${documents.length} items...`);
        await Promise.all(documents.map(async (snapshotDoc) => {
            // const snapshotDoc = documents[0]
            context.log('Document Id: ', snapshotDoc.id);

            const db = getPlaystoricalDbProvider('cosmosdb')

            if (isNewSnapshot(snapshotDoc)) {
                // ADD ADDITIONAL SNAPSHOT TRACKS
                const spotify = getMusicProvider('spotify')
                await spotify.authenticate()

                const nextReqUrl = snapshotDoc.metadata.initAdditionalTracksReq
                if (nextReqUrl) {
                    // Spotify only lets you get tracks by playlist ID - there is a chance tracks may not be fully
                    // representing the spotify snapshot. This is currently the best option.
                    const tracks = await spotify.getAdditionalTracks(snapshotDoc.playlistId, { nextReqUrl })
                    const snapshotTracks = getSnapshotTracks(snapshotDoc.snapshotId, tracks)

                    console.log(`Adding ${snapshotTracks.length} additional tracks`)

                    await db.upsert(snapshotTracks, 'snapshot', { partitionKey: 'snapshotId' })
                }
            }

            // UPSERT PLAYLIST

            // INSERT SNAPSHOT HEADER
        }));
    }
}

const isNewSnapshot = (snapshot: SnapshotBase): snapshot is Snapshot => snapshot.type === 'snapshot' && !snapshot.updatedAt

export default cosmosDBTrigger;
