import type { RequestHandler } from 'express';
import { HttpError } from '../utils/httpError.js';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix?: string;
};

const buckets = new Map<string, { count: number; resetAt: number }>();

export const createRateLimit = (options: RateLimitOptions): RequestHandler => {
  const keyPrefix = options.keyPrefix ?? 'global';
  return (req, _res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const existing = buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > options.max) {
      next(new HttpError(429, 'RATE_LIMITED', 'Too many requests. Please try again shortly.'));
      return;
    }

    next();
  };
};
