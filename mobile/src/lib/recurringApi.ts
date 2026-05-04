import { apiClient } from './apiClient';
import type { RecurringPayload, RecurringRule } from '../types/recurring';

export const recurringApi = {
  async list(token: string) {
    const response = await apiClient<{ data: RecurringRule[]; error: null }>('/recurring', {
      method: 'GET',
      token,
    });
    return response.data;
  },

  async create(token: string, payload: RecurringPayload) {
    const response = await apiClient<{ data: RecurringRule; error: null }>('/recurring', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async update(token: string, ruleId: string, payload: Partial<RecurringPayload & { isPaused: boolean }>) {
    const response = await apiClient<{ data: RecurringRule; error: null }>(`/recurring/${ruleId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async remove(token: string, ruleId: string) {
    await apiClient(`/recurring/${ruleId}`, {
      method: 'DELETE',
      token,
    });
  },

  async processMine(token: string) {
    const response = await apiClient<{
      data: { processedRules: number; createdTransactions: number; updatedRuleIds: string[] };
      error: null;
    }>('/recurring/process-mine', {
      method: 'POST',
      token,
    });
    return response.data;
  },
};

