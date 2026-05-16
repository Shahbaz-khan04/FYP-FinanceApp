export type BudgetItem = {
  id: string;
  month: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  plannedAmount: number;
  plannedPercent: number | null;
  actualAmount: number;
  remainingAmount: number;
  percentUsed: number;
  nearLimit: boolean;
  overBudget: boolean;
};

export type BudgetMethodology = 'percentage' | 'envelope' | 'zero_based';

export type BudgetPlan = {
  month: string;
  methodology: BudgetMethodology;
  totalIncome: number | null;
};

export type BudgetListResponse = {
  plan: BudgetPlan;
  items: BudgetItem[];
  totals: {
    planned: number;
    actual: number;
    remaining: number;
    percentageAllocated: number | null;
    zeroBasedRemaining: number | null;
  };
};

export type BudgetPayload = {
  month: string;
  categoryId: string;
  plannedAmount?: number;
  plannedPercent?: number;
};
