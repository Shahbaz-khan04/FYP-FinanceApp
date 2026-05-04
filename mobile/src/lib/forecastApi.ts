import { apiClient } from './apiClient';
import type { ForecastSummary } from '../types/forecast';

export const forecastApi = {
  async get(token: string) {
    const response = await apiClient<{ data: ForecastSummary; error: null }>('/forecast', {
      method: 'GET',
      token,
    });
    return response.data;
  },
};

