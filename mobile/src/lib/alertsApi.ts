import { apiClient } from './apiClient';
import type { AnomalyAlert } from '../types/alert';

export const alertsApi = {
  async list(token: string, includeDismissed = false) {
    const query = includeDismissed ? '?includeDismissed=true' : '';
    const response = await apiClient<{ data: AnomalyAlert[]; error: null }>(`/alerts${query}`, {
      method: 'GET',
      token,
    });
    return response.data;
  },

  async dismiss(token: string, alertId: string) {
    await apiClient<{ data: { ok: true }; error: null }>(`/alerts/${alertId}/dismiss`, {
      method: 'POST',
      token,
    });
  },

  async detect(token: string, month?: string) {
    const response = await apiClient<{ data: { scanned: number }; error: null }>('/alerts/detect', {
      method: 'POST',
      token,
      body: JSON.stringify(month ? { month } : {}),
    });
    return response.data;
  },
};
