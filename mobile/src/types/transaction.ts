export type TransactionType = 'income' | 'expense';

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type TransactionItem = {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  categoryName: string | null;
  currency: string;
  paymentMethod: string;
  date: string;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TransactionPayload = {
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  date: string;
  currency: string;
  paymentMethod: string;
  notes?: string | null;
  tags?: string[];
};
