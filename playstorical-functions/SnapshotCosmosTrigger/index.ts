import { AzureFunction, Context } from "@azure/functions"

import { Playlist, Snapshot, SnapshotBase, SnapshotHeader, SnapshotTrack } from '@playstorical/core/models'
import { Cosmosdb, getMusicProvider, getPlaystoricalDbProvider } from '@playstorical/core/modules'
import { getSnapshotTracks } from '@playstorical/core/helpers'

const cosmosDBTrigger: AzureFunction = async function (context: Context, documents: (Snapshot | SnapshotTrack)[]): Promise<void> {
    if (!!documents && documents.length > 0) {
        context.log(`Start processing ${documents.length} items...`);
        await Promise.all(documents.map(async (snapshotDoc) => {
            const db = getPlaystoricalDbProvider('cosmosdb')

            if (isSnapshot(snapshotDoc)) {
                await addAdditionalTracks(db, snapshotDoc)
                await upsertPlaylistDocs(db, snapshotDoc)
            }
        }));
    }
}

const isSnapshot = (snapshot: SnapshotBase): snapshot is Snapshot => snapshot.type === 'snapshot'

async function addAdditionalTracks(db: Cosmosdb, snapshotDoc: Snapshot) {
    const spotify = getMusicProvider('spotify')
    await spotify.authenticate()

    const nextReqUrl = snapshotDoc.metadata.initAdditionalTracksReq
    if (nextReqUrl) {
        // Spotify only lets you get tracks by playlist ID - there is a chance tracks may not be fully
        // representing the spotify snapshot. This is currently the best option.
        const tracks = await spotify.getAdditionalTracks(snapshotDoc.playlistId, { nextReqUrl })
        const snapshotTracks = getSnapshotTracks(snapshotDoc.snapshotId, tracks)

        console.log(`Adding ${snapshotTracks.length} additional tracks`)

        await db.upsert(snapshotTracks, 'snapshot', { partitionKey: 'snapshotId', batchTransaction: true })
    }
}

async function upsertPlaylistDocs(db: Cosmosdb, snapshotDoc: Snapshot) {
    const playlist: Playlist = {
        id: snapshotDoc.playlistId,
        playlistId: snapshotDoc.playlistId,
        currentSnapshot: snapshotDoc,
        type: 'playlist'
    }

    const snapshotHeader: SnapshotHeader = {
        id: snapshotDoc.id,
        playlistId: snapshotDoc.playlistId,
        createdAt: snapshotDoc.createdAt,
        type: 'snapshot-header'
    }

    await db.upsert([playlist, snapshotHeader], 'playlist', { partitionKey: 'playlistId', batchTransaction: true })
}

export default cosmosDBTrigger;
