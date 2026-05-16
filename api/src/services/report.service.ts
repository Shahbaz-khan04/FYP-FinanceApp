import { supabase } from '../db/supabase.js';
import { randomUUID } from 'node:crypto';
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

const startOfWeekUtc = (d: Date) => {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayOfWeek = date.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday start
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
};

const endOfWeekUtc = (d: Date) => {
  const start = startOfWeekUtc(d);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return end;
};

const startOfMonthUtc = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
const endOfMonthUtc = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));

const csvEscape = (value: unknown) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
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

  async generateStatement(
    userId: string,
    periodType: 'weekly' | 'monthly',
    referenceDate?: string,
  ) {
    const db = requireDb();
    const ref = referenceDate ? new Date(`${referenceDate}T00:00:00Z`) : new Date();
    if (Number.isNaN(ref.getTime())) {
      throw new HttpError(400, 'INVALID_REFERENCE_DATE', 'Reference date is invalid');
    }

    const start = periodType === 'weekly' ? startOfWeekUtc(ref) : startOfMonthUtc(ref);
    const end = periodType === 'weekly' ? endOfWeekUtc(ref) : endOfMonthUtc(ref);
    const startDate = day(start);
    const endDate = day(end);

    const { preferredCurrency, ratesBase, rates } = await currencyService.getRatesForUser(userId);
    const { data, error } = await db
      .from('transactions')
      .select('date,type,amount,currency,payment_method,notes,categories(name)')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new HttpError(500, 'STATEMENT_GENERATION_FAILED', 'Could not generate statement');

    const rows = data ?? [];
    let income = 0;
    let expenses = 0;
    for (const row of rows as any[]) {
      const amount = currencyService.convertAmount(
        Number(row.amount),
        row.currency,
        preferredCurrency,
        ratesBase,
        rates,
      );
      if (row.type === 'income') income += amount;
      else expenses += amount;
    }
    const net = income - expenses;

    const header = [
      ['Statement Type', periodType.toUpperCase()],
      ['Reference Date', day(ref)],
      ['Range Start', startDate],
      ['Range End', endDate],
      ['Currency', preferredCurrency],
      ['Total Income', income.toFixed(2)],
      ['Total Expenses', expenses.toFixed(2)],
      ['Net', net.toFixed(2)],
      [],
      ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'],
    ];

    const body = (rows as any[]).map((row) => {
      const converted = currencyService.convertAmount(
        Number(row.amount),
        row.currency,
        preferredCurrency,
        ratesBase,
        rates,
      );
      const category = Array.isArray(row.categories) ? row.categories[0]?.name : row.categories?.name;
      return [
        row.date,
        row.type,
        category ?? 'Uncategorized',
        converted.toFixed(2),
        row.payment_method ?? '',
        row.notes ?? '',
      ];
    });

    const csv = [...header, ...body]
      .map((line) => line.map((cell) => csvEscape(cell)).join(','))
      .join('\n');

    const fileName = `statement_${periodType}_${startDate}_to_${endDate}.csv`;
    const { data: saved, error: saveError } = await db
      .from('statement_exports')
      .insert({
        id: randomUUID(),
        user_id: userId,
        period_type: periodType,
        reference_date: day(ref),
        start_date: startDate,
        end_date: endDate,
        file_name: fileName,
        csv_content: csv,
        created_at: new Date().toISOString(),
      })
      .select('id,period_type,reference_date,start_date,end_date,file_name,created_at')
      .single();
    if (saveError || !saved) {
      throw new HttpError(500, 'STATEMENT_ARCHIVE_FAILED', 'Could not archive generated statement');
    }

    return {
      id: saved.id,
      periodType: saved.period_type,
      referenceDate: saved.reference_date,
      startDate: saved.start_date,
      endDate: saved.end_date,
      fileName: saved.file_name,
      createdAt: saved.created_at,
    };
  },

  async listStatements(userId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('statement_exports')
      .select('id,period_type,reference_date,start_date,end_date,file_name,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new HttpError(500, 'STATEMENT_LIST_FAILED', 'Could not load statement history');
    return (data ?? []).map((row: any) => ({
      id: row.id,
      periodType: row.period_type,
      referenceDate: row.reference_date,
      startDate: row.start_date,
      endDate: row.end_date,
      fileName: row.file_name,
      createdAt: row.created_at,
    }));
  },

  async getStatementCsv(userId: string, statementId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('statement_exports')
      .select('id,file_name,csv_content')
      .eq('id', statementId)
      .eq('user_id', userId)
      .maybeSingle<{ id: string; file_name: string; csv_content: string }>();
    if (error) throw new HttpError(500, 'STATEMENT_READ_FAILED', 'Could not read statement');
    if (!data) throw new HttpError(404, 'STATEMENT_NOT_FOUND', 'Statement not found');
    return {
      id: data.id,
      fileName: data.file_name,
      csvContent: data.csv_content,
    };
  },
};
