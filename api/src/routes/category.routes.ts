import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { transactionService } from '../services/transaction.service.js';
import { HttpError } from '../utils/httpError.js';

const createCategorySchema = z.object({
  name: z.string().min(2).max(64),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1).max(30),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/),
});

const listCategoryQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
});

export const categoryRouter = Router();
categoryRouter.use(authMiddleware);

categoryRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const query = listCategoryQuerySchema.parse(req.query);
    const categories = await transactionService.listCategories(userId, query.type);

    res.json({ data: categories, error: null });
  } catch (error) {
    next(error);
  }
});

categoryRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const payload = createCategorySchema.parse(req.body);
    const category = await transactionService.createCategory(userId, payload);

    res.status(201).json({ data: category, error: null });
  } catch (error) {
    next(error);
  }
});

categoryRouter.delete('/:categoryId', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    await transactionService.deleteCategory(userId, req.params.categoryId);
    res.json({ data: { ok: true }, error: null });
  } catch (error) {
    next(error);
  }
});
