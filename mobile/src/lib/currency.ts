import type { UserSettings } from '../types/auth';

export const getPreferredCurrency = (settings?: Partial<UserSettings> | null) => {
  const candidate = (settings?.currency ?? '').toUpperCase();
  if (/^[A-Z]{3}$/.test(candidate)) {
    return candidate;
  }
  return 'PKR';
};

export const convertAmount = (
  amount: number,
  fromCurrency: string | null | undefined,
  toCurrency: string,
  ratesBase: string | null | undefined,
  rates: Record<string, number> | null | undefined,
) => {
  const from = (fromCurrency ?? toCurrency).toUpperCase();
  const to = toCurrency.toUpperCase();
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  if (!ratesBase || !rates) return amount;
  if (ratesBase.toUpperCase() !== to) return amount;
  const toFrom = rates[from];
  if (!toFrom || !Number.isFinite(toFrom) || toFrom <= 0) return amount;
  return amount / toFrom;
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
