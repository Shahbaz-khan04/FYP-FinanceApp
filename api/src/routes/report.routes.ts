import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { reportService } from '../services/report.service.js';
import { HttpError } from '../utils/httpError.js';

const rangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const trendSchema = rangeSchema.extend({
  granularity: z.enum(['daily', 'weekly']).default('daily'),
});

const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const reportRouter = Router();
reportRouter.use(authMiddleware);

reportRouter.get('/income-expenses', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = rangeSchema.parse(req.query);
    const data = await reportService.incomeVsExpenses(userId, query.startDate, query.endDate);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

reportRouter.get('/category-spending', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = rangeSchema.parse(req.query);
    const data = await reportService.categorySpending(userId, query.startDate, query.endDate);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

reportRouter.get('/spending-trend', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = trendSchema.parse(req.query);
    const data = await reportService.spendingTrend(
      userId,
      query.startDate,
      query.endDate,
      query.granularity,
    );
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

reportRouter.get('/budget-vs-actual', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = budgetSchema.parse(req.query);
    const data = await reportService.budgetVsActual(userId, query.month);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

reportRouter.get('/goal-progress', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const data = await reportService.goalProgress(userId);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

