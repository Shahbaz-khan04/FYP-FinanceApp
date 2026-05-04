import { supabase } from '../db/supabase.js';
import { currencyService } from './currency.service.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

const day = (d: Date) => d.toISOString().slice(0, 10);
const monthKey = (d: Date) => d.toISOString().slice(0, 7);
const rangeMonths = (start: string, end: string) => {
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  const startDate = new Date(Date.UTC(sy, sm - 1, 1));
  const endDate = new Date(Date.UTC(ey, em - 1, 1));
  const keys: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    keys.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
};

const weekLabel = (dateStr: string) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const days = Math.floor((d.getTime() - first.getTime()) / 86400000);
  const week = Math.ceil((days + first.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const reportService = {
  async incomeVsExpenses(userId: string, startDate: string, endDate: string) {
    const db = requireDb();
    const { preferredCurrency, ratesBase, rates } = await currencyService.getRatesForUser(userId);
    const { data, error } = await db
      .from('transactions')
      .select('amount,type,date,currency')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw new HttpError(500, 'REPORT_FAILED', 'Could not load monthly income/expenses');

    const [startMonth] = [startDate.slice(0, 7)];
    const endMonth = endDate.slice(0, 7);
    const months = rangeMonths(startMonth, endMonth);
    const buckets = new Map(months.map((m) => [m, { month: m, income: 0, expenses: 0 }]));

    for (const row of data ?? []) {
      const key = String((row as any).date).slice(0, 7);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      const amount = currencyService.convertAmount(
        Number((row as any).amount),
        (row as any).currency,
        preferredCurrency,
        ratesBase,
        rates,
      );
      if ((row as any).type === 'income') bucket.income += amount;
      else bucket.expenses += amount;
    }

    return Array.from(buckets.values());
  },

  async categorySpending(userId: string, startDate: string, endDate: string) {
    const db = requireDb();
    const { preferredCurrency, ratesBase, rates } = await currencyService.getRatesForUser(userId);
    const { data, error } = await db
      .from('transactions')
      .select('amount,currency,categories(name,color,icon)')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw new HttpError(500, 'REPORT_FAILED', 'Could not load category spending');

    const map = new Map<string, { category: string; amount: number; color: string; icon: string }>();
    let total = 0;
    for (const row of data ?? []) {
      const category = Array.isArray((row as any).categories)
        ? (row as any).categories[0]
        : (row as any).categories;
      const name = category?.name ?? 'Uncategorized';
      const key = name;
      const amount = currencyService.convertAmount(
        Number((row as any).amount),
        (row as any).currency,
        preferredCurrency,
        ratesBase,
        rates,
      );
      total += amount;
      const current = map.get(key) ?? {
        category: name,
        amount: 0,
        color: category?.color ?? '#94A3B8',
        icon: category?.icon ?? 'circle',
      };
      current.amount += amount;
      map.set(key, current);
    }

    return Array.from(map.values())
      .map((item) => ({ ...item, percent: total > 0 ? (item.amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  },

  async spendingTrend(userId: string, startDate: string, endDate: string, granularity: 'daily' | 'weekly') {
    const db = requireDb();
    const { preferredCurrency, ratesBase, rates } = await currencyService.getRatesForUser(userId);
    const { data, error } = await db
      .from('transactions')
      .select('amount,currency,date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw new HttpError(500, 'REPORT_FAILED', 'Could not load spending trend');

    const buckets = new Map<string, number>();
    for (const row of data ?? []) {
      const dateStr = String((row as any).date);
      const key = granularity === 'daily' ? dateStr : weekLabel(dateStr);
      buckets.set(
        key,
        (buckets.get(key) ?? 0) +
          currencyService.convertAmount(
            Number((row as any).amount),
            (row as any).currency,
            preferredCurrency,
            ratesBase,
            rates,
          ),
      );
    }

    return Array.from(buckets.entries()).map(([period, amount]) => ({ period, amount }));
  },

  async budgetVsActual(userId: string, month: string) {
    const db = requireDb();
    const { preferredCurrency, ratesBase, rates } = await currencyService.getRatesForUser(userId);
    const start = `${month}-01`;
    const end = day(new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)));

    const [{ data: budgets, error: budgetError }, { data: txs, error: txError }] = await Promise.all([
      db
        .from('budgets')
        .select('planned_amount,category_id,categories(name,color,icon)')
        .eq('user_id', userId)
        .eq('month', month),
        db
          .from('transactions')
        .select('amount,currency,category_id')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', start)
        .lte('date', end),
    ]);

    if (budgetError || txError) throw new HttpError(500, 'REPORT_FAILED', 'Could not load budget report');

    const actual = new Map<string, number>();
    for (const tx of txs ?? []) {
      const key = (tx as any).category_id ?? 'uncategorized';
      actual.set(
        key,
        (actual.get(key) ?? 0) +
          currencyService.convertAmount(
            Number((tx as any).amount),
            (tx as any).currency,
            preferredCurrency,
            ratesBase,
            rates,
          ),
      );
    }

    return (budgets ?? []).map((b: any) => {
      const category = Array.isArray(b.categories) ? b.categories[0] : b.categories;
      const planned = Number(b.planned_amount);
      const spent = actual.get(b.category_id) ?? 0;
      return {
        category: category?.name ?? 'Unknown',
        icon: category?.icon ?? 'circle',
        color: category?.color ?? '#94A3B8',
        planned,
        actual: spent,
        remaining: planned - spent,
        percentUsed: planned > 0 ? (spent / planned) * 100 : 0,
      };
    });
  },

  async goalProgress(userId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('goals')
      .select('title,target_amount,saved_amount,is_completed,deadline');

    if (error) throw new HttpError(500, 'REPORT_FAILED', 'Could not load goal progress');

    return (data ?? []).map((goal: any) => {
      const target = Number(goal.target_amount);
      const saved = Number(goal.saved_amount);
      const percent = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
      return {
        title: goal.title,
        targetAmount: target,
        savedAmount: saved,
        remainingAmount: Math.max(target - saved, 0),
        progressPercent: percent,
        isCompleted: goal.is_completed || saved >= target,
        deadline: goal.deadline,
      };
    });
  },
};
