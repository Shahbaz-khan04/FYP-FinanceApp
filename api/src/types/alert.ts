export type AlertType =
  | 'high_transaction'
  | 'category_overspending'
  | 'spending_spike'
  | 'duplicate_transaction';

export type AlertSeverity = 'low' | 'medium' | 'high';

export type AnomalyAlert = {
  id: string;
  user_id: string;
  transaction_id: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_dismissed: boolean;
  created_at: string;
  dismissed_at: string | null;
};
