import { apiClient } from './apiClient';

export type CurrencyOption = {
  code: string;
  name: string;
};

export const fxApi = {
  async listCurrencies(token: string) {
    const response = await apiClient<{ data: CurrencyOption[]; error: null }>('/fx/currencies', {
      method: 'GET',
      token,
    });
    return response.data;
  },

  async rates(token: string, base: string) {
    const response = await apiClient<{ data: { base: string; rates: Record<string, number> }; error: null }>(
      `/fx/rates?base=${encodeURIComponent(base.toUpperCase())}`,
      {
        method: 'GET',
        token,
      },
    );
    return response.data;
  },
};
