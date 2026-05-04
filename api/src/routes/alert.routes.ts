import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { anomalyService } from '../services/anomaly.service.js';
import { HttpError } from '../utils/httpError.js';

const listQuerySchema = z.object({
  includeDismissed: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
});

const detectSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const alertRouter = Router();
alertRouter.use(authMiddleware);

alertRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const query = listQuerySchema.parse(req.query);
    const data = await anomalyService.listAlerts(userId, query.includeDismissed);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

alertRouter.post('/detect', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const payload = detectSchema.parse(req.body ?? {});
    const data = await anomalyService.detectForMonth(userId, payload.month);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

alertRouter.post('/:alertId/dismiss', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    await anomalyService.dismissAlert(userId, req.params.alertId);
    res.json({ data: { ok: true }, error: null });
  } catch (error) {
    next(error);
  }
});
