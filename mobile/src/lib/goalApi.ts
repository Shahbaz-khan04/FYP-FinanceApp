import { apiClient } from './apiClient';
import type { GoalItem, GoalPayload } from '../types/goal';

export const goalApi = {
  async list(token: string) {
    const response = await apiClient<{ data: GoalItem[]; error: null }>('/goals', {
      method: 'GET',
      token,
    });
    return response.data;
  },

  async create(token: string, payload: GoalPayload) {
    const response = await apiClient<{ data: GoalItem; error: null }>('/goals', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async update(token: string, goalId: string, payload: Partial<GoalPayload & { isCompleted: boolean }>) {
    const response = await apiClient<{ data: GoalItem; error: null }>(`/goals/${goalId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async complete(token: string, goalId: string) {
    const response = await apiClient<{ data: GoalItem; error: null }>(`/goals/${goalId}/complete`, {
      method: 'POST',
      token,
    });
    return response.data;
  },

  async remove(token: string, goalId: string) {
    await apiClient(`/goals/${goalId}`, {
      method: 'DELETE',
      token,
    });
  },
};

