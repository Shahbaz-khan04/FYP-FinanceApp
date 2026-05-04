import { randomUUID } from 'node:crypto';
import { supabase } from '../db/supabase.js';
import type { RecurringFrequency, RecurringTransactionRule } from '../types/recurring.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const addMonth = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
};

const nextDate = (fromDate: string, frequency: RecurringFrequency, customDays: number | null) => {
  if (frequency === 'weekly') return addDays(fromDate, 7);
  if (frequency === 'monthly') return addMonth(fromDate);
  return addDays(fromDate, customDays ?? 1);
};

const today = () => new Date().toISOString().slice(0, 10);

export const recurringService = {
  async listRules(userId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('recurring_transactions')
      .select('*, categories(name,color,icon)')
      .eq('user_id', userId)
      .order('is_paused', { ascending: true })
      .order('next_run_date', { ascending: true });

    if (error) throw new HttpError(500, 'RECURRING_READ_FAILED', 'Could not load recurring rules');

    return (data ?? []).map((row: any) => {
      const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      return {
        id: row.id,
        amount: Number(row.amount),
        categoryId: row.category_id,
        categoryName: category?.name ?? 'Unknown',
        categoryColor: category?.color ?? '#94A3B8',
        categoryIcon: category?.icon ?? 'circle',
        frequency: row.frequency as RecurringFrequency,
        customDays: row.custom_days,
        isPaused: row.is_paused,
        startDate: row.start_date,
        nextRunDate: row.next_run_date,
        lastRunDate: row.last_run_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  },

  async createRule(
    userId: string,
    payload: {
      amount: number;
      categoryId: string;
      frequency: RecurringFrequency;
      customDays?: number;
      startDate?: string;
    },
  ) {
    const db = requireDb();
    const now = new Date().toISOString();
    const startDate = payload.startDate ?? today();
    const nextRunDate = startDate;

    const { data, error } = await db
      .from('recurring_transactions')
      .insert({
        id: randomUUID(),
        user_id: userId,
        amount: payload.amount,
        category_id: payload.categoryId,
        frequency: payload.frequency,
        custom_days: payload.frequency === 'custom' ? payload.customDays ?? 1 : null,
        is_paused: false,
        start_date: startDate,
        next_run_date: nextRunDate,
        last_run_date: null,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single<RecurringTransactionRule>();

    if (error || !data) {
      throw new HttpError(500, 'RECURRING_CREATE_FAILED', 'Could not create recurring rule');
    }
    return data;
  },

  async updateRule(
    userId: string,
    ruleId: string,
    payload: {
      amount?: number;
      categoryId?: string;
      frequency?: RecurringFrequency;
      customDays?: number;
      isPaused?: boolean;
    },
  ) {
    const db = requireDb();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.amount !== undefined) patch.amount = payload.amount;
    if (payload.categoryId !== undefined) patch.category_id = payload.categoryId;
    if (payload.frequency !== undefined) patch.frequency = payload.frequency;
    if (payload.customDays !== undefined) patch.custom_days = payload.customDays;
    if (payload.isPaused !== undefined) patch.is_paused = payload.isPaused;

    const { data, error } = await db
      .from('recurring_transactions')
      .update(patch)
      .eq('id', ruleId)
      .eq('user_id', userId)
      .select('*')
      .single<RecurringTransactionRule>();

    if (error || !data) {
      throw new HttpError(500, 'RECURRING_UPDATE_FAILED', 'Could not update recurring rule');
    }
    return data;
  },

  async deleteRule(userId: string, ruleId: string) {
    const db = requireDb();
    const { error } = await db
      .from('recurring_transactions')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', userId);

    if (error) throw new HttpError(500, 'RECURRING_DELETE_FAILED', 'Could not delete recurring rule');
  },

  async processDueRules(userId?: string) {
    const db = requireDb();
    let query = db
      .from('recurring_transactions')
      .select('*')
      .eq('is_paused', false)
      .lte('next_run_date', today());

    if (userId) query = query.eq('user_id', userId);

    const { data: rules, error } = await query.returns<RecurringTransactionRule[]>();
    if (error) throw new HttpError(500, 'RECURRING_PROCESS_FAILED', 'Could not load due rules');

    let createdCount = 0;
    const updatedRuleIds: string[] = [];

    for (const rule of rules ?? []) {
      let runDate = rule.next_run_date;
      const stopDate = today();
      let safety = 0;
      while (runDate <= stopDate && safety < 120) {
        const txNow = new Date().toISOString();
        const { error: txError } = await db.from('transactions').insert({
          id: randomUUID(),
          user_id: rule.user_id,
          amount: rule.amount,
          type: 'expense',
          category_id: rule.category_id,
          currency: 'PKR',
          payment_method: 'Recurring',
          date: runDate,
          notes: 'Auto-created from recurring rule',
          tags: ['recurring'],
          created_at: txNow,
          updated_at: txNow,
        });
        if (txError) {
          throw new HttpError(500, 'RECURRING_TX_CREATE_FAILED', 'Could not create recurring transaction');
        }
        createdCount += 1;
        runDate = nextDate(runDate, rule.frequency, rule.custom_days);
        safety += 1;
      }

      const { error: updateError } = await db
        .from('recurring_transactions')
        .update({
          last_run_date: today(),
          next_run_date: runDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rule.id);
      if (updateError) {
        throw new HttpError(500, 'RECURRING_RULE_UPDATE_FAILED', 'Could not update recurring schedule');
      }
      updatedRuleIds.push(rule.id);
    }

    return { processedRules: updatedRuleIds.length, createdTransactions: createdCount, updatedRuleIds };
  },
};

