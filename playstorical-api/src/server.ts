// import http from 'http';
import { Dequeuer, Queuer, } from '@playstorical/core/modules';
import express, { Express } from 'express';
import morgan from 'morgan';
import { getSnapshotRoutes } from './routes/snapshot';
import { capture } from './services/snapshot.service';
import NodeCache from "node-cache";

const PORT: any = process.env.PORT || 80;
const app: Express = express();
const cache = new NodeCache()

let server

/** LOGGING */
app.use(morgan('dev')); // Todo: Setup for production
/** PARSE REQUEST */
app.use(express.urlencoded({ extended: false }));
/** SETUP JSON MIDDLEWARE */
app.use(express.json());

/** RULES OF OUR API */
app.use((req, res, next) => {
    // set the CORS policy
    res.header('Access-Control-Allow-Origin', '*');
    // set the CORS headers
    res.header('Access-Control-Allow-Headers', 'origin, X-Requested-With,Content-Type,Accept, Authorization');
    // set the CORS method headers
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST');
        return res.status(200).json({});
    }
    next();
});

/** ROUTES */
app.use('/snapshot', getSnapshotRoutes(cache));
app.use('/ok', (req, res, next) => res.json({ ok: 'Server is looking A.O.K!' }));
app.get('/favicon.ico', (req, res) => res.status(204));

/** ERROR HANDLING */
app.use((req, res, next) => {
    console.log('AN ERROR HAS HAPPENED :)')
    // const error = new Error('not found');
    // return res.status(404).json({
    //     message: error.message
    // });
    res.status(500).send()
});

app.addListener('error', (err: Error) => {
    console.error('END')
})

app.on('SIGTERM', () => {
    console.warn('Gracefully stopping...')

    if (server) {
        server.close()
    }
})

const errorQueuer = new Queuer(['errors'])

const dequeuer = new Dequeuer([{
    name: 'capture-snapshot',
    onMessage: (message, channelWrapper) => {
        const captureData = JSON.parse(message.content.toString()) // test if this fails, what kind of error gets thrown?
        capture(captureData, cache)
            .then((result) => {
                if (result.ok === false) {
                    // Todo: Come up with robust error queueing + model
                    channelWrapper.nack(message)
                    return errorQueuer.sendToQueue(result, 'errors').then()
                }

                console.info(result.message)
                channelWrapper.ack(message)
            })
            .catch((err) => {
                console.log('An error occurred during dequeuing...')
                console.error(err)

                channelWrapper.nack(message)
                return errorQueuer.sendToQueue(err, 'errors').then()
            })
    }
}])

dequeuer.onConnect(() => {
    /** SERVER */
    server = app.listen(PORT, () => {
        console.info(`Running on port: ${PORT}`, { PORT })
    })

    server.timeout = 900000
})

dequeuer.onDisconnect(() => {
    if (server) {
        server.close()
    }
})
