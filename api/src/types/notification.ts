export type AppNotificationType =
  | 'bill_reminder'
  | 'budget_overspending'
  | 'goal_milestone'
  | 'recurring_reminder'
  | 'recurring_recorded'
  | 'anomaly_alert';

export type AppNotification = {
  id: string;
  user_id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  dedupe_key: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
};
