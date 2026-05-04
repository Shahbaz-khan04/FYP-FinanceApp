export type RecurringFrequency = 'weekly' | 'monthly' | 'custom';

export type RecurringRule = {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  frequency: RecurringFrequency;
  customDays: number | null;
  isPaused: boolean;
  startDate: string;
  nextRunDate: string;
  lastRunDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecurringPayload = {
  amount: number;
  categoryId: string;
  frequency: RecurringFrequency;
  customDays?: number;
  startDate?: string;
};

