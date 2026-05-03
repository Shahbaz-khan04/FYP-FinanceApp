import { randomUUID } from 'node:crypto';
import { supabase } from '../db/supabase.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

const monthRange = (month: string) => {
  const [year, monthPart] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthPart - 1, 1));
  const end = new Date(Date.UTC(year, monthPart, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

export const budgetService = {
  async listBudgets(userId: string, month: string) {
    const db = requireDb();
    const { start, end } = monthRange(month);

    const [{ data: budgets, error: budgetError }, { data: expenses, error: expenseError }] =
      await Promise.all([
        db
          .from('budgets')
          .select('id, month, planned_amount, category_id, categories(name,color,icon)')
          .eq('user_id', userId)
          .eq('month', month),
        db
          .from('transactions')
          .select('amount, category_id')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('date', start)
          .lte('date', end),
      ]);

    if (budgetError) {
      throw new HttpError(500, 'BUDGET_READ_FAILED', 'Could not load budgets');
    }
    if (expenseError) {
      throw new HttpError(500, 'BUDGET_ACTUAL_FAILED', 'Could not load budget actuals');
    }

    const actualByCategory = new Map<string, number>();
    for (const tx of expenses ?? []) {
      const key = (tx as any).category_id ?? 'uncategorized';
      actualByCategory.set(key, (actualByCategory.get(key) ?? 0) + Number((tx as any).amount));
    }

    return (budgets ?? []).map((budget: any) => {
      const category = Array.isArray(budget.categories) ? budget.categories[0] : budget.categories;
      const actual = actualByCategory.get(budget.category_id) ?? 0;
      const planned = Number(budget.planned_amount);
      const remaining = planned - actual;
      const percentUsed = planned > 0 ? (actual / planned) * 100 : 0;

      return {
        id: budget.id,
        month: budget.month,
        categoryId: budget.category_id,
        categoryName: category?.name ?? 'Unknown',
        categoryColor: category?.color ?? '#94A3B8',
        categoryIcon: category?.icon ?? 'circle',
        plannedAmount: planned,
        actualAmount: actual,
        remainingAmount: remaining,
        percentUsed,
        nearLimit: percentUsed >= 80 && percentUsed <= 100,
        overBudget: percentUsed > 100,
      };
    });
  },

  async createBudget(userId: string, payload: { month: string; categoryId: string; plannedAmount: number }) {
    const db = requireDb();
    const now = new Date().toISOString();
    const { data, error } = await db
      .from('budgets')
      .insert({
        id: randomUUID(),
        user_id: userId,
        month: payload.month,
        category_id: payload.categoryId,
        planned_amount: payload.plannedAmount,
        created_at: now,
        updated_at: now,
      })
      .select('id, month, planned_amount, category_id')
      .single();

    if (error?.code === '23505') {
      throw new HttpError(409, 'BUDGET_EXISTS', 'Budget already exists for this category and month');
    }
    if (error || !data) {
      throw new HttpError(500, 'BUDGET_CREATE_FAILED', 'Could not create budget');
    }
    return data;
  },

  async updateBudget(
    userId: string,
    budgetId: string,
    payload: { month?: string; categoryId?: string; plannedAmount?: number },
  ) {
    const db = requireDb();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.month !== undefined) patch.month = payload.month;
    if (payload.categoryId !== undefined) patch.category_id = payload.categoryId;
    if (payload.plannedAmount !== undefined) patch.planned_amount = payload.plannedAmount;

    const { data, error } = await db
      .from('budgets')
      .update(patch)
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select('id, month, planned_amount, category_id')
      .single();

    if (error?.code === '23505') {
      throw new HttpError(409, 'BUDGET_EXISTS', 'Budget already exists for this category and month');
    }
    if (error || !data) {
      throw new HttpError(500, 'BUDGET_UPDATE_FAILED', 'Could not update budget');
    }
    return data;
  },

  async deleteBudget(userId: string, budgetId: string) {
    const db = requireDb();
    const { error } = await db.from('budgets').delete().eq('id', budgetId).eq('user_id', userId);
    if (error) {
      throw new HttpError(500, 'BUDGET_DELETE_FAILED', 'Could not delete budget');
    }
  },
};

