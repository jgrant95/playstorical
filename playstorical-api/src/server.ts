// import http from 'http';
import express, { Express } from 'express';
import morgan from 'morgan';
import snapshotRoutes from './routes/snapshot';

const PORT: any = process.env.PORT || 80;
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
app.use('/snapshot', snapshotRoutes);
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

/** SERVER */
app.listen(PORT, () => {
    console.info(`Running on port: ${PORT}`, { PORT })
})

app.addListener('error', (err: Error) => {
    console.error('END')
})
