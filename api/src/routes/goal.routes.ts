import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { goalService } from '../services/goal.service.js';
import { HttpError } from '../utils/httpError.js';

const createGoalSchema = z.object({
  title: z.string().min(2).max(120),
  targetAmount: z.number().positive(),
  savedAmount: z.number().min(0).default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const updateGoalSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  targetAmount: z.number().positive().optional(),
  savedAmount: z.number().min(0).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isCompleted: z.boolean().optional(),
});

export const goalRouter = Router();
goalRouter.use(authMiddleware);

goalRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const goals = await goalService.listGoals(userId);
    res.json({ data: goals, error: null });
  } catch (error) {
    next(error);
  }
});

goalRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const payload = createGoalSchema.parse(req.body);
    const goal = await goalService.createGoal(userId, payload);
    res.status(201).json({ data: goal, error: null });
  } catch (error) {
    next(error);
  }
});

goalRouter.patch('/:goalId', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const payload = updateGoalSchema.parse(req.body);
    const goal = await goalService.updateGoal(userId, req.params.goalId, payload);
    res.json({ data: goal, error: null });
  } catch (error) {
    next(error);
  }
});

goalRouter.post('/:goalId/complete', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const goal = await goalService.updateGoal(userId, req.params.goalId, { isCompleted: true });
    res.json({ data: goal, error: null });
  } catch (error) {
    next(error);
  }
});

goalRouter.delete('/:goalId', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    await goalService.deleteGoal(userId, req.params.goalId);
    res.json({ data: { ok: true }, error: null });
  } catch (error) {
    next(error);
  }
});

