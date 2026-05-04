import { apiClient } from './apiClient';
import type {
  BudgetVsActualPoint,
  CategorySpendingPoint,
  GoalProgressPoint,
  IncomeExpensePoint,
  SpendingTrendPoint,
} from '../types/report';

export const reportApi = {
  async incomeExpenses(token: string, startDate: string, endDate: string) {
    const response = await apiClient<{ data: IncomeExpensePoint[]; error: null }>(
      `/reports/income-expenses?startDate=${startDate}&endDate=${endDate}`,
      { method: 'GET', token },
    );
    return response.data;
  },
  async categorySpending(token: string, startDate: string, endDate: string) {
    const response = await apiClient<{ data: CategorySpendingPoint[]; error: null }>(
      `/reports/category-spending?startDate=${startDate}&endDate=${endDate}`,
      { method: 'GET', token },
    );
    return response.data;
  },
  async spendingTrend(
    token: string,
    startDate: string,
    endDate: string,
    granularity: 'daily' | 'weekly',
  ) {
    const response = await apiClient<{ data: SpendingTrendPoint[]; error: null }>(
      `/reports/spending-trend?startDate=${startDate}&endDate=${endDate}&granularity=${granularity}`,
      { method: 'GET', token },
    );
    return response.data;
  },
  async budgetVsActual(token: string, month: string) {
    const response = await apiClient<{ data: BudgetVsActualPoint[]; error: null }>(
      `/reports/budget-vs-actual?month=${month}`,
      { method: 'GET', token },
    );
    return response.data;
  },
  async goalProgress(token: string) {
    const response = await apiClient<{ data: GoalProgressPoint[]; error: null }>(
      '/reports/goal-progress',
      { method: 'GET', token },
    );
    return response.data;
  },
};

