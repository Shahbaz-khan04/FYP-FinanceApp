export type IncomeExpensePoint = {
  month: string;
  income: number;
  expenses: number;
};

export type CategorySpendingPoint = {
  category: string;
  amount: number;
  percent: number;
  color: string;
  icon: string;
};

export type SpendingTrendPoint = {
  period: string;
  amount: number;
};

export type BudgetVsActualPoint = {
  category: string;
  icon: string;
  color: string;
  planned: number;
  actual: number;
  remaining: number;
  percentUsed: number;
};

export type GoalProgressPoint = {
  title: string;
  targetAmount: number;
  savedAmount: number;
  remainingAmount: number;
  progressPercent: number;
  isCompleted: boolean;
  deadline: string;
};

