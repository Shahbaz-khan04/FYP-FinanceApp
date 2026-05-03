import { apiClient } from './apiClient';
import type { Category, TransactionItem, TransactionPayload, TransactionType } from '../types/transaction';

export const transactionsApi = {
  async listCategories(token: string, type?: TransactionType) {
    const query = type ? `?type=${type}` : '';
    const response = await apiClient<{ data: Category[]; error: null }>(`/categories${query}`, {
      method: 'GET',
      token,
    });
    return response.data;
  },

  async createCategory(
    token: string,
    payload: { name: string; type: TransactionType; icon: string; color: string },
  ) {
    const response = await apiClient<{ data: Category; error: null }>('/categories', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async deleteCategory(token: string, id: string) {
    await apiClient(`/categories/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  async listTransactions(
    token: string,
    filters: {
      type?: TransactionType;
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';

    const response = await apiClient<{ data: TransactionItem[]; error: null }>(
      `/transactions${query}`,
      {
        method: 'GET',
        token,
      },
    );
    return response.data;
  },

  async createTransaction(token: string, payload: TransactionPayload) {
    const response = await apiClient<{ data: TransactionItem; error: null }>('/transactions', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async updateTransaction(token: string, id: string, payload: Partial<TransactionPayload>) {
    const response = await apiClient<{ data: TransactionItem; error: null }>(`/transactions/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async deleteTransaction(token: string, id: string) {
    await apiClient(`/transactions/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};
