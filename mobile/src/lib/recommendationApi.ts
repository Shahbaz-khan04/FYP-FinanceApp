import { apiClient } from './apiClient';
import type { AiRecommendationSummary, RecommendationSummary } from '../types/recommendation';

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

  async getAi(token: string, month?: string) {
    const query = month ? `?month=${month}` : '';
    const response = await apiClient<{ data: AiRecommendationSummary; error: null }>(
      `/recommendations/ai${query}`,
      {
        method: 'GET',
        token,
      },
    );
    return response.data;
  },
};
