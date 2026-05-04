import { apiClient } from './apiClient';
import type { ReceiptScanResult } from '../types/receipt';

export const receiptApi = {
  async scan(
    token: string,
    payload: {
      imageBase64?: string;
      imageUrl?: string;
    },
  ) {
    const response = await apiClient<{ data: ReceiptScanResult; error: null }>('/receipts/scan', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async link(token: string, receiptId: string, transactionId: string) {
    await apiClient<{ data: { id: string; linkedTransactionId: string | null }; error: null }>(
      `/receipts/${receiptId}/link`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ transactionId }),
      },
    );
  },
};
