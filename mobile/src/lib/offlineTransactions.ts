import AsyncStorage from '@react-native-async-storage/async-storage';
import { transactionsApi } from './transactionsApi';
import type { TransactionItem, TransactionPayload, TransactionType } from '../types/transaction';

const CACHE_KEY = 'tx_cache_v1';
const QUEUE_KEY = 'tx_queue_v1';

type QueueOp = {
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
};

const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

const applyFilters = (
  items: TransactionItem[],
  filters: {
    type?: TransactionType;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  },
) =>
  items.filter((item) => {
    if (filters.type && item.type !== filters.type) return false;
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (filters.startDate && item.date < filters.startDate) return false;
    if (filters.endDate && item.date > filters.endDate) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${item.notes ?? ''} ${item.paymentMethod}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

const upsertCached = (list: TransactionItem[], item: TransactionItem) => {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = item;
    return next;
  }
  return [item, ...list];
};

export const offlineTransactions = {
  async getCached() {
    return readJson<TransactionItem[]>(CACHE_KEY, []);
  },

  async getQueue() {
    return readJson<QueueOp[]>(QUEUE_KEY, []);
  },

  async loadTransactions(
    token: string,
    online: boolean,
    filters: { type?: TransactionType; categoryId?: string; startDate?: string; endDate?: string; search?: string },
  ) {
    if (!online) {
      const cached = await this.getCached();
      return applyFilters(cached, filters).sort((a, b) => b.date.localeCompare(a.date));
    }

    const data = await transactionsApi.listTransactions(token, filters);
    await writeJson(CACHE_KEY, data);
    return data;
  },

  async createLocal(payload: TransactionPayload, categoryName: string | null) {
    const now = new Date().toISOString();
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const localItem: TransactionItem = {
      id,
      userId: 'local',
      amount: payload.amount,
      type: payload.type,
      categoryId: payload.categoryId,
      categoryName,
      currency: payload.currency,
      paymentMethod: payload.paymentMethod,
      date: payload.date,
      notes: payload.notes ?? null,
      tags: payload.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    const cached = await this.getCached();
    await writeJson(CACHE_KEY, upsertCached(cached, localItem));

    const queue = await this.getQueue();
    queue.push({
      id,
      action: 'create',
      client_updated_at: now,
      payload: {
        amount: payload.amount,
        type: payload.type,
        category_id: payload.categoryId,
        currency: payload.currency,
        payment_method: payload.paymentMethod,
        date: payload.date,
        notes: payload.notes ?? null,
        tags: payload.tags ?? [],
      },
    });
    await writeJson(QUEUE_KEY, queue);
  },

  async updateLocal(id: string, patch: Partial<TransactionPayload>, categoryName?: string | null) {
    const now = new Date().toISOString();
    const cached = await this.getCached();
    const updated = cached.map((item) =>
      item.id === id
        ? {
            ...item,
            ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
            ...(patch.type !== undefined ? { type: patch.type } : {}),
            ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId } : {}),
            ...(categoryName !== undefined ? { categoryName } : {}),
            ...(patch.date !== undefined ? { date: patch.date } : {}),
            ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
            ...(patch.paymentMethod !== undefined ? { paymentMethod: patch.paymentMethod } : {}),
            ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
            ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
            updatedAt: now,
          }
        : item,
    );
    await writeJson(CACHE_KEY, updated);

    const current = updated.find((x) => x.id === id);
    if (!current) return;

    const queue = await this.getQueue();
    queue.push({
      id,
      action: 'update',
      client_updated_at: now,
      payload: {
        amount: current.amount,
        type: current.type,
        category_id: current.categoryId,
        currency: current.currency,
        payment_method: current.paymentMethod,
        date: current.date,
        notes: current.notes,
        tags: current.tags ?? [],
      },
    });
    await writeJson(QUEUE_KEY, queue);
  },

  async deleteLocal(id: string) {
    const now = new Date().toISOString();
    const cached = await this.getCached();
    await writeJson(
      CACHE_KEY,
      cached.filter((item) => item.id !== id),
    );

    const queue = await this.getQueue();
    queue.push({
      id,
      action: 'delete',
      client_updated_at: now,
    });
    await writeJson(QUEUE_KEY, queue);
  },

  async sync(token: string) {
    const queue = await this.getQueue();
    if (!queue.length) {
      return { applied: 0, skipped: 0 };
    }
    const result = await transactionsApi.syncTransactions(token, queue);
    await writeJson(QUEUE_KEY, []);
    return { applied: result.applied.length, skipped: result.skipped.length };
  },
};
