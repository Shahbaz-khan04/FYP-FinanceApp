import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { userService } from '../services/user.service.js';
import { HttpError } from '../utils/httpError.js';

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().min(6).max(24).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const userRouter = Router();

userRouter.use(authMiddleware);

userRouter.get('/me', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const user = await userService.findById(userId);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json({
      data: userService.toPublicUser(user),
      error: null,
    });
  } catch (error) {
    next(error);
  }
});

userRouter.patch('/me', async (req, res, next) => {
  try {
    const userId = req.authUserId;
    if (!userId) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const payload = profileUpdateSchema.parse(req.body);
    const user = await userService.updateProfile(userId, payload);

    res.json({
      data: userService.toPublicUser(user),
      error: null,
    });
  } catch (error) {
    next(error);
  }
});
