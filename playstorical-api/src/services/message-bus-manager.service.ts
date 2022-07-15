import { Dequeuer, DequeuerConfig, Queuer } from "@playstorical/core/modules"

export class MessageBusManagerService {
    private queuers: { [key: string]: Queuer } = {}
    private dequeuers: { [key: string]: Dequeuer } = {}

    constructor() { }

    createQueuer(queuerName: string) {
        this.queuers[queuerName] = new Queuer([queuerName])

        return this.queuers[queuerName]
    }

    createDequeuer(config: DequeuerConfig) {
        this.dequeuers[config.name] = new Dequeuer([config])

        return this.dequeuers[config.name]
    }

    getQueuer(queuerName: string) {
        return this.queuers[queuerName]
    }

    getDequeuer(dequeuerName: string) {
        return this.dequeuers[dequeuerName]
    }

    removeQueuer(queuerName: string) {
        delete this.queuers[queuerName]
    }

    removeDequeuer(dequeuerName: string) {
        delete this.dequeuers[dequeuerName]
    }
}