import { apiClient } from './apiClient';
import type { RecommendationSummary } from '../types/recommendation';

export const recommendationApi = {
  async get(token: string, month?: string) {
    const query = month ? `?month=${month}` : '';
    const response = await apiClient<{ data: RecommendationSummary; error: null }>(
      `/recommendations${query}`,
      {
        method: 'GET',
        token,
      },
    );
    return response.data;
  },
};
