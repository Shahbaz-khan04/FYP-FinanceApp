import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { helpService } from '../services/help.service.js';
import { HttpError } from '../utils/httpError.js';

const faqQuerySchema = z.object({
  search: z.string().max(120).optional(),
});

const submitQuestionSchema = z.object({
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(2000),
});

export const helpRouter = Router();

helpRouter.get('/faqs', async (req, res, next) => {
  try {
    const query = faqQuerySchema.parse(req.query);
    const data = await helpService.listFaqs(query.search);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

helpRouter.get('/faqs/:faqId', async (req, res, next) => {
  try {
    const data = await helpService.getFaqById(req.params.faqId);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

helpRouter.post('/questions', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const payload = submitQuestionSchema.parse(req.body);
    const data = await helpService.submitQuestion(userId, payload);
    res.status(201).json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

helpRouter.get('/questions/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');

    const data = await helpService.listMyQuestions(userId);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});
