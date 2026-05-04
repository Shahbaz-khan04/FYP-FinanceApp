import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { fxService } from '../services/fx.service.js';

const ratesQuerySchema = z.object({
  base: z.string().length(3).optional().default('USD'),
});

export const fxRouter = Router();
fxRouter.use(authMiddleware);

fxRouter.get('/currencies', async (_req, res, next) => {
  try {
    const data = await fxService.listCurrencies();
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});

fxRouter.get('/rates', async (req, res, next) => {
  try {
    const query = ratesQuerySchema.parse(req.query);
    const data = await fxService.latestRates(query.base);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
});
