import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { notificationService } from '../services/notification.service.js';
import { HttpError } from '../utils/httpError.js';

const listQuerySchema = z.object({
  includeRead: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
});

const generateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const notificationRouter = Router();
notificationRouter.use(authMiddleware);

notificationRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = listQuerySchema.parse(req.query);
    const data = await notificationService.list(userId, query.includeRead);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

notificationRouter.post('/generate', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const payload = generateSchema.parse(req.body ?? {});
    const data = await notificationService.generateForUser(userId, payload.month);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

notificationRouter.post('/:notificationId/read', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    await notificationService.markRead(userId, req.params.notificationId);
    res.json({ data: { ok: true }, error: null });
  } catch (error) {
    next(error);
  }
});

notificationRouter.post('/:notificationId/dismiss', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    await notificationService.dismiss(userId, req.params.notificationId);
    res.json({ data: { ok: true }, error: null });
  } catch (error) {
    next(error);
  }
});
