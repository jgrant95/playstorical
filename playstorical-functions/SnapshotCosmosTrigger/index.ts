import { AzureFunction, Context } from "@azure/functions"

import { Snapshot, SnapshotBase, SnapshotTrack } from '@playstorical/core/models'
import { getBulkOps, getMusicProvider, getPlaystoricalDbProvider } from '@playstorical/core/modules'
import { getSnapshotTracks } from '@playstorical/core/helpers'

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: (Snapshot | SnapshotTrack)[]): Promise<void> {
    if (!!documents && documents.length > 0) {
        const snapshotDoc = documents[0]
        context.log('Document Id: ', snapshotDoc.id);

        const db = getPlaystoricalDbProvider('cosmosdb')

        if (isNewSnapshot(snapshotDoc)) {
            // ADD ADDITIONAL SNAPSHOT TRACKS
            const spotify = getMusicProvider('spotify')
            spotify.authenticate()

            const nextReqUrl = snapshotDoc.metadata.initAdditionalTracksReq
            if (nextReqUrl) {
                // Spotify only lets you get tracks by playlist ID - there is a chance tracks may not be fully
                // representing the spotify snapshot. This is currently the best option.
                const tracks = await spotify.getAdditionalTracks(snapshotDoc.playlistId, { nextReqUrl })
                const snapshotTracks = getSnapshotTracks(snapshotDoc.snapshotId, tracks)

                const ops = getBulkOps(snapshotTracks, 'Upsert', { partitionKey: snapshotDoc.snapshotId })
                await db.upsert(ops, 'snapshot', { partitionKey: snapshotDoc.snapshotId })
            }
        }

        // UPSERT PLAYLIST

        // INSERT SNAPSHOT HEADER
    }
}

const isNewSnapshot = (snapshot: SnapshotBase): snapshot is Snapshot => snapshot.type === 'snapshot' && !snapshot.updatedAt

export default cosmosDBTrigger;
