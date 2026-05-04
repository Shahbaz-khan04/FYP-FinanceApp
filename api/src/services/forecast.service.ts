import { supabase } from '../db/supabase.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

const monthStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
const monthEnd = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const fmtMonth = (d: Date) => d.toISOString().slice(0, 7);

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

const nextDate = (fromDate: string, frequency: 'weekly' | 'monthly' | 'custom', customDays: number | null) => {
  if (frequency === 'weekly') return addDays(fromDate, 7);
  if (frequency === 'monthly') return addMonth(fromDate);
  return addDays(fromDate, customDays ?? 1);
};

export const forecastService = {
  async getForecast(userId: string) {
    const db = requireDb();
    const now = new Date();
    const curMonthStart = monthStart(now);
    const nextMonthStart = monthStart(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)));
    const nextMonthEnd = monthEnd(nextMonthStart);

    const last3Start = monthStart(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1)));

    const [txRes, recurringRes] = await Promise.all([
      db
        .from('transactions')
        .select('amount,type,date')
        .eq('user_id', userId)
        .gte('date', fmtDate(last3Start))
        .lte('date', fmtDate(now)),
      db
        .from('recurring_transactions')
        .select('amount,frequency,custom_days,next_run_date,is_paused')
        .eq('user_id', userId)
        .eq('is_paused', false),
    ]);

    if (txRes.error || recurringRes.error) {
      throw new HttpError(500, 'FORECAST_READ_FAILED', 'Could not load forecasting inputs');
    }

    const txs = txRes.data ?? [];
    const recurring = recurringRes.data ?? [];

    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    for (let i = 0; i < 3; i += 1) {
      const m = fmtMonth(monthStart(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
      monthlyMap.set(m, { income: 0, expenses: 0 });
    }
    for (const row of txs) {
      const m = String((row as any).date).slice(0, 7);
      if (!monthlyMap.has(m)) continue;
      const bucket = monthlyMap.get(m)!;
      const amount = Number((row as any).amount);
      if ((row as any).type === 'income') bucket.income += amount;
      else bucket.expenses += amount;
    }

    const monthly = Array.from(monthlyMap.entries())
      .map(([month, v]) => ({ month, income: v.income, expenses: v.expenses, balance: v.income - v.expenses }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const avgIncome = monthly.length ? monthly.reduce((s, x) => s + x.income, 0) / monthly.length : 0;
    const avgExpenses = monthly.length ? monthly.reduce((s, x) => s + x.expenses, 0) / monthly.length : 0;

    let projectedRecurringNextMonth = 0;
    for (const rule of recurring as any[]) {
      let runDate = String(rule.next_run_date);
      let safety = 0;
      while (runDate <= fmtDate(nextMonthEnd) && safety < 120) {
        if (runDate >= fmtDate(nextMonthStart)) {
          projectedRecurringNextMonth += Number(rule.amount);
        }
        runDate = nextDate(runDate, rule.frequency, rule.custom_days);
        safety += 1;
      }
    }

    const currentBalance = txs.reduce(
      (sum, row: any) => sum + (row.type === 'income' ? Number(row.amount) : -Number(row.amount)),
      0,
    );

    const expectedIncome = avgIncome;
    const expectedExpenses = avgExpenses + projectedRecurringNextMonth;
    const expectedNetCashFlow = expectedIncome - expectedExpenses;
    const forecastNextMonthBalance = currentBalance + expectedNetCashFlow;

    const riskLevel =
      expectedExpenses > expectedIncome
        ? 'high'
        : expectedExpenses > expectedIncome * 0.9
          ? 'medium'
          : 'low';

    const warnings: string[] = [];
    if (expectedExpenses > expectedIncome) warnings.push('Expected expenses may exceed expected income next month.');
    if (forecastNextMonthBalance < 0) warnings.push('Forecast balance may become negative.');
    if (projectedRecurringNextMonth > 0) {
      warnings.push(`Recurring outflow projected: ${projectedRecurringNextMonth.toFixed(2)} next month.`);
    }

    const nextMonth = fmtMonth(nextMonthStart);
    const trendSeries = [
      ...monthly,
      {
        month: nextMonth,
        income: expectedIncome,
        expenses: expectedExpenses,
        balance: expectedIncome - expectedExpenses,
      },
    ];

    return {
      nextMonth,
      currentBalance,
      averageIncomeLast3Months: avgIncome,
      averageExpensesLast3Months: avgExpenses,
      projectedRecurringNextMonth,
      expectedIncome,
      expectedExpenses,
      expectedNetCashFlow,
      forecastNextMonthBalance,
      riskLevel,
      warnings,
      trendSeries,
    };
  },
};

