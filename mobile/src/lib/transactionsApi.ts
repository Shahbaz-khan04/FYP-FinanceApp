import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import type { Category, TransactionItem, TransactionPayload, TransactionType } from '../types/transaction';

const CATEGORY_CACHE_KEY = 'category_cache_v1';

export const transactionsApi = {
  async listCategories(token: string, type?: TransactionType) {
    const query = type ? `?type=${type}` : '';
    try {
      const response = await apiClient<{ data: Category[]; error: null }>(`/categories${query}`, {
        method: 'GET',
        token,
      });
      const all = await apiClient<{ data: Category[]; error: null }>('/categories', {
        method: 'GET',
        token,
      });
      await AsyncStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(all.data));
      return response.data;
    } catch (error) {
      const cachedRaw = await AsyncStorage.getItem(CATEGORY_CACHE_KEY);
      const cached = cachedRaw ? (JSON.parse(cachedRaw) as Category[]) : [];
      if (!cached.length) throw error;
      return type ? cached.filter((c) => c.type === type) : cached;
    }
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

  async syncTransactions(
    token: string,
    operations: Array<{
      id: string;
      action: 'create' | 'update' | 'delete';
      client_updated_at: string;
      payload?: {
        amount: number;
        type: TransactionType;
        category_id: string | null;
        currency: string;
        payment_method: string;
        date: string;
        notes: string | null;
        tags: string[];
      };
    }>,
  ) {
    const response = await apiClient<{ data: { applied: string[]; skipped: string[] }; error: null }>(
      '/transactions/sync',
      {
        method: 'POST',
        token,
        body: JSON.stringify({ operations }),
      },
    );
    return response.data;
  },
};
