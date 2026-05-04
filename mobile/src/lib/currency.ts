import type { UserSettings } from '../types/auth';

export const SUPPORTED_CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'] as const;

export const getPreferredCurrency = (settings?: Partial<UserSettings> | null) => {
  const candidate = (settings?.currency ?? '').toUpperCase();
  if (SUPPORTED_CURRENCIES.includes(candidate as (typeof SUPPORTED_CURRENCIES)[number])) {
    return candidate;
  }
  return 'PKR';
};

export const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};
