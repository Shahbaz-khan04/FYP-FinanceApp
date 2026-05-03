import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from './httpError.js';

type AuthTokenPayload = {
  sub: string;
  email: string;
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signAuthToken = (payload: AuthTokenPayload) => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!decoded.sub || !decoded.email) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid token payload');
    }

    return {
      sub: String(decoded.sub),
      email: String(decoded.email),
    };
  } catch {
    throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
};
