import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { receiptService } from '../services/receipt.service.js';
import { HttpError } from '../utils/httpError.js';

const scanSchema = z.object({
  imageBase64: z.string().min(20).optional(),
  imageUrl: z.string().url().optional(),
});

const linkSchema = z.object({
  transactionId: z.string().uuid(),
});

export const receiptRouter = Router();
receiptRouter.use(authMiddleware);

receiptRouter.post('/scan', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const payload = scanSchema.parse(req.body);
    const data = await receiptService.scanReceipt(userId, payload);
    res.status(201).json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

receiptRouter.post('/:receiptId/link', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const payload = linkSchema.parse(req.body);
    const data = await receiptService.linkTransaction(userId, req.params.receiptId, payload.transactionId);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});
