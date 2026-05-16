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

const statementGenerateSchema = z.object({
  periodType: z.enum(['weekly', 'monthly']),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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

reportRouter.post('/statements/generate', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const payload = statementGenerateSchema.parse(req.body ?? {});
    const data = await reportService.generateStatement(userId, payload.periodType, payload.referenceDate);
    res.status(201).json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

reportRouter.get('/statements', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const data = await reportService.listStatements(userId);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

reportRouter.get('/statements/:statementId/download', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const data = await reportService.getStatementCsv(userId, req.params.statementId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${data.fileName}"`);
    res.status(200).send(data.csvContent);
  } catch (error) {
    next(error);
  }
});
