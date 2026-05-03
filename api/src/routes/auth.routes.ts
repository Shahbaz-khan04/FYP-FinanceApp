import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { userService } from '../services/user.service.js';
import { comparePassword, hashPassword, signAuthToken } from '../utils/auth.js';
import { HttpError } from '../utils/httpError.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(12),
  newPassword: z.string().min(8),
});

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const existing = await userService.findByEmail(payload.email);

    if (existing) {
      throw new HttpError(409, 'USER_EXISTS', 'User already exists');
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await userService.createUser({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      passwordHash,
    });

    const token = signAuthToken({ sub: user.id, email: user.email });

    res.status(201).json({
      data: {
        token,
        user: userService.toPublicUser(user),
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await userService.findByEmail(payload.email);

    if (!user) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const validPassword = await comparePassword(payload.password, user.password_hash);
    if (!validPassword) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = signAuthToken({ sub: user.id, email: user.email });

    res.json({
      data: {
        token,
        user: userService.toPublicUser(user),
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (_req, res) => {
  res.json({
    data: { ok: true },
    error: null,
  });
});

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const payload = forgotSchema.parse(req.body);
    const user = await userService.findByEmail(payload.email);

    if (!user) {
      res.json({
        data: { message: 'If an account exists, reset instructions were generated.' },
        error: null,
      });
      return;
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    await userService.saveResetToken(user.id, token, expiresAt);

    res.json({
      data: {
        message: 'Reset token generated',
        ...(env.NODE_ENV !== 'production' ? { resetToken: token } : {}),
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const payload = resetSchema.parse(req.body);
    const userId = await userService.consumeResetToken(payload.token);
    const passwordHash = await hashPassword(payload.newPassword);
    await userService.updatePassword(userId, passwordHash);

    res.json({
      data: { ok: true },
      error: null,
    });
  } catch (error) {
    next(error);
  }
});
