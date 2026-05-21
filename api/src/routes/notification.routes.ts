import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { notificationService } from '../services/notification.service.js';
import { pushService } from '../services/push.service.js';
import { HttpError } from '../utils/httpError.js';

const listQuerySchema = z.object({
  includeRead: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
});

const generateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  withPush: z.boolean().optional().default(false),
});

const pushTokenSchema = z.object({
  expoPushToken: z.string().min(10),
  platform: z.enum(['ios', 'android']),
  deviceName: z.string().max(120).optional(),
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
    if (payload.withPush) {
      const pushed = await notificationService.dispatchUnreadToPush(userId);
      res.json({ data: { ...data, push: pushed }, error: null });
      return;
    }
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

notificationRouter.post('/push-token', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const payload = pushTokenSchema.parse(req.body);
    const data = await pushService.registerToken(userId, payload);
    res.status(201).json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

notificationRouter.post('/push-dispatch', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const data = await notificationService.dispatchUnreadToPush(userId);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

export const notificationJobRouter = Router();
notificationJobRouter.post('/dispatch-all', async (req, res, next) => {
  try {
    const token = req.headers['x-job-token'];
    if (!env.PUSH_JOB_TOKEN || token !== env.PUSH_JOB_TOKEN) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid job token');
    }
    const userId = String(req.body?.userId ?? '').trim();
    if (!userId) throw new HttpError(400, 'USER_ID_REQUIRED', 'userId is required');
    const generated = await notificationService.generateForUser(userId);
    const pushed = await notificationService.dispatchUnreadToPush(userId);
    res.json({ data: { generated, pushed }, error: null });
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
