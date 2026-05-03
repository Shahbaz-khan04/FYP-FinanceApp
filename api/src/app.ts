import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';
import { authRouter } from './routes/auth.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { transactionRouter } from './routes/transaction.routes.js';
import { userRouter } from './routes/user.routes.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(pinoHttp({ logger }));

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/users', userRouter);
  app.use('/categories', categoryRouter);
  app.use('/transactions', transactionRouter);

  app.use(errorHandler);

  return app;
};
