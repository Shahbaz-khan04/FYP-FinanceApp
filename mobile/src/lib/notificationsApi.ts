import { apiClient } from './apiClient';
import type { AppNotificationItem } from '../types/notification';

export const notificationsApi = {
  async list(token: string, includeRead = false) {
    const query = includeRead ? '?includeRead=true' : '';
    const response = await apiClient<{ data: AppNotificationItem[]; error: null }>(
      `/notifications${query}`,
      {
        method: 'GET',
        token,
      },
    );
    return response.data;
  },

  async generate(token: string, month?: string, withPush = false) {
    const response = await apiClient<{ data: { generated: number; push?: { sent: number; tokens: number } }; error: null }>(
      '/notifications/generate',
      {
        method: 'POST',
        token,
        body: JSON.stringify({ ...(month ? { month } : {}), withPush }),
      },
    );
    return response.data;
  },

  async markRead(token: string, notificationId: string) {
    await apiClient(`/notifications/${notificationId}/read`, { method: 'POST', token });
  },

  async dismiss(token: string, notificationId: string) {
    await apiClient(`/notifications/${notificationId}/dismiss`, { method: 'POST', token });
  },

  async registerPushToken(
    token: string,
    payload: { expoPushToken: string; platform: 'ios' | 'android'; deviceName?: string },
  ) {
    const response = await apiClient<{ data: { ok: boolean }; error: null }>('/notifications/push-token', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },
};
