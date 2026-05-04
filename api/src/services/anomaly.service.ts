import { randomUUID } from 'node:crypto';
import { supabase } from '../db/supabase.js';
import type { AlertSeverity, AlertType, AnomalyAlert } from '../types/alert.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

const monthWindow = (month: string) => {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

const shiftMonth = (month: string, delta: number) => {
  const [year, mon] = month.split('-').map(Number);
  const d = new Date(Date.UTC(year, mon - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};

const monthFromDate = (date: string) => date.slice(0, 7);

const severityFromRatio = (ratio: number): AlertSeverity => {
  if (ratio >= 2.5) return 'high';
  if (ratio >= 1.75) return 'medium';
  return 'low';
};

export const anomalyService = {
  async listAlerts(userId: string, includeDismissed: boolean) {
    const db = requireDb();
    let query = db
      .from('anomaly_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!includeDismissed) {
      query = query.eq('is_dismissed', false);
    }

    const { data, error } = await query.returns<AnomalyAlert[]>();
    if (error) {
      throw new HttpError(500, 'ALERT_READ_FAILED', 'Could not fetch alerts');
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      transactionId: row.transaction_id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      metadata: row.metadata ?? {},
      isDismissed: row.is_dismissed,
      createdAt: row.created_at,
      dismissedAt: row.dismissed_at,
    }));
  },

  async dismissAlert(userId: string, alertId: string) {
    const db = requireDb();
    const { error } = await db
      .from('anomaly_alerts')
      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) {
      throw new HttpError(500, 'ALERT_DISMISS_FAILED', 'Could not dismiss alert');
    }
  },

  async detectForMonth(userId: string, month?: string) {
    const db = requireDb();
    const targetMonth = month ?? new Date().toISOString().slice(0, 7);
    const { start, end } = monthWindow(targetMonth);
    const { data, error } = await db
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);

    if (error) {
      throw new HttpError(500, 'ANOMALY_SCAN_FAILED', 'Could not scan transactions');
    }

    for (const row of data ?? []) {
      await this.detectForTransaction(userId, (row as any).id);
    }

    return { scanned: (data ?? []).length };
  },

  async detectForTransaction(userId: string, transactionId: string) {
    const db = requireDb();
    const { data: tx, error: txError } = await db
      .from('transactions')
      .select('id,amount,type,category_id,date,currency')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (txError) {
      throw new HttpError(500, 'ANOMALY_TX_READ_FAILED', 'Could not evaluate transaction');
    }
    if (!tx) return [];

    const alertsCreated: string[] = [];
    const amount = Number((tx as any).amount);
    const txType = String((tx as any).type);
    const txDate = String((tx as any).date);
    const txMonth = monthFromDate(txDate);
    const categoryId = (tx as any).category_id as string | null;

    if (txType === 'expense') {
      const catAlert = await this.detectHighVsCategoryAverage(userId, transactionId, amount, categoryId, txDate);
      if (catAlert) alertsCreated.push(catAlert);

      const monthSpike = await this.detectMonthSpendingSpike(userId, transactionId, txMonth);
      if (monthSpike) alertsCreated.push(monthSpike);

      const catOver = await this.detectCategoryOverspending(userId, transactionId, txMonth, categoryId);
      if (catOver) alertsCreated.push(catOver);
    }

    const dup = await this.detectDuplicateLike(userId, transactionId, amount, txType, categoryId, txDate);
    if (dup) alertsCreated.push(dup);

    return alertsCreated;
  },

  async detectHighVsCategoryAverage(
    userId: string,
    transactionId: string,
    amount: number,
    categoryId: string | null,
    txDate: string,
  ) {
    const db = requireDb();
    const d = new Date(`${txDate}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 3);
    const startDate = d.toISOString().slice(0, 10);

    let query = db
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .neq('id', transactionId)
      .gte('date', startDate)
      .lt('date', txDate);

    query = categoryId ? query.eq('category_id', categoryId) : query.is('category_id', null);
    const { data, error } = await query;
    if (error) {
      throw new HttpError(500, 'ANOMALY_AVG_FAILED', 'Could not compute category baseline');
    }

    const samples = (data ?? []).map((row: any) => Number(row.amount)).filter((v) => Number.isFinite(v) && v > 0);
    if (samples.length < 3) return null;
    const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
    if (amount < avg * 1.8) return null;

    const ratio = amount / avg;
    return this.insertAlertIfNew(userId, {
      transactionId,
      type: 'high_transaction',
      severity: severityFromRatio(ratio),
      title: 'Unusually high transaction',
      message: `This expense (${amount.toFixed(2)}) is much higher than your category average (${avg.toFixed(2)}).`,
      metadata: { ratio, avg, amount, categoryId },
    });
  },

  async detectCategoryOverspending(
    userId: string,
    transactionId: string,
    txMonth: string,
    categoryId: string | null,
  ) {
    const db = requireDb();
    if (!categoryId) return null;

    const { start, end } = monthWindow(txMonth);
    const { data: curRows, error: curError } = await db
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .eq('category_id', categoryId)
      .gte('date', start)
      .lte('date', end);

    if (curError) {
      throw new HttpError(500, 'ANOMALY_CUR_CAT_FAILED', 'Could not compute current category spend');
    }

    const currentSpend = (curRows ?? []).reduce((s: number, row: any) => s + Number(row.amount), 0);

    const previousMonths = [shiftMonth(txMonth, -1), shiftMonth(txMonth, -2), shiftMonth(txMonth, -3)];
    const prevTotals: number[] = [];
    for (const month of previousMonths) {
      const window = monthWindow(month);
      const { data, error } = await db
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .eq('category_id', categoryId)
        .gte('date', window.start)
        .lte('date', window.end);
      if (error) {
        throw new HttpError(500, 'ANOMALY_PREV_CAT_FAILED', 'Could not compute category baseline');
      }
      prevTotals.push((data ?? []).reduce((s: number, row: any) => s + Number(row.amount), 0));
    }

    const avgPrev = prevTotals.reduce((s, v) => s + v, 0) / prevTotals.length;
    if (avgPrev <= 0) return null;
    if (currentSpend < avgPrev * 1.4) return null;

    const ratio = currentSpend / avgPrev;
    return this.insertAlertIfNew(userId, {
      transactionId,
      type: 'category_overspending',
      severity: severityFromRatio(ratio),
      title: 'Category overspending detected',
      message: `This month spend in this category (${currentSpend.toFixed(2)}) is above normal (${avgPrev.toFixed(2)} avg).`,
      metadata: { txMonth, categoryId, currentSpend, avgPrev, ratio },
    });
  },

  async detectMonthSpendingSpike(userId: string, transactionId: string, txMonth: string) {
    const db = requireDb();
    const { start, end } = monthWindow(txMonth);
    const { data: curRows, error: curError } = await db
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end);

    if (curError) {
      throw new HttpError(500, 'ANOMALY_CUR_MONTH_FAILED', 'Could not compute monthly spend');
    }

    const current = (curRows ?? []).reduce((s: number, row: any) => s + Number(row.amount), 0);
    const prevMonths = [shiftMonth(txMonth, -1), shiftMonth(txMonth, -2), shiftMonth(txMonth, -3)];
    const prevTotals: number[] = [];
    for (const month of prevMonths) {
      const window = monthWindow(month);
      const { data, error } = await db
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', window.start)
        .lte('date', window.end);
      if (error) {
        throw new HttpError(500, 'ANOMALY_PREV_MONTH_FAILED', 'Could not compute previous months');
      }
      prevTotals.push((data ?? []).reduce((s: number, row: any) => s + Number(row.amount), 0));
    }

    const avgPrev = prevTotals.reduce((s, v) => s + v, 0) / prevTotals.length;
    if (avgPrev <= 0) return null;
    if (current < avgPrev * 1.5) return null;

    const ratio = current / avgPrev;
    return this.insertAlertIfNew(userId, {
      transactionId,
      type: 'spending_spike',
      severity: severityFromRatio(ratio),
      title: 'Sudden spending increase',
      message: `This month expenses (${current.toFixed(2)}) are much higher than recent average (${avgPrev.toFixed(2)}).`,
      metadata: { txMonth, current, avgPrev, ratio },
    });
  },

  async detectDuplicateLike(
    userId: string,
    transactionId: string,
    amount: number,
    type: string,
    categoryId: string | null,
    txDate: string,
  ) {
    const db = requireDb();
    let query = db
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('amount', amount)
      .eq('date', txDate)
      .neq('id', transactionId)
      .limit(5);

    query = categoryId ? query.eq('category_id', categoryId) : query.is('category_id', null);
    const { data, error } = await query;
    if (error) {
      throw new HttpError(500, 'ANOMALY_DUPLICATE_FAILED', 'Could not detect duplicate transactions');
    }

    if (!(data ?? []).length) return null;
    return this.insertAlertIfNew(userId, {
      transactionId,
      type: 'duplicate_transaction',
      severity: 'medium',
      title: 'Possible duplicate transaction',
      message: 'A similar transaction already exists with the same amount, date, and category.',
      metadata: { similarIds: (data ?? []).map((row: any) => row.id), amount, type, categoryId, txDate },
    });
  },

  async insertAlertIfNew(
    userId: string,
    payload: {
      transactionId: string;
      type: AlertType;
      severity: AlertSeverity;
      title: string;
      message: string;
      metadata: Record<string, unknown>;
    },
  ) {
    const db = requireDb();
    const { data: existing, error: findError } = await db
      .from('anomaly_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('transaction_id', payload.transactionId)
      .eq('type', payload.type)
      .eq('is_dismissed', false)
      .limit(1);

    if (findError) {
      throw new HttpError(500, 'ALERT_DUP_CHECK_FAILED', 'Could not check existing alert');
    }
    if ((existing ?? []).length > 0) return null;

    const { data, error } = await db
      .from('anomaly_alerts')
      .insert({
        id: randomUUID(),
        user_id: userId,
        transaction_id: payload.transactionId,
        type: payload.type,
        severity: payload.severity,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata,
        is_dismissed: false,
      })
      .select('id')
      .single();

    if (error) {
      throw new HttpError(500, 'ALERT_CREATE_FAILED', 'Could not create anomaly alert');
    }

    return (data as any).id as string;
  },
};
