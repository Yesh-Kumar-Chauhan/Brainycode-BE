// routes.ts
import express from 'express';
import authRouter from './auth/authRoutes';
import codeRouter from './code/codeRoutes';
import subscriptionRouter from './subscription/subscriptionRoutes';

const mainRouter = express.Router();

mainRouter.use('/api/auth', authRouter);
mainRouter.use('/api/code', codeRouter);
mainRouter.use('/api/subscription', subscriptionRouter);

export default mainRouter;
