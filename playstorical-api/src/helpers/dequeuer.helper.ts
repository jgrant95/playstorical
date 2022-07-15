import NodeCache from "node-cache";

import { CAPTURE_SNAPSHOT_ERROR_QUEUE, CAPTURE_SNAPSHOT_QUEUE, DequeuerConfig, UPLOAD_TO_BLOB_ERROR_QUEUE, UPLOAD_TO_BLOB_QUEUE } from "@playstorical/core/modules"
import { capture } from "../services/snapshot.service"
import { MessageBusManagerService } from "../services/message-bus-manager.service";

export const captureSnapshotDequeuer = (busManager: MessageBusManagerService, cache: NodeCache): DequeuerConfig => ({
    name: CAPTURE_SNAPSHOT_QUEUE,
    onMessage: (message, channelWrapper) => {
        if (!message) throw new Error('Capture snapshot message content must not be null')

        const errorQueuer = busManager.getQueuer(CAPTURE_SNAPSHOT_ERROR_QUEUE)
        const captureData = JSON.parse(message.content.toString()) // test if this fails, what kind of error gets thrown?

        capture(captureData, cache)
            .then(async (result) => {
                if (result.ok === false) {
                    channelWrapper.nack(message)
                    return await errorQueuer.sendToQueue(result, CAPTURE_SNAPSHOT_ERROR_QUEUE)
                }

                console.info(result.message)
                channelWrapper.ack(message)
            })
            .catch(async (error) => {
                console.log('An error occurred during dequeuing...')
                console.error(error)

                channelWrapper.nack(message)
                return await errorQueuer.sendToQueue({
                    ...captureData,
                    error
                }, CAPTURE_SNAPSHOT_ERROR_QUEUE)
            })
    }
})

export const uploadToBlobDequeuer = (busManager: MessageBusManagerService, cache: NodeCache): DequeuerConfig => ({
    name: UPLOAD_TO_BLOB_QUEUE,
    onMessage: (message, channelWrapper) => {
        if (!message) throw new Error('Upload to blob message content must not be null')

        const errorQueuer = busManager.getQueuer(UPLOAD_TO_BLOB_ERROR_QUEUE)

        // Typing against the content
        const data = JSON.parse(message.content.toString()) // test if this fails, what kind of error gets thrown?
        const { opts, item }: { opts: { fileName: string, containerName: string }, item: any } = data

        // TODO NEXT: Upload to blob based on message content
        console.log(opts, item)s

        // capture(captureData, cache)
        //     .then(async (result) => {
        //         if (result.ok === false) {
        //             channelWrapper.nack(message)
        //             return await errorQueuer.sendToQueue(result, UPLOAD_TO_BLOB_ERROR_QUEUE)
        //         }

        //         console.info(result.message)
        //         channelWrapper.ack(message)
        //     })
        //     .catch(async (error) => {
        //         console.log('An error occurred during dequeuing...')
        //         console.error(error)

        //         channelWrapper.nack(message)
        //         return await errorQueuer.sendToQueue({
        //             ...captureData,
        //             error
        //         }, UPLOAD_TO_BLOB_ERROR_QUEUE)
        //     })
    }
})