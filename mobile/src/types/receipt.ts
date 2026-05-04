export type ReceiptScanResult = {
  id: string;
  imageUrl: string | null;
  ocrRawText: string;
  extractedAmount: number | null;
  extractedMerchant: string | null;
  extractedDate: string | null;
  linkedTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
};
