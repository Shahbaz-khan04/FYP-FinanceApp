import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const allowedClientIds = (env.GOOGLE_CLIENT_IDS ?? '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const client = new OAuth2Client();

export type VerifiedGoogleIdentity = {
  providerUserId: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

export const googleAuthService = {
  async verifyIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
    if (!allowedClientIds.length) {
      throw new HttpError(
        500,
        'GOOGLE_AUTH_NOT_CONFIGURED',
        'Google auth is not configured. Set GOOGLE_CLIENT_IDS.',
      );
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: allowedClientIds,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new HttpError(401, 'INVALID_GOOGLE_TOKEN', 'Google token payload is incomplete');
    }
    if (!payload.email_verified) {
      throw new HttpError(401, 'GOOGLE_EMAIL_NOT_VERIFIED', 'Google account email is not verified');
    }

    return {
      providerUserId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name?.trim() || payload.email.split('@')[0] || 'User',
      emailVerified: Boolean(payload.email_verified),
    };
  },
};
