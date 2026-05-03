export type ApiEnvelope<T> = {
  data: T;
  error: null;
};

export type ApiErrorEnvelope = {
  data: null;
  error: {
    code: string;
    message: string;
  };
};

export type CurrencyCode = 'USD' | 'PKR' | 'EUR' | 'GBP' | 'AED' | 'SAR';

export type EntityTimestampFields = {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};
