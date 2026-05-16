export type Budget = {
  id: string;
  user_id: string;
  month: string;
  category_id: string;
  planned_amount: number;
  created_at: string;
  updated_at: string;
};

export type BudgetMethodology = 'percentage' | 'envelope' | 'zero_based';

export type BudgetPlan = {
  id: string;
  user_id: string;
  month: string;
  methodology: BudgetMethodology;
  total_income: number | null;
  created_at: string;
  updated_at: string;
};
