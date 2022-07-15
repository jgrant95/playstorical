import { AmqpConnectionManager, Channel, ChannelWrapper, connect } from 'amqp-connection-manager'
import { ConsumeMessage } from 'amqplib'

const QUEUE_SERVICE_NAMES = process.env.QUEUE_SERVICE_NAMES || 'queue'

export interface DequeuerConfig {
    name: string,
    onMessage: (message: ConsumeMessage | null, channelWrapper: ChannelWrapper) => void
}

export class Dequeuer {
    queues: string[]
    connection: AmqpConnectionManager
    channelWrapper: ChannelWrapper

    constructor(queueConfig: DequeuerConfig[]) {
        this.queues = queueConfig.map(q => q.name)
        this.connection = connect(this.getQueueServiceUrls())
        this.channelWrapper = this.connection.createChannel({
            json: true,
            setup: (channel: Channel) =>
                Promise.all([
                    ...queueConfig.map(q => channel.assertQueue(q.name)),
                    ...queueConfig.map(q => channel.consume(q.name, message => q.onMessage(message, this.channelWrapper))),
                    channel.prefetch(1)
                ])
        })

        this.channelWrapper.waitForConnect().then(_ => console.log('Dequeuer connected!'))
    }

    onConnect(cb: () => any) {
        return this.connection.on('connect', cb)
    }

    onDisconnect(cb: () => any) {
        return this.connection.on('disconnect', cb)
    }

    private getQueueServiceUrls() {
        return QUEUE_SERVICE_NAMES.split(',').map(queueName => {
            const password = process.env.QUEUE_PASSWORD
            if (!password) {
                return `amqp://${queueName}`
            }

            const username = process.env.QUEUE_USERNAME || 'playstorical'
            return `amqp://${username}:${password}@${queueName}`
        })
    }
}