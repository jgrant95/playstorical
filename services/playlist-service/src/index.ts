import express, { Express } from 'express';
import morgan from 'morgan';

import { logger } from '@playstorical/core/utils';

const PORT = process.env.PORT || 80;
const app: Express = express();

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
app.use('/ok', (_req, res) => res.json({ ok: 'Server is looking A.O.K!' }));
app.get('/favicon.ico', (_req, res) => res.status(204));

/** SERVER */
const server = app.listen(PORT, () => {
    console.info(`Running on port: ${PORT}`, { PORT })
})

server.timeout = 900000

app.addListener('error', (err: Error) => {
    logger.error('Error: ', err);
    logger.error('END')
})

app.on('SIGTERM', () => {
    logger.warn('Gracefully stopping...')

    if (server) {
        server.close()
    }
})

