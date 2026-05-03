export type BudgetItem = {
  id: string;
  month: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  percentUsed: number;
  nearLimit: boolean;
  overBudget: boolean;
};

export type BudgetPayload = {
  month: string;
  categoryId: string;
  plannedAmount: number;
};

