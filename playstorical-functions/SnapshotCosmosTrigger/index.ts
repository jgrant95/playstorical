import { AzureFunction, Context } from "@azure/functions"

import { Snapshot, SnapshotBase, SnapshotTrack } from '@playstorical/core/models'
import { getMusicProvider } from '@playstorical/core/modules'

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: (Snapshot | SnapshotTrack)[]): Promise<void> {
    if (!!documents && documents.length > 0) {
        const snapshotDoc = documents[0]
        context.log('Document Id: ', snapshotDoc.id);

        if (isNewSnapshot(snapshotDoc)) {
            // ADD ADDITIONAL SNAPSHOT TRACKS
            const spotify = getMusicProvider('spotify')
            spotify.authenticate()
            spotify.getPlaylist

            // TODO: figure out best way to get additional snapshot tracks, being optimal and agnostic.

            const newTrack = {
                id: '1',
                type: 'snapshot-track',
                test: 'Blobby1',
                snapshotId: '111' || snapshotDoc.snapshotId
            }

            context.bindings.snapshotDocumentOutput = newTrack
            // TODO: Change to use cosmosdb client to handle batch upsert ops 
            //       and make transactional. If it fails, the function should retry.
        }

        // UPSERT PLAYLIST

        // INSERT SNAPSHOT HEADER
    }
}

const isNewSnapshot = (snapshot: SnapshotBase) => snapshot.type === 'snapshot' && !snapshot.updatedAt

export default cosmosDBTrigger;
