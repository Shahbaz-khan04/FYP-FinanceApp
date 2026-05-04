export type RecurringFrequency = 'weekly' | 'monthly' | 'custom';

export type RecurringTransactionRule = {
  id: string;
  user_id: string;
  amount: number;
  category_id: string;
  frequency: RecurringFrequency;
  custom_days: number | null;
  is_paused: boolean;
  start_date: string;
  next_run_date: string;
  last_run_date: string | null;
  created_at: string;
  updated_at: string;
};

