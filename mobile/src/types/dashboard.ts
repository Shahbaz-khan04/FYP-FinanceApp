export type DashboardSummary = {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  topSpendingCategories: Array<{
    categoryId: string | null;
    name: string;
    total: number;
    color: string;
    icon: string;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    currency: string;
    paymentMethod: string;
    notes: string | null;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
  }>;
  budgetUsage: {
    planned: number;
    spent: number;
    remaining: number;
    percentUsed: number;
  };
  goalProgress: {
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
  };
};

export type DashboardMonthTotal = {
  month: string;
  income: number;
  expenses: number;
  balance: number;
};

export type DashboardCategoryBreakdown = {
  categoryId: string | null;
  name: string;
  total: number;
  percent: number;
  color: string;
  icon: string;
};

