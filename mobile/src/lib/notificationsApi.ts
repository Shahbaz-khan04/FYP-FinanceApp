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

  async generate(token: string, month?: string) {
    const response = await apiClient<{ data: { generated: number }; error: null }>(
      '/notifications/generate',
      {
        method: 'POST',
        token,
        body: JSON.stringify(month ? { month } : {}),
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
};
