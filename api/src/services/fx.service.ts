import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

type CurrencyItem = { code: string; name: string };

type RatesCache = {
  base: string;
  rates: Record<string, number>;
  updatedAt: number;
};

let codesCache: { items: CurrencyItem[]; updatedAt: number } | null = null;
const ratesCache = new Map<string, RatesCache>();
const TTL_MS = 12 * 60 * 60 * 1000;

const ensureApiKey = () => {
  if (!env.EXCHANGE_RATE_API_KEY) {
    throw new HttpError(500, 'FX_API_NOT_CONFIGURED', 'Exchange rate API key is not configured');
  }
};

const requestJson = async (path: string) => {
  ensureApiKey();
  const url = `${env.EXCHANGE_RATE_API_BASE_URL}/${env.EXCHANGE_RATE_API_KEY}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpError(502, 'FX_API_FAILED', `Exchange rate API request failed (${response.status})`);
  }
  return response.json() as Promise<any>;
};

export const fxService = {
  async listCurrencies() {
    const now = Date.now();
    if (codesCache && now - codesCache.updatedAt < TTL_MS) {
      return codesCache.items;
    }

    const payload = await requestJson('/codes');
    if (payload.result !== 'success' || !Array.isArray(payload.supported_codes)) {
      throw new HttpError(502, 'FX_CODES_INVALID', 'Invalid supported codes response from exchange rate API');
    }

    const items: CurrencyItem[] = payload.supported_codes.map((entry: any[]) => ({
      code: String(entry[0]).toUpperCase(),
      name: String(entry[1]),
    }));
    codesCache = { items, updatedAt: now };
    return items;
  },

  async latestRates(base: string) {
    const normalizedBase = base.toUpperCase();
    const now = Date.now();
    const cached = ratesCache.get(normalizedBase);
    if (cached && now - cached.updatedAt < TTL_MS) {
      return { base: normalizedBase, rates: cached.rates };
    }

    const payload = await requestJson(`/latest/${normalizedBase}`);
    if (payload.result !== 'success' || typeof payload.conversion_rates !== 'object') {
      throw new HttpError(502, 'FX_RATES_INVALID', 'Invalid rates response from exchange rate API');
    }

    const rates: Record<string, number> = {};
    for (const [code, value] of Object.entries(payload.conversion_rates)) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) rates[String(code).toUpperCase()] = n;
    }

    ratesCache.set(normalizedBase, {
      base: normalizedBase,
      rates,
      updatedAt: now,
    });

    return { base: normalizedBase, rates };
  },
};
