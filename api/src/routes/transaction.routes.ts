import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { transactionService } from '../services/transaction.service.js';
import { HttpError } from '../utils/httpError.js';

const transactionTypeSchema = z.enum(['income', 'expense']);

const createTransactionSchema = z.object({
  amount: z.number().positive(),
  type: transactionTypeSchema,
  categoryId: z.string().uuid().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().min(3).max(3),
  paymentMethod: z.string().min(2).max(50),
  notes: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

const listTransactionQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().max(100).optional(),
});

export const transactionRouter = Router();
transactionRouter.use(authMiddleware);

transactionRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const query = listTransactionQuerySchema.parse(req.query);
    const transactions = await transactionService.listTransactions(userId, query);
    res.json({ data: transactions, error: null });
  } catch (error) {
    next(error);
  }
});

transactionRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const payload = createTransactionSchema.parse(req.body);
    const transaction = await transactionService.createTransaction(userId, {
      amount: payload.amount,
      type: payload.type,
      category_id: payload.categoryId,
      date: payload.date,
      currency: payload.currency.toUpperCase(),
      payment_method: payload.paymentMethod,
      notes: payload.notes ?? null,
      tags: payload.tags ?? [],
    });

    res.status(201).json({ data: transaction, error: null });
  } catch (error) {
    next(error);
  }
});

transactionRouter.patch('/:transactionId', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const payload = updateTransactionSchema.parse(req.body);
    const updated = await transactionService.updateTransaction(userId, req.params.transactionId, {
      ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.categoryId !== undefined ? { category_id: payload.categoryId } : {}),
      ...(payload.date !== undefined ? { date: payload.date } : {}),
      ...(payload.currency !== undefined ? { currency: payload.currency.toUpperCase() } : {}),
      ...(payload.paymentMethod !== undefined ? { payment_method: payload.paymentMethod } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
    });

    res.json({ data: updated, error: null });
  } catch (error) {
    next(error);
  }
});

transactionRouter.delete('/:transactionId', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    await transactionService.deleteTransaction(userId, req.params.transactionId);
    res.json({ data: { ok: true }, error: null });
  } catch (error) {
    next(error);
  }
});

