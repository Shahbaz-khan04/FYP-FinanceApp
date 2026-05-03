export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string | null;
  currency: string;
  payment_method: string;
  date: string;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};
