export type AppNotificationType =
  | 'bill_reminder'
  | 'budget_overspending'
  | 'goal_milestone'
  | 'recurring_reminder'
  | 'recurring_recorded'
  | 'anomaly_alert';

export type AppNotificationItem = {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  readAt: string | null;
  dismissedAt: string | null;
};
