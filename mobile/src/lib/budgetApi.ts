import { apiClient } from './apiClient';
import type { BudgetItem, BudgetPayload } from '../types/budget';

export const budgetApi = {
  async list(token: string, month: string) {
    const response = await apiClient<{ data: BudgetItem[]; error: null }>(
      `/budgets?month=${month}`,
      { method: 'GET', token },
    );
    return response.data;
  },

  async create(token: string, payload: BudgetPayload) {
    const response = await apiClient<{ data: unknown; error: null }>('/budgets', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async update(token: string, budgetId: string, payload: Partial<BudgetPayload>) {
    const response = await apiClient<{ data: unknown; error: null }>(`/budgets/${budgetId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async remove(token: string, budgetId: string) {
    await apiClient(`/budgets/${budgetId}`, {
      method: 'DELETE',
      token,
    });
  },
};

