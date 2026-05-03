import { supabase } from '../db/supabase.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }

  return supabase;
};

const toMonthRange = (month: string) => {
  const [year, monthPart] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthPart - 1, 1));
  const end = new Date(Date.UTC(year, monthPart, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const normalizeCategory = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || typeof raw !== 'object') return null;
  return raw as { id?: string; name?: string; color?: string; icon?: string };
};

export const dashboardService = {
  async getSummary(userId: string, month?: string) {
    const db = requireDb();
    const selectedMonth = month ?? currentMonth();
    const { start, end } = toMonthRange(selectedMonth);

    const [{ data, error }, { data: budgets, error: budgetsError }] = await Promise.all([
      db
        .from('transactions')
        .select(
          'id, amount, type, date, currency, payment_method, notes, created_at, categories(id,name,color,icon)',
        )
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      db
        .from('budgets')
        .select('planned_amount')
        .eq('user_id', userId)
        .eq('month', selectedMonth),
    ]);

    if (error) {
      throw new HttpError(500, 'DASHBOARD_READ_FAILED', 'Could not load summary data');
    }
    if (budgetsError) {
      throw new HttpError(500, 'DASHBOARD_BUDGET_FAILED', 'Could not load budget usage');
    }

    const transactions = data ?? [];
    const income = transactions
      .filter((item: any) => item.type === 'income')
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    const expenses = transactions
      .filter((item: any) => item.type === 'expense')
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    const expenseByCategory = new Map<
      string,
      { categoryId: string | null; name: string; total: number; color: string; icon: string }
    >();
    for (const item of transactions) {
      if (item.type !== 'expense') continue;
      const category = normalizeCategory((item as any).categories);
      const categoryId = category?.id ?? null;
      const key = categoryId ?? 'uncategorized';
      const existing = expenseByCategory.get(key) ?? {
        categoryId,
        name: category?.name ?? 'Uncategorized',
        total: 0,
        color: category?.color ?? '#94A3B8',
        icon: category?.icon ?? 'circle',
      };
      existing.total += Number(item.amount);
      expenseByCategory.set(key, existing);
    }

    const topSpendingCategories = Array.from(expenseByCategory.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const recentTransactions = transactions.slice(0, 8).map((item: any) => {
      const category = normalizeCategory(item.categories);
      return {
        id: item.id,
        amount: Number(item.amount),
        type: item.type,
        date: item.date,
        currency: item.currency,
        paymentMethod: item.payment_method,
        notes: item.notes,
        categoryName: category?.name ?? 'Uncategorized',
        categoryColor: category?.color ?? '#94A3B8',
        categoryIcon: category?.icon ?? 'circle',
      };
    });

    const totalPlanned = (budgets ?? []).reduce(
      (sum: number, row: any) => sum + Number(row.planned_amount),
      0,
    );
    const budgetRemaining = totalPlanned - expenses;
    const budgetPercentUsed = totalPlanned > 0 ? (expenses / totalPlanned) * 100 : 0;

    return {
      month: selectedMonth,
      income,
      expenses,
      balance: income - expenses,
      topSpendingCategories,
      recentTransactions,
      budgetUsage: {
        planned: totalPlanned,
        spent: expenses,
        remaining: budgetRemaining,
        percentUsed: budgetPercentUsed,
      },
      goalProgress: {
        totalGoals: 0,
        completedGoals: 0,
        completionRate: 0,
      },
    };
  },

  async getMonthlyTotals(userId: string, months = 6) {
    const db = requireDb();
    const end = new Date();
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (months - 1), 1));

    const { data, error } = await db
      .from('transactions')
      .select('amount, type, date')
      .eq('user_id', userId)
      .gte('date', start.toISOString().slice(0, 10));

    if (error) {
      throw new HttpError(500, 'MONTHLY_TOTALS_FAILED', 'Could not load monthly totals');
    }

    const buckets = new Map<string, { month: string; income: number; expenses: number; balance: number }>();
    for (let i = 0; i < months; i += 1) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const month = d.toISOString().slice(0, 7);
      buckets.set(month, { month, income: 0, expenses: 0, balance: 0 });
    }

    for (const row of data ?? []) {
      const month = String((row as any).date).slice(0, 7);
      const bucket = buckets.get(month);
      if (!bucket) continue;
      const amount = Number((row as any).amount);
      if ((row as any).type === 'income') bucket.income += amount;
      else bucket.expenses += amount;
      bucket.balance = bucket.income - bucket.expenses;
    }

    return Array.from(buckets.values());
  },

  async getCategoryBreakdown(userId: string, month?: string) {
    const db = requireDb();
    const selectedMonth = month ?? currentMonth();
    const { start, end } = toMonthRange(selectedMonth);

    const { data, error } = await db
      .from('transactions')
      .select('amount, categories(id,name,color,icon)')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end);

    if (error) {
      throw new HttpError(500, 'CATEGORY_BREAKDOWN_FAILED', 'Could not load category breakdown');
    }

    const totals = new Map<
      string,
      { categoryId: string | null; name: string; total: number; color: string; icon: string }
    >();
    let totalExpense = 0;

    for (const row of data ?? []) {
      const category = normalizeCategory((row as any).categories);
      const key = category?.id ?? 'uncategorized';
      const amount = Number((row as any).amount);
      totalExpense += amount;
      const existing = totals.get(key) ?? {
        categoryId: category?.id ?? null,
        name: category?.name ?? 'Uncategorized',
        total: 0,
        color: category?.color ?? '#94A3B8',
        icon: category?.icon ?? 'circle',
      };
      existing.total += amount;
      totals.set(key, existing);
    }

    return Array.from(totals.values())
      .map((item) => ({
        ...item,
        percent: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },
};
