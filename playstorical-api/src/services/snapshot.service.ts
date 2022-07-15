import { Result, Snapshot, SnapshotBase, SnapshotTrack } from "@playstorical/core/models"
import { BlobStorage, getMusicProvider, getPlaystoricalDbProvider } from "@playstorical/core/modules"
import { validatePlaylist } from "../helpers/playlist.helper"

import NodeCache from "node-cache";
import moment from "moment";
import { executeAsyncBatches, getSnapshotTracks, tryExecute } from "@playstorical/core/helpers";

const db = getPlaystoricalDbProvider('cosmosdb')
const storage = new BlobStorage()

export async function capture(data: { playlistId, snapshotId, provider }, cache: NodeCache): Promise<Result> {
    // validate input
    const { playlistId, snapshotId, provider } = data

    // check snapshot doesn't already exist in db
    if (snapshotId) {
        const existingSnapshot: Snapshot = await db.get<Snapshot>(snapshotId, 'snapshot', { partitionKeyValue: snapshotId })

        if (existingSnapshot) {
            return getExistingSnapshotResult(existingSnapshot, 'Music provider not used')
        }
    }

    // get music provider
    const musicProvider = getMusicProvider(provider, cache)

    // get playlist from provider
    await musicProvider.authenticate()
    const playlist = await musicProvider.getPlaylist(playlistId)

    // validate playlist - what to do when; snapshotId/playlistId is different (log?), playlist is missing etc
    // should this connect as middleware or just return validation obj or somin else?
    // const validator = { validate: (_req: any, _playlist: any) => ({ errors: [], warnings: [] }) }
    // validator.validate(req, playlist)
    validatePlaylist({ playlistId }, { playlist })
    if (!playlist) throw new Error('Playlist not found') // Figure out how this can be identified by the validate function

    const snapshotCreatedAt = moment()

    const snapshotData: any = {
        ...playlist
    }
    delete snapshotData.tracks

    // setup object to insert
    const snapshot: Snapshot = {
        id: playlist.snapshot_id,
        playlistId,
        snapshotId: playlist.snapshot_id,
        data: snapshotData,
        provider,
        type: 'snapshot',
        createdAt: snapshotCreatedAt,
        metadata: {
            initAdditionalTracksReq: playlist.tracks.next
        }
    }

    const nextTracksReq = playlist?.tracks.next

    // get all tracks for playlist and validate they are ok
    const initTracks: SnapshotTrack[] = [...getSnapshotTracks(playlist.snapshot_id, playlist.tracks.items, { createdAt: snapshotCreatedAt })]
    await uploadToStorage(initTracks, provider)

    if (nextTracksReq) {
        const getAndUploadAdditionalExec = async (next: string) => {
            const resp = await musicProvider.getTracks(playlistId, next)
            const tracks = resp?.items

            if (tracks) {
                const nextTracks = [...getSnapshotTracks(playlist.snapshot_id, tracks, { createdAt: snapshotCreatedAt })]

                await uploadToStorage(nextTracks, provider)

                if (resp.next) {
                    await getAndUploadAdditionalExec(resp.next)
                }
            }
        }

        await getAndUploadAdditionalExec(nextTracksReq)

        // ensure playlist has not changed whilst retrieving tracks
        const postSnapshotId = await musicProvider.getPlaylistSnapshotId(playlistId)

        if (playlist?.snapshot_id !== postSnapshotId) {
            // Todo: Implement retry functionality when we fail because the playlist has changed
            throw new Error('Playlist was changed whilst retrieving tracks. Failed to capture.')
        }
    }

    // Todo: move to validate func, figuring out how we want to maintain this functionality in the future
    if (snapshotId && snapshotId !== playlist.snapshot_id) {
        // if snapshot returned doesn't match validated snapshotId, we need to validate it again
        const existingProviderSnapshot = await db.get<Snapshot>(playlist.snapshot_id, 'snapshot', { partitionKeyValue: playlist.snapshot_id })

        if (existingProviderSnapshot) {
            return getExistingSnapshotResult(existingProviderSnapshot)
        }
    }

    console.log(`Capturing snapshot. PlaylistId: ${playlistId}, SnapshotId: ${playlist.snapshot_id}`)

    // console.log(`Creating snapshot and ${snapshotTracks.length} tracks`)

    // insert snapshot and tracks

    // await uploadToStorage([snapshot, ...snapshotTracks].map(s => ({
    //     ...s,
    //     createdAt: snapshotCreatedAt
    // })), provider)

    // if (results.some(r => !r.success)) {
    //     console.log(`Failed to upload to storage. ${results.filter(r => !r.success).length} failed.`)

    //     throw new Error('Failed to upload to storage. See logs for more details.')
    // }

    // return response object (w/ id)
    return {
        ok: true,
        message: `Snapshot captured. Id: ${snapshot.id}`
    }
}

function getExistingSnapshotResult(snapshot: Snapshot, additionalMsg?: string): { ok: true, message: string } {
    const message = additionalMsg
        ? `Snapshot already exists with Id: ${snapshot?.id}, nothing new was captured. ${additionalMsg}.`
        : `$Snapshot already exists with Id: ${snapshot?.id} , nothing new was captured.`

    return { ok: true, message }
}

async function uploadToStorage(data: SnapshotBase[], provider: string) {
    const container = await storage.getContainerClient(`snapshots`)

    if (!container) {
        throw new Error(`Container not found for provider: 'snapshots'`)
    }

    const uploadExec = (snapshot: SnapshotBase): Promise<void> => {
        const id = `${provider}/${snapshot.type}/${snapshot.id}.json`
        return upload(id, snapshot, container)
    }

    await executeAsyncBatches(data, uploadExec, 25)

    // data.forEach((item) => {
    //     const id = `${provider}/${item.type}/${item.id}.json`

    //     tryExecute(async () => {
    //         return storage.upload(id, Buffer.from(JSON.stringify(item)), container)
    //     }, {
    //         id: 'blob-bulk-upload',
    //         onError: (e) => {
    //             // Any conditions we should try again on? e.g. if (e.statusCode === 409)

    //             console.log('[blob-bulk-upload] Failed', e)
    //         }
    //     }).then()
    // })
}

async function upload(id: string, item: SnapshotBase, container: any) {

    await tryExecute(async () => {
        return await storage.upload(id, Buffer.from(JSON.stringify(item)), container)
    }, {
        id: 'blob-bulk-upload',
        onError: (e) => {
            // Any conditions we should try again on? e.g. if (e.statusCode === 409)

            console.log('[blob-bulk-upload] Failed', e)
        }
    })
}

// async function executeBatchesAsyncv1(args: SnapshotBase[], container, provider) {
//     const concurrencyLimit = 25;
//     // Enhance arguments array to have an index of the argument at hand
//     const argsCopy = ([] as { val: SnapshotBase, ind }[]).concat(args.map((val, ind) => ({ val, ind })));
//     const result = new Array(args.length);
//     const promises = new Array(concurrencyLimit).fill(Promise.resolve());
//     // Recursively chain the next Promise to the currently executed Promise
//     function chainNext(p) {
//         if (argsCopy.length) {
//             const arg = argsCopy.shift();
//             return p.then(() => {
//                 if (!arg) return Promise.resolve()

//                 const id = `${provider}/${arg.val.type}/${arg.val.id}.json`
//                 // Store the result into the array upon Promise completion
//                 const operationPromise = upload(id, arg.val, container).then(r => { result[arg.ind] = r; })
//                 return chainNext(operationPromise);
//             });
//         }
//         return p;
//     }

//     await Promise.all(promises.map(chainNext));
//     return result;
// }

// async function executeBatchesAsyncv3(actions: (() => Promise<any>)[], concurrencyLimit = 25) {
//     // Enhance arguments array to have an index of the argument at hand
//     const argsCopy = ([] as { action: () => Promise<any>, ind }[]).concat(actions.map((action, ind) => ({ action, ind })));
//     const result = new Array(actions.length);
//     const promises = new Array(concurrencyLimit).fill(Promise.resolve());
//     // Recursively chain the next Promise to the currently executed Promise
//     function chainNext(p) {
//         if (argsCopy.length) {
//             const arg = argsCopy.shift();
//             return p.then(() => {
//                 if (!arg) return Promise.resolve()

//                 // Store the result into the array upon Promise completion
//                 const operationPromise = arg.action().then(r => { result[arg.ind] = r; })
//                 return chainNext(operationPromise);
//             });
//         }
//         return p;
//     }

//     await Promise.all(promises.map(chainNext));
//     return result;
// }