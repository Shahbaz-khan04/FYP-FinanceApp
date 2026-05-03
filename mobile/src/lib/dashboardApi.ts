import { apiClient } from './apiClient';
import type {
  DashboardCategoryBreakdown,
  DashboardMonthTotal,
  DashboardSummary,
} from '../types/dashboard';

export const dashboardApi = {
  async getSummary(token: string, month: string) {
    const response = await apiClient<{ data: DashboardSummary; error: null }>(
      `/dashboard/summary?month=${month}`,
      { method: 'GET', token },
    );
    return response.data;
  },

  async getMonthlyTotals(token: string, months = 6) {
    const response = await apiClient<{ data: DashboardMonthTotal[]; error: null }>(
      `/dashboard/monthly-totals?months=${months}`,
      { method: 'GET', token },
    );
    return response.data;
  },

  async getCategoryBreakdown(token: string, month: string) {
    const response = await apiClient<{ data: DashboardCategoryBreakdown[]; error: null }>(
      `/dashboard/category-breakdown?month=${month}`,
      { method: 'GET', token },
    );
    return response.data;
  },
};

