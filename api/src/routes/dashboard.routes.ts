import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { dashboardService } from '../services/dashboard.service.js';
import { HttpError } from '../utils/httpError.js';

const summaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const monthlyTotalsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional(),
});

const categoryBreakdownQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get('/summary', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = summaryQuerySchema.parse(req.query);
    const data = await dashboardService.getSummary(userId, query.month);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get('/monthly-totals', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = monthlyTotalsQuerySchema.parse(req.query);
    const data = await dashboardService.getMonthlyTotals(userId, query.months ?? 6);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get('/category-breakdown', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = categoryBreakdownQuerySchema.parse(req.query);
    const data = await dashboardService.getCategoryBreakdown(userId, query.month);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

