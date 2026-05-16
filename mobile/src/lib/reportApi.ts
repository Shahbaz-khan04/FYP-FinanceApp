import { apiClient } from './apiClient';
import { env } from '../config/env';
import type {
  BudgetVsActualPoint,
  CategorySpendingPoint,
  GoalProgressPoint,
  IncomeExpensePoint,
  StatementArchiveItem,
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

  async generateStatement(
    token: string,
    payload: { periodType: 'weekly' | 'monthly'; referenceDate?: string },
  ) {
    const response = await apiClient<{ data: StatementArchiveItem; error: null }>(
      '/reports/statements/generate',
      {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      },
    );
    return response.data;
  },

  async listStatements(token: string) {
    const response = await apiClient<{ data: StatementArchiveItem[]; error: null }>('/reports/statements', {
      method: 'GET',
      token,
    });
    return response.data;
  },

  async downloadStatementCsv(token: string, statementId: string) {
    const response = await fetch(`${env.apiBaseUrl}/reports/statements/${statementId}/download`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to download statement (${response.status})`);
    }
    const csvText = await response.text();
    const disposition = response.headers.get('content-disposition') ?? '';
    const match = disposition.match(/filename="([^"]+)"/i);
    const fileName = match?.[1] ?? `statement_${statementId}.csv`;
    return { fileName, csvText };
  },
};
