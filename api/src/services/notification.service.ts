import { randomUUID } from 'node:crypto';
import { supabase } from '../db/supabase.js';
import type { AppNotification, AppNotificationType } from '../types/notification.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const monthRange = (month: string) => {
  const [year, monthPart] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthPart - 1, 1));
  const end = new Date(Date.UTC(year, monthPart, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

const tomorrowDate = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

const notificationPrefs = (settings: Record<string, unknown> | null | undefined) => {
  const raw = (settings ?? {}) as Record<string, unknown>;
  return {
    billReminders: raw.billReminders !== false,
    budgetAlerts: raw.budgetAlerts !== false,
    goalAlerts: raw.goalAlerts !== false,
    recurringAlerts: raw.recurringAlerts !== false,
    anomalyAlerts: raw.anomalyAlerts !== false,
  };
};

export const notificationService = {
  async list(userId: string, includeRead: boolean) {
    const db = requireDb();
    let query = db
      .from('app_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(300);
    if (!includeRead) query = query.eq('is_read', false);
    const { data, error } = await query.returns<AppNotification[]>();
    if (error) throw new HttpError(500, 'NOTIFICATION_READ_FAILED', 'Could not load notifications');
    return (data ?? []).map(this.toView);
  },

  async markRead(userId: string, notificationId: string) {
    const db = requireDb();
    const { error } = await db
      .from('app_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);
    if (error) throw new HttpError(500, 'NOTIFICATION_READ_UPDATE_FAILED', 'Could not mark notification as read');
  },

  async dismiss(userId: string, notificationId: string) {
    const db = requireDb();
    const { error } = await db
      .from('app_notifications')
      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);
    if (error) throw new HttpError(500, 'NOTIFICATION_DISMISS_FAILED', 'Could not dismiss notification');
  },

  async create(
    userId: string,
    payload: {
      type: AppNotificationType;
      title: string;
      message: string;
      metadata?: Record<string, unknown>;
      dedupeKey?: string | null;
    },
  ) {
    const db = requireDb();
    const now = new Date().toISOString();
    const { data, error } = await db
      .from('app_notifications')
      .insert({
        id: randomUUID(),
        user_id: userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata ?? {},
        dedupe_key: payload.dedupeKey ?? null,
        is_read: false,
        is_dismissed: false,
        created_at: now,
      })
      .select('*')
      .single<AppNotification>();

    if (error?.code === '23505') return null;
    if (error || !data) {
      throw new HttpError(500, 'NOTIFICATION_CREATE_FAILED', 'Could not create notification');
    }
    return this.toView(data);
  },

  async generateForUser(userId: string, month?: string) {
    const db = requireDb();
    const selectedMonth = month ?? currentMonth();
    const { start, end } = monthRange(selectedMonth);

    const { data: user, error: userError } = await db
      .from('app_users')
      .select('settings')
      .eq('id', userId)
      .maybeSingle<{ settings: Record<string, unknown> }>();
    if (userError) throw new HttpError(500, 'NOTIFICATION_PREFS_FAILED', 'Could not read notification preferences');
    const prefs = notificationPrefs(user?.settings);

    let generated = 0;

    if (prefs.budgetAlerts) {
      const [{ data: budgets, error: bError }, { data: expenses, error: eError }] = await Promise.all([
        db
          .from('budgets')
          .select('category_id,planned_amount,categories(name)')
          .eq('user_id', userId)
          .eq('month', selectedMonth),
        db
          .from('transactions')
          .select('category_id,amount')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('date', start)
          .lte('date', end),
      ]);
      if (bError || eError) throw new HttpError(500, 'NOTIFICATION_BUDGET_GEN_FAILED', 'Could not generate budget alerts');

      const spentByCat = new Map<string, number>();
      for (const row of expenses ?? []) {
        const key = (row as any).category_id ?? 'uncategorized';
        spentByCat.set(key, (spentByCat.get(key) ?? 0) + Number((row as any).amount));
      }

      for (const row of budgets ?? []) {
        const categoryId = (row as any).category_id ?? 'uncategorized';
        const planned = Number((row as any).planned_amount);
        const spent = spentByCat.get(categoryId) ?? 0;
        if (planned <= 0 || spent <= planned) continue;
        const category = Array.isArray((row as any).categories) ? (row as any).categories[0] : (row as any).categories;
        const created = await this.create(userId, {
          type: 'budget_overspending',
          title: 'Budget overspending alert',
          message: `${category?.name ?? 'Category'} exceeded budget by ${(spent - planned).toFixed(2)} this month.`,
          dedupeKey: `budget-over-${selectedMonth}-${categoryId}`,
          metadata: { month: selectedMonth, categoryId, spent, planned },
        });
        if (created) generated += 1;
      }
    }

    if (prefs.goalAlerts) {
      const { data: goals, error } = await db
        .from('goals')
        .select('id,title,target_amount,saved_amount')
        .eq('user_id', userId);
      if (error) throw new HttpError(500, 'NOTIFICATION_GOAL_GEN_FAILED', 'Could not generate goal alerts');

      for (const goal of goals ?? []) {
        const target = Number((goal as any).target_amount);
        const saved = Number((goal as any).saved_amount);
        if (target <= 0) continue;
        const percent = (saved / target) * 100;
        const milestones = [25, 50, 75, 100];
        for (const milestone of milestones) {
          if (percent < milestone) continue;
          const created = await this.create(userId, {
            type: 'goal_milestone',
            title: 'Goal milestone reached',
            message: `${(goal as any).title}: reached ${milestone}% progress.`,
            dedupeKey: `goal-${(goal as any).id}-${milestone}`,
            metadata: { goalId: (goal as any).id, milestone, percent },
          });
          if (created) generated += 1;
        }
      }
    }

    if (prefs.billReminders || prefs.recurringAlerts) {
      const tmr = tomorrowDate();
      const { data: recurring, error } = await db
        .from('recurring_transactions')
        .select('id,amount,next_run_date,categories(name)')
        .eq('user_id', userId)
        .eq('is_paused', false)
        .eq('next_run_date', tmr);
      if (error) throw new HttpError(500, 'NOTIFICATION_RECURRING_GEN_FAILED', 'Could not generate recurring reminders');

      for (const rule of recurring ?? []) {
        const category = Array.isArray((rule as any).categories) ? (rule as any).categories[0] : (rule as any).categories;
        if (prefs.recurringAlerts) {
          const created = await this.create(userId, {
            type: 'recurring_reminder',
            title: 'Recurring reminder',
            message: `${category?.name ?? 'Recurring transaction'} of ${(rule as any).amount} is scheduled for tomorrow.`,
            dedupeKey: `recur-reminder-${(rule as any).id}-${tmr}`,
            metadata: { ruleId: (rule as any).id, nextRunDate: tmr },
          });
          if (created) generated += 1;
        }
        if (prefs.billReminders && /bill|rent|utility|loan|insurance/i.test(String(category?.name ?? ''))) {
          const created = await this.create(userId, {
            type: 'bill_reminder',
            title: 'Bill reminder',
            message: `${category?.name ?? 'Bill'} is due tomorrow.`,
            dedupeKey: `bill-reminder-${(rule as any).id}-${tmr}`,
            metadata: { ruleId: (rule as any).id, nextRunDate: tmr },
          });
          if (created) generated += 1;
        }
      }
    }

    return { generated };
  },

  toView(row: AppNotification) {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      metadata: row.metadata ?? {},
      isRead: row.is_read,
      isDismissed: row.is_dismissed,
      createdAt: row.created_at,
      readAt: row.read_at,
      dismissedAt: row.dismissed_at,
    };
  },
};
