export type ForecastPoint = {
  month: string;
  income: number;
  expenses: number;
  balance: number;
};

export type ForecastSummary = {
  nextMonth: string;
  currentBalance: number;
  averageIncomeLast3Months: number;
  averageExpensesLast3Months: number;
  projectedRecurringNextMonth: number;
  expectedIncome: number;
  expectedExpenses: number;
  expectedNetCashFlow: number;
  forecastNextMonthBalance: number;
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  trendSeries: ForecastPoint[];
};

