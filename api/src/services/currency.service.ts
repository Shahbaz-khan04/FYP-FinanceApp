import { fxService } from './fx.service.js';
import { supabase } from '../db/supabase.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

export const currencyService = {
  async getUserPreferredCurrency(userId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('app_users')
      .select('settings')
      .eq('id', userId)
      .maybeSingle<{ settings: Record<string, unknown> }>();
    if (error) {
      throw new HttpError(500, 'CURRENCY_SETTINGS_READ_FAILED', 'Could not read user currency settings');
    }
    const raw = String((data?.settings?.currency as string | undefined) ?? 'PKR').toUpperCase();
    return /^[A-Z]{3}$/.test(raw) ? raw : 'PKR';
  },

  async getRatesForUser(userId: string) {
    const preferredCurrency = await this.getUserPreferredCurrency(userId);
    try {
      const fx = await fxService.latestRates(preferredCurrency);
      return {
        preferredCurrency,
        ratesBase: fx.base,
        rates: fx.rates,
      };
    } catch {
      return {
        preferredCurrency,
        ratesBase: preferredCurrency,
        rates: { [preferredCurrency]: 1 },
      };
    }
  },

  convertAmount(amount: number, fromCurrency: string | null | undefined, toCurrency: string, ratesBase: string, rates: Record<string, number>) {
    const from = String(fromCurrency ?? toCurrency).toUpperCase();
    const to = toCurrency.toUpperCase();
    if (!Number.isFinite(amount)) return 0;
    if (from === to) return amount;
    if (ratesBase.toUpperCase() !== to) return amount;
    const rateFrom = rates[from];
    if (!rateFrom || !Number.isFinite(rateFrom) || rateFrom <= 0) return amount;
    return amount / rateFrom;
  },
};
