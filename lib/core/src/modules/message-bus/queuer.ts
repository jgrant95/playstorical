import { AmqpConnectionManager, ChannelWrapper, connect } from 'amqp-connection-manager'
import { Result } from '../../models'

const QUEUE_SERVICE_NAMES = process.env.QUEUE_SERVICE_NAMES || 'queue'
const ERROR_QUEUE_NAME = 'errors'

export class Queuer {
    queues: string[]
    connection: AmqpConnectionManager
    channelWrapper: ChannelWrapper

    constructor(queues: string[]) {
        this.queues = queues
        this.connection = connect(this.getQueueServiceUrls())
        this.channelWrapper = this.connection.createChannel({
            json: true,
            setup: channel =>
                Promise.all([
                    ...queues.map(q => channel.assertQueue(q)),
                    channel.assertQueue(ERROR_QUEUE_NAME),
                    channel.prefetch(1),
                ])
        })

        this.channelWrapper.waitForConnect().then(_ => console.log('Queuer connected!'))
    }

    async sendToQueue(data: any, queue: string): Promise<Result> {
        const id = data && (data['id'] || data['_id'])

        if (!this.queues.includes(queue)) {
            return {
                ok: false,
                error: `Failed to send to queue: ${queue}. Please use one of the following: ${this.queues.join(', ')}. ${id}`
            }
        }

        try {
            await this.channelWrapper.sendToQueue(queue, data)

            const message = id ? `[${queue} - ${id}] Message queued!` : `[${queue}] Message queued!`
            return { ok: true, message }
        } catch (err) {
            const error = id ? `[${queue} - ${id}] Message was rejected!` : `[${queue}] Message was rejected!`
            return { ok: false, error }
        }
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