import { randomUUID } from 'node:crypto';
import { anomalyService } from './anomaly.service.js';
import { supabase } from '../db/supabase.js';
import type { Category, SyncTransactionOperation, Transaction } from '../types/transaction.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }

  return supabase;
};

export const transactionService = {
  async seedDefaultCategories(userId: string) {
    const db = requireDb();
    const now = new Date().toISOString();
    const defaults: Array<{ name: string; type: 'income' | 'expense'; icon: string; color: string }> = [
      { name: 'Salary', type: 'income', icon: 'wallet', color: '#4ADE80' },
      { name: 'Freelance', type: 'income', icon: 'briefcase', color: '#34D399' },
      { name: 'Business Sales', type: 'income', icon: 'chart', color: '#22C55E' },
      { name: 'Investment', type: 'income', icon: 'trending-up', color: '#16A34A' },
      { name: 'Gift', type: 'income', icon: 'gift', color: '#10B981' },
      { name: 'Other', type: 'income', icon: 'circle', color: '#84CC16' },
      { name: 'Food', type: 'expense', icon: 'utensils', color: '#F97316' },
      { name: 'Transport', type: 'expense', icon: 'car', color: '#F59E0B' },
      { name: 'Rent', type: 'expense', icon: 'home', color: '#EF4444' },
      { name: 'Bills', type: 'expense', icon: 'receipt', color: '#FB7185' },
      { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#EC4899' },
      { name: 'Health', type: 'expense', icon: 'heart', color: '#F43F5E' },
      { name: 'Entertainment', type: 'expense', icon: 'film', color: '#8B5CF6' },
      { name: 'Business', type: 'expense', icon: 'building', color: '#3B82F6' },
      { name: 'Other', type: 'expense', icon: 'circle', color: '#94A3B8' },
    ];

    const { error } = await db.from('categories').upsert(
      defaults.map((item) => ({
        id: randomUUID(),
        user_id: userId,
        name: item.name,
        type: item.type,
        icon: item.icon,
        color: item.color,
        is_default: true,
        created_at: now,
        updated_at: now,
      })),
      { onConflict: 'user_id,name,type' },
    );

    if (error) {
      throw new HttpError(500, 'CATEGORY_SEED_FAILED', 'Could not seed default categories');
    }
  },

  async listCategories(userId: string, type?: 'income' | 'expense') {
    const db = requireDb();
    let query = db.from('categories').select('*').eq('user_id', userId).order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.returns<Category[]>();

    if (error) {
      throw new HttpError(500, 'CATEGORY_READ_FAILED', 'Could not fetch categories');
    }

    return data ?? [];
  },

  async createCategory(
    userId: string,
    payload: { name: string; type: 'income' | 'expense'; icon: string; color: string },
  ) {
    const db = requireDb();
    const now = new Date().toISOString();

    const { data, error } = await db
      .from('categories')
      .insert({
        id: randomUUID(),
        user_id: userId,
        name: payload.name,
        type: payload.type,
        icon: payload.icon,
        color: payload.color,
        is_default: false,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single<Category>();

    if (error?.code === '23505') {
      throw new HttpError(409, 'CATEGORY_EXISTS', 'Category already exists for this type');
    }

    if (error) {
      throw new HttpError(500, 'CATEGORY_CREATE_FAILED', 'Could not create category');
    }

    return data;
  },

  async deleteCategory(userId: string, categoryId: string) {
    const db = requireDb();
    const { error } = await db.from('categories').delete().eq('id', categoryId).eq('user_id', userId);

    if (error) {
      throw new HttpError(500, 'CATEGORY_DELETE_FAILED', 'Could not delete category');
    }
  },

  async listTransactions(
    userId: string,
    filters: {
      type?: 'income' | 'expense';
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ) {
    const db = requireDb();
    let query = db
      .from('transactions')
      .select(
        'id, user_id, amount, type, category_id, currency, payment_method, date, notes, tags, created_at, updated_at, categories(name)',
      )
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters.startDate) query = query.gte('date', filters.startDate);
    if (filters.endDate) query = query.lte('date', filters.endDate);
    if (filters.search) query = query.or(`notes.ilike.%${filters.search}%,payment_method.ilike.%${filters.search}%`);

    const { data, error } = await query;

    if (error) {
      throw new HttpError(500, 'TRANSACTION_READ_FAILED', 'Could not fetch transactions');
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount),
      type: row.type,
      categoryId: row.category_id,
      categoryName: row.categories?.name ?? null,
      currency: row.currency,
      paymentMethod: row.payment_method,
      date: row.date,
      notes: row.notes,
      tags: row.tags ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createTransaction(
    userId: string,
    payload: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    options?: { id?: string; updatedAt?: string },
  ) {
    const db = requireDb();
    const now = options?.updatedAt ?? new Date().toISOString();
    const id = options?.id ?? randomUUID();

    const { data, error } = await db
      .from('transactions')
      .insert({
        id,
        user_id: userId,
        amount: payload.amount,
        type: payload.type,
        category_id: payload.category_id,
        currency: payload.currency,
        payment_method: payload.payment_method,
        date: payload.date,
        notes: payload.notes,
        tags: payload.tags ?? [],
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single<Transaction>();

    if (error) {
      throw new HttpError(500, 'TRANSACTION_CREATE_FAILED', 'Could not create transaction');
    }

    try {
      await anomalyService.detectForTransaction(userId, data.id);
    } catch {
      // Keep transaction writes available even if anomaly pipeline is not configured yet.
    }
    return data;
  },

  async updateTransaction(
    userId: string,
    transactionId: string,
    payload: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
  ) {
    const db = requireDb();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.amount !== undefined) patch.amount = payload.amount;
    if (payload.type !== undefined) patch.type = payload.type;
    if (payload.category_id !== undefined) patch.category_id = payload.category_id;
    if (payload.currency !== undefined) patch.currency = payload.currency;
    if (payload.payment_method !== undefined) patch.payment_method = payload.payment_method;
    if (payload.date !== undefined) patch.date = payload.date;
    if (payload.notes !== undefined) patch.notes = payload.notes;
    if (payload.tags !== undefined) patch.tags = payload.tags;

    const { data, error } = await db
      .from('transactions')
      .update(patch)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select('*')
      .single<Transaction>();

    if (error) {
      throw new HttpError(500, 'TRANSACTION_UPDATE_FAILED', 'Could not update transaction');
    }

    try {
      await anomalyService.detectForTransaction(userId, data.id);
    } catch {
      // Keep transaction writes available even if anomaly pipeline is not configured yet.
    }
    return data;
  },

  async deleteTransaction(userId: string, transactionId: string) {
    const db = requireDb();
    const { error } = await db.from('transactions').delete().eq('id', transactionId).eq('user_id', userId);

    if (error) {
      throw new HttpError(500, 'TRANSACTION_DELETE_FAILED', 'Could not delete transaction');
    }
  },

  async syncTransactions(userId: string, operations: SyncTransactionOperation[]) {
    const db = requireDb();
    const applied: string[] = [];
    const skipped: string[] = [];

    for (const operation of operations) {
      const { data: existing, error: readError } = await db
        .from('transactions')
        .select('*')
        .eq('id', operation.id)
        .eq('user_id', userId)
        .maybeSingle<Transaction>();

      if (readError) {
        throw new HttpError(500, 'SYNC_READ_FAILED', 'Could not process sync operation');
      }

      const incomingTs = new Date(operation.client_updated_at).getTime();
      const serverTs = existing ? new Date(existing.updated_at).getTime() : 0;
      const incomingIsLatest = !existing || incomingTs >= serverTs;

      if (!incomingIsLatest) {
        skipped.push(operation.id);
        continue;
      }

      if (operation.action === 'delete') {
        if (existing) {
          await this.deleteTransaction(userId, operation.id);
        }
        applied.push(operation.id);
        continue;
      }

      if (!operation.payload) {
        skipped.push(operation.id);
        continue;
      }

      if (!existing) {
        await this.createTransaction(
          userId,
          {
            amount: operation.payload.amount,
            type: operation.payload.type,
            category_id: operation.payload.category_id,
            currency: operation.payload.currency,
            payment_method: operation.payload.payment_method,
            date: operation.payload.date,
            notes: operation.payload.notes,
            tags: operation.payload.tags ?? [],
          },
          { id: operation.id, updatedAt: operation.client_updated_at },
        );
        applied.push(operation.id);
        continue;
      }

      await this.updateTransaction(userId, operation.id, {
        amount: operation.payload.amount,
        type: operation.payload.type,
        category_id: operation.payload.category_id,
        currency: operation.payload.currency,
        payment_method: operation.payload.payment_method,
        date: operation.payload.date,
        notes: operation.payload.notes,
        tags: operation.payload.tags ?? [],
      });
      applied.push(operation.id);
    }

    return { applied, skipped };
  },
};
