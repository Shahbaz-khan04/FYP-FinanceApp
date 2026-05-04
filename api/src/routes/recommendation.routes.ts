import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { recommendationService } from '../services/recommendation.service.js';
import { HttpError } from '../utils/httpError.js';

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const recommendationRouter = Router();
recommendationRouter.use(authMiddleware);

recommendationRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const query = querySchema.parse(req.query);
    const data = await recommendationService.getRecommendations(userId, query.month);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});
