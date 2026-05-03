import type { RequestHandler } from 'express';
import { userService } from '../services/user.service.js';
import { verifyAuthToken } from '../utils/auth.js';
import { HttpError } from '../utils/httpError.js';

declare module 'express-serve-static-core' {
  interface Request {
    authUserId?: string;
  }
}

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Missing token');
    }

    const payload = verifyAuthToken(token);
    const user = await userService.findById(payload.sub);

    if (!user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'User no longer exists');
    }

    req.authUserId = user.id;
    next();
  } catch (error) {
    next(error);
  }
};
