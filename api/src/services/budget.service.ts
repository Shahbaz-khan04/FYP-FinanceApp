import { randomUUID } from 'node:crypto';
import { currencyService } from './currency.service.js';
import { supabase } from '../db/supabase.js';
import type { BudgetMethodology, BudgetPlan } from '../types/budget.js';
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

const defaultPlan = (month: string) => ({
  month,
  methodology: 'envelope' as BudgetMethodology,
  totalIncome: null as number | null,
});

const toPlanView = (row: BudgetPlan) => ({
  id: row.id,
  month: row.month,
  methodology: row.methodology,
  totalIncome: row.total_income === null ? null : Number(row.total_income),
});

export const budgetService = {
  async getPlan(userId: string, month: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('budget_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle<BudgetPlan>();
    if (error) throw new HttpError(500, 'BUDGET_PLAN_READ_FAILED', 'Could not load budget plan');
    if (!data) return defaultPlan(month);
    return toPlanView(data);
  },

  async upsertPlan(
    userId: string,
    payload: { month: string; methodology: BudgetMethodology; totalIncome?: number | null },
  ) {
    const db = requireDb();
    if (payload.methodology !== 'envelope' && (payload.totalIncome ?? null) === null) {
      throw new HttpError(
        400,
        'TOTAL_INCOME_REQUIRED',
        'Total income is required for percentage and zero-based methodologies',
      );
    }
    if ((payload.totalIncome ?? 0) < 0) {
      throw new HttpError(400, 'INVALID_TOTAL_INCOME', 'Total income cannot be negative');
    }
    const now = new Date().toISOString();
    const { data, error } = await db
      .from('budget_plans')
      .upsert(
        {
          id: randomUUID(),
          user_id: userId,
          month: payload.month,
          methodology: payload.methodology,
          total_income: payload.totalIncome ?? null,
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id,month' },
      )
      .select('*')
      .single<BudgetPlan>();
    if (error || !data) throw new HttpError(500, 'BUDGET_PLAN_SAVE_FAILED', 'Could not save budget plan');

    if (payload.methodology === 'zero_based' && Number(data.total_income ?? 0) > 0) {
      const totalPlanned = await this.getTotalPlanned(userId, payload.month);
      if (totalPlanned > Number(data.total_income) + 0.01) {
        throw new HttpError(
          400,
          'ZERO_BASED_OVER_ALLOCATED',
          'Existing category budgets exceed total income for zero-based plan',
        );
      }
    }

    return toPlanView(data);
  },

  async getTotalPlanned(userId: string, month: string, excludeBudgetId?: string) {
    const db = requireDb();
    let query = db
      .from('budgets')
      .select('planned_amount')
      .eq('user_id', userId)
      .eq('month', month);
    if (excludeBudgetId) query = query.neq('id', excludeBudgetId);
    const { data, error } = await query;
    if (error) throw new HttpError(500, 'BUDGET_SUM_FAILED', 'Could not validate planned totals');
    return (data ?? []).reduce((sum: number, row: any) => sum + Number(row.planned_amount), 0);
  },

  async listBudgets(userId: string, month: string) {
    const db = requireDb();
    const { preferredCurrency, ratesBase, rates } = await currencyService.getRatesForUser(userId);
    const { start, end } = monthRange(month);
    const plan = await this.getPlan(userId, month);

    const [{ data: budgets, error: budgetError }, { data: expenses, error: expenseError }] = await Promise.all([
      db
        .from('budgets')
        .select('id, month, planned_amount, planned_percent, category_id, categories(name,color,icon)')
        .eq('user_id', userId)
        .eq('month', month),
      db
        .from('transactions')
        .select('amount, currency, category_id')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', start)
        .lte('date', end),
    ]);

    if (budgetError) throw new HttpError(500, 'BUDGET_READ_FAILED', 'Could not load budgets');
    if (expenseError) throw new HttpError(500, 'BUDGET_ACTUAL_FAILED', 'Could not load budget actuals');

    const actualByCategory = new Map<string, number>();
    for (const tx of expenses ?? []) {
      const key = (tx as any).category_id ?? 'uncategorized';
      actualByCategory.set(
        key,
        (actualByCategory.get(key) ?? 0) +
          currencyService.convertAmount(
            Number((tx as any).amount),
            (tx as any).currency,
            preferredCurrency,
            ratesBase,
            rates,
          ),
      );
    }

    const items = (budgets ?? []).map((budget: any) => {
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
        plannedPercent: budget.planned_percent === null ? null : Number(budget.planned_percent),
        actualAmount: actual,
        remainingAmount: remaining,
        percentUsed,
        nearLimit: percentUsed >= 80 && percentUsed <= 100,
        overBudget: percentUsed > 100,
      };
    });

    const totals = items.reduce(
      (acc, item) => {
        acc.planned += item.plannedAmount;
        acc.actual += item.actualAmount;
        return acc;
      },
      { planned: 0, actual: 0 },
    );

    const percentageAllocated =
      plan.totalIncome && plan.totalIncome > 0 ? (totals.planned / plan.totalIncome) * 100 : null;
    const zeroBasedRemaining =
      plan.methodology === 'zero_based' && plan.totalIncome !== null ? plan.totalIncome - totals.planned : null;

    return {
      plan,
      items,
      totals: {
        planned: totals.planned,
        actual: totals.actual,
        remaining: totals.planned - totals.actual,
        percentageAllocated,
        zeroBasedRemaining,
      },
    };
  },

  async createBudget(
    userId: string,
    payload: { month: string; categoryId: string; plannedAmount?: number; plannedPercent?: number },
  ) {
    const db = requireDb();
    const now = new Date().toISOString();
    const plan = await this.getPlan(userId, payload.month);

    let plannedAmount = Number(payload.plannedAmount ?? 0);
    let plannedPercent: number | null = payload.plannedPercent ?? null;

    if (plan.methodology === 'percentage') {
      if (plan.totalIncome === null || plan.totalIncome <= 0) {
        throw new HttpError(400, 'TOTAL_INCOME_REQUIRED', 'Set total income before using percentage mode');
      }
      if (plannedPercent === null) {
        if (!Number.isFinite(plannedAmount) || plannedAmount <= 0) {
          throw new HttpError(400, 'PLANNED_PERCENT_REQUIRED', 'Provide planned percentage for percentage mode');
        }
        plannedPercent = (plannedAmount / plan.totalIncome) * 100;
      } else {
        if (!Number.isFinite(plannedPercent) || plannedPercent <= 0 || plannedPercent > 100) {
          throw new HttpError(400, 'INVALID_PERCENT', 'Percent must be between 0 and 100');
        }
        plannedAmount = (plan.totalIncome * plannedPercent) / 100;
      }
    } else {
      if (!Number.isFinite(plannedAmount) || plannedAmount <= 0) {
        throw new HttpError(400, 'INVALID_PLANNED_AMOUNT', 'Planned amount must be greater than 0');
      }
      plannedPercent = null;
    }

    if (plan.methodology === 'zero_based') {
      if (plan.totalIncome === null || plan.totalIncome <= 0) {
        throw new HttpError(400, 'TOTAL_INCOME_REQUIRED', 'Set total income before using zero-based mode');
      }
      const sum = await this.getTotalPlanned(userId, payload.month);
      if (sum + plannedAmount > plan.totalIncome + 0.01) {
        throw new HttpError(
          400,
          'ZERO_BASED_OVER_ALLOCATED',
          'This allocation exceeds total income in zero-based mode',
        );
      }
    }

    const { data, error } = await db
      .from('budgets')
      .insert({
        id: randomUUID(),
        user_id: userId,
        month: payload.month,
        category_id: payload.categoryId,
        planned_amount: plannedAmount,
        planned_percent: plannedPercent,
        created_at: now,
        updated_at: now,
      })
      .select('id, month, planned_amount, planned_percent, category_id')
      .single();

    if (error?.code === '23505') {
      throw new HttpError(409, 'BUDGET_EXISTS', 'Budget already exists for this category and month');
    }
    if (error || !data) throw new HttpError(500, 'BUDGET_CREATE_FAILED', 'Could not create budget');
    return data;
  },

  async updateBudget(
    userId: string,
    budgetId: string,
    payload: { month?: string; categoryId?: string; plannedAmount?: number; plannedPercent?: number },
  ) {
    const db = requireDb();
    const { data: existing, error: existingError } = await db
      .from('budgets')
      .select('id,month,planned_amount,planned_percent')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .maybeSingle<{ id: string; month: string; planned_amount: number; planned_percent: number | null }>();
    if (existingError) throw new HttpError(500, 'BUDGET_READ_FAILED', 'Could not load budget');
    if (!existing) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');

    const targetMonth = payload.month ?? existing.month;
    const plan = await this.getPlan(userId, targetMonth);
    let plannedAmount = payload.plannedAmount ?? Number(existing.planned_amount);
    let plannedPercent = payload.plannedPercent ?? existing.planned_percent;

    if (plan.methodology === 'percentage') {
      if (plan.totalIncome === null || plan.totalIncome <= 0) {
        throw new HttpError(400, 'TOTAL_INCOME_REQUIRED', 'Set total income before using percentage mode');
      }
      if (payload.plannedPercent !== undefined) {
        if (!Number.isFinite(payload.plannedPercent) || payload.plannedPercent <= 0 || payload.plannedPercent > 100) {
          throw new HttpError(400, 'INVALID_PERCENT', 'Percent must be between 0 and 100');
        }
        plannedPercent = payload.plannedPercent;
        plannedAmount = (plan.totalIncome * payload.plannedPercent) / 100;
      } else if (payload.plannedAmount !== undefined) {
        if (!Number.isFinite(payload.plannedAmount) || payload.plannedAmount <= 0) {
          throw new HttpError(400, 'INVALID_PLANNED_AMOUNT', 'Planned amount must be greater than 0');
        }
        plannedAmount = payload.plannedAmount;
        plannedPercent = (plannedAmount / plan.totalIncome) * 100;
      } else {
        plannedAmount = Number(existing.planned_amount);
        plannedPercent = existing.planned_percent;
      }
    } else {
      plannedPercent = null;
      if (payload.plannedAmount !== undefined) {
        if (!Number.isFinite(payload.plannedAmount) || payload.plannedAmount <= 0) {
          throw new HttpError(400, 'INVALID_PLANNED_AMOUNT', 'Planned amount must be greater than 0');
        }
        plannedAmount = payload.plannedAmount;
      }
    }

    if (plan.methodology === 'zero_based') {
      if (plan.totalIncome === null || plan.totalIncome <= 0) {
        throw new HttpError(400, 'TOTAL_INCOME_REQUIRED', 'Set total income before using zero-based mode');
      }
      const sum = await this.getTotalPlanned(userId, targetMonth, budgetId);
      if (sum + plannedAmount > plan.totalIncome + 0.01) {
        throw new HttpError(
          400,
          'ZERO_BASED_OVER_ALLOCATED',
          'This allocation exceeds total income in zero-based mode',
        );
      }
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.month !== undefined) patch.month = payload.month;
    if (payload.categoryId !== undefined) patch.category_id = payload.categoryId;
    patch.planned_amount = plannedAmount;
    patch.planned_percent = plannedPercent;

    const { data, error } = await db
      .from('budgets')
      .update(patch)
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select('id, month, planned_amount, planned_percent, category_id')
      .single();

    if (error?.code === '23505') {
      throw new HttpError(409, 'BUDGET_EXISTS', 'Budget already exists for this category and month');
    }
    if (error || !data) throw new HttpError(500, 'BUDGET_UPDATE_FAILED', 'Could not update budget');
    return data;
  },

  async deleteBudget(userId: string, budgetId: string) {
    const db = requireDb();
    const { error } = await db.from('budgets').delete().eq('id', budgetId).eq('user_id', userId);
    if (error) throw new HttpError(500, 'BUDGET_DELETE_FAILED', 'Could not delete budget');
  },
};
