import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { budgetService } from '../services/budget.service.js';
import { HttpError } from '../utils/httpError.js';

const budgetQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

const createBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: z.string().uuid(),
  plannedAmount: z.number().positive(),
});

const updateBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  categoryId: z.string().uuid().optional(),
  plannedAmount: z.number().positive().optional(),
});

export const budgetRouter = Router();
budgetRouter.use(authMiddleware);

budgetRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = budgetQuerySchema.parse(req.query);
    const data = await budgetService.listBudgets(userId, query.month);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

budgetRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const payload = createBudgetSchema.parse(req.body);
    const data = await budgetService.createBudget(userId, payload);
    res.status(201).json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

budgetRouter.patch('/:budgetId', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const payload = updateBudgetSchema.parse(req.body);
    const data = await budgetService.updateBudget(userId, req.params.budgetId, payload);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

budgetRouter.delete('/:budgetId', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    await budgetService.deleteBudget(userId, req.params.budgetId);
    res.json({ data: { ok: true }, error: null });
  } catch (error) {
    next(error);
  }
});

