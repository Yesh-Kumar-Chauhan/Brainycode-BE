// index.ts
import express, { Express, Request, Response } from 'express';
import mainRouter from './routes/routes';
import { sequelize } from './config/database';
import cors from 'cors';
import serverless from 'serverless-http';

const app: Express = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware
// app.use(cors()); // Enable CORS

app.use(
    cors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        //credentials: true,
    })
);

// app.use('/api/subscription/webhook', express.raw({ type : 'application/json'}));

// app.use(express.json()); 

app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/subscription/webhook')) {
        next(); // Do nothing with the body because I need it in a raw state.
    } else {
        express.json({limit: '50mb'})(req, res, next);  // ONLY do express.json() if the received request is NOT a WebHook from Stripe.
    }
});
app.use(mainRouter);

// Synchronize all models with the database
(async () => {
    await sequelize.sync()
        .then(() => {
            console.log('Database and tables synchronized');
            // Start your Express server
            app.listen(port, () => {
                console.log(`Server is running on http://localhost:${port}`);
            });
        })
        .catch((error: any) => {
            console.error('Error synchronizing database:', error);
        });
})();


// Default route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to your brainycode!');
});

module.exports.handler = serverless(app);