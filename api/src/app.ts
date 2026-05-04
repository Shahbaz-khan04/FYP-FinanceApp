import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';
import { authRouter } from './routes/auth.routes.js';
import { alertRouter } from './routes/alert.routes.js';
import { budgetRouter } from './routes/budget.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { forecastRouter } from './routes/forecast.routes.js';
import { goalRouter } from './routes/goal.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { helpRouter } from './routes/help.routes.js';
import { reportRouter } from './routes/report.routes.js';
import { recurringJobRouter, recurringRouter } from './routes/recurring.routes.js';
import { receiptRouter } from './routes/receipt.routes.js';
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
  app.use('/alerts', alertRouter);
  app.use('/users', userRouter);
  app.use('/categories', categoryRouter);
  app.use('/transactions', transactionRouter);
  app.use('/dashboard', dashboardRouter);
  app.use('/budgets', budgetRouter);
  app.use('/goals', goalRouter);
  app.use('/reports', reportRouter);
  app.use('/help', helpRouter);
  app.use('/receipts', receiptRouter);
  app.use('/recurring', recurringRouter);
  app.use('/jobs/recurring', recurringJobRouter);
  app.use('/forecast', forecastRouter);

  app.use(errorHandler);

  return app;
};
