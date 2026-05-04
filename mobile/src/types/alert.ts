export type AlertSeverity = 'low' | 'medium' | 'high';

export type AlertType =
  | 'high_transaction'
  | 'category_overspending'
  | 'spending_spike'
  | 'duplicate_transaction';

export type AnomalyAlert = {
  id: string;
  transactionId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  isDismissed: boolean;
  createdAt: string;
  dismissedAt: string | null;
};
