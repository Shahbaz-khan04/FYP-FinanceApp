import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { forecastService } from '../services/forecast.service.js';
import { HttpError } from '../utils/httpError.js';

export const forecastRouter = Router();
forecastRouter.use(authMiddleware);

forecastRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    const data = await forecastService.getForecast(userId);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

