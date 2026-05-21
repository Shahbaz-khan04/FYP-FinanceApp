import { randomUUID } from 'node:crypto';
import { supabase } from '../db/supabase.js';
import { HttpError } from '../utils/httpError.js';

type PushTokenRow = {
  id: string;
  user_id: string;
  platform: 'ios' | 'android';
  expo_push_token: string;
  is_active: boolean;
};

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

export const pushService = {
  async registerToken(userId: string, payload: { expoPushToken: string; platform: 'ios' | 'android'; deviceName?: string }) {
    const db = requireDb();
    const now = new Date().toISOString();
    const { error } = await db.from('push_tokens').upsert(
      {
        id: randomUUID(),
        user_id: userId,
        platform: payload.platform,
        expo_push_token: payload.expoPushToken,
        device_name: payload.deviceName ?? null,
        is_active: true,
        last_seen_at: now,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,expo_push_token' },
    );
    if (error) throw new HttpError(500, 'PUSH_TOKEN_SAVE_FAILED', 'Could not save push token');
    return { ok: true };
  },

  async deactivateToken(userId: string, expoPushToken: string) {
    const db = requireDb();
    const { error } = await db
      .from('push_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('expo_push_token', expoPushToken);
    if (error) throw new HttpError(500, 'PUSH_TOKEN_DEACTIVATE_FAILED', 'Could not deactivate push token');
  },

  async sendToUser(
    userId: string,
    notifications: Array<{ id: string; title: string; message: string; metadata?: Record<string, unknown> }>,
  ) {
    const db = requireDb();
    const { data, error } = await db
      .from('push_tokens')
      .select('id,user_id,platform,expo_push_token,is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .returns<PushTokenRow[]>();
    if (error) throw new HttpError(500, 'PUSH_TOKEN_READ_FAILED', 'Could not read push tokens');

    const tokens = (data ?? []).map((row) => row.expo_push_token);
    if (!tokens.length) return { sent: 0, tokens: 0 };

    const messages = tokens.flatMap((token) =>
      notifications.map((n) => ({
        to: token,
        title: n.title,
        body: n.message,
        data: { notificationId: n.id, ...(n.metadata ?? {}) },
        sound: 'default',
      })),
    );

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    if (!response.ok) {
      throw new HttpError(502, 'PUSH_SEND_FAILED', `Expo push send failed (${response.status})`);
    }
    return { sent: messages.length, tokens: tokens.length };
  },
};
