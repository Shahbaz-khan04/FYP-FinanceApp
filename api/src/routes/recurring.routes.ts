import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { recurringService } from '../services/recurring.service.js';
import { HttpError } from '../utils/httpError.js';

const frequencySchema = z.enum(['weekly', 'monthly', 'custom']);

const createRuleSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  frequency: frequencySchema,
  customDays: z.number().int().min(1).max(365).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateRuleSchema = z.object({
  amount: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  frequency: frequencySchema.optional(),
  customDays: z.number().int().min(1).max(365).optional(),
  isPaused: z.boolean().optional(),
});

export const recurringRouter = Router();
recurringRouter.use(authMiddleware);

recurringRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const data = await recurringService.listRules(userId);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

recurringRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const payload = createRuleSchema.parse(req.body);
    const data = await recurringService.createRule(userId, payload);
    res.status(201).json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

recurringRouter.patch('/:ruleId', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const payload = updateRuleSchema.parse(req.body);
    const data = await recurringService.updateRule(userId, req.params.ruleId, payload);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

recurringRouter.delete('/:ruleId', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    await recurringService.deleteRule(userId, req.params.ruleId);
    res.json({ data: { ok: true }, error: null });
  } catch (error) {
    next(error);
  }
});

recurringRouter.post('/process-mine', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const data = await recurringService.processDueRules(userId);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

export const recurringJobRouter = Router();
recurringJobRouter.post('/process-due', async (req, res, next) => {
  try {
    const token = req.headers['x-job-token'];
    if (!env.RECURRING_JOB_TOKEN || token !== env.RECURRING_JOB_TOKEN) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid job token');
    }
    const data = await recurringService.processDueRules();
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

