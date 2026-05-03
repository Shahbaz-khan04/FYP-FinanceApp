import { randomUUID } from 'node:crypto';
import { supabase } from '../db/supabase.js';
import type { AppUser, PublicUser } from '../types/auth.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }

  return supabase;
};

const toPublicUser = (user: AppUser): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  settings: user.settings ?? {},
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export const userService = {
  toPublicUser,

  async createUser(params: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
  }) {
    const db = requireDb();
    const now = new Date().toISOString();

    const { data, error } = await db
      .from('app_users')
      .insert({
        id: randomUUID(),
        name: params.name,
        email: params.email.toLowerCase(),
        phone: params.phone,
        password_hash: params.passwordHash,
        settings: {},
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single<AppUser>();

    if (error?.code === '23505') {
      throw new HttpError(409, 'USER_EXISTS', 'User already exists');
    }

    if (error || !data) {
      throw new HttpError(500, 'DB_INSERT_FAILED', 'Could not create user');
    }

    return data;
  },

  async findByEmail(email: string) {
    const db = requireDb();

    const { data, error } = await db
      .from('app_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle<AppUser>();

    if (error) {
      throw new HttpError(500, 'DB_READ_FAILED', 'Could not fetch user');
    }

    return data;
  },

  async findById(id: string) {
    const db = requireDb();

    const { data, error } = await db.from('app_users').select('*').eq('id', id).maybeSingle<AppUser>();

    if (error) {
      throw new HttpError(500, 'DB_READ_FAILED', 'Could not fetch user');
    }

    return data;
  },

  async updateProfile(
    id: string,
    updates: {
      name?: string;
      phone?: string;
      settings?: Record<string, unknown>;
    },
  ) {
    const db = requireDb();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.settings !== undefined) payload.settings = updates.settings;

    const { data, error } = await db
      .from('app_users')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<AppUser>();

    if (error || !data) {
      throw new HttpError(500, 'DB_UPDATE_FAILED', 'Could not update profile');
    }

    return data;
  },

  async saveResetToken(userId: string, token: string, expiresAt: string) {
    const db = requireDb();

    const { error } = await db.from('password_reset_tokens').insert({
      id: randomUUID(),
      user_id: userId,
      token,
      expires_at: expiresAt,
      consumed_at: null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new HttpError(500, 'RESET_TOKEN_FAILED', 'Could not create reset token');
    }
  },

  async consumeResetToken(token: string) {
    const db = requireDb();
    const now = new Date().toISOString();
    const { data, error } = await db
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .is('consumed_at', null)
      .gt('expires_at', now)
      .maybeSingle<{
        user_id: string;
      }>();

    if (error) {
      throw new HttpError(500, 'RESET_TOKEN_READ_FAILED', 'Could not validate reset token');
    }

    if (!data) {
      throw new HttpError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired reset token');
    }

    const { error: updateError } = await db
      .from('password_reset_tokens')
      .update({ consumed_at: now })
      .eq('token', token);

    if (updateError) {
      throw new HttpError(500, 'RESET_TOKEN_CONSUME_FAILED', 'Could not consume reset token');
    }

    return data.user_id;
  },

  async updatePassword(userId: string, passwordHash: string) {
    const db = requireDb();
    const { error } = await db
      .from('app_users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      throw new HttpError(500, 'PASSWORD_UPDATE_FAILED', 'Could not update password');
    }
  },
};
