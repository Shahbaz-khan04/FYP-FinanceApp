import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { fxApi } from '../lib/fxApi';
import { apiClient } from '../lib/apiClient';
import type { AuthResponse, AuthUser, UserSettings } from '../types/auth';

const AUTH_TOKEN_KEY = 'auth_token';

const authStorage = {
  async getItem() {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(AUTH_TOKEN_KEY);
    }

    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  },
  async setItem(value: string) {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(AUTH_TOKEN_KEY, value);
      return;
    }

    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, value);
  },
  async deleteItem() {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  },
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  signUp: (payload: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  requestResetToken: (email: string) => Promise<string | null>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: { name: string; phone: string }) => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  currencyRatesBase: string | null;
  currencyRates: Record<string, number> | null;
  refreshCurrencyRates: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const normalizeSettings = (value: unknown): UserSettings => {
  if (!value || typeof value !== 'object') {
    return {
      notificationsEnabled: true,
      theme: 'dark',
      currency: 'PKR',
      billReminders: true,
      budgetAlerts: true,
      goalAlerts: true,
      recurringAlerts: true,
      anomalyAlerts: true,
    };
  }

  const raw = value as Partial<UserSettings>;
  return {
    notificationsEnabled:
      typeof raw.notificationsEnabled === 'boolean' ? raw.notificationsEnabled : true,
    theme: raw.theme === 'light' ? 'light' : 'dark',
    currency: typeof raw.currency === 'string' && raw.currency.length === 3 ? raw.currency.toUpperCase() : 'PKR',
    billReminders: raw.billReminders !== false,
    budgetAlerts: raw.budgetAlerts !== false,
    goalAlerts: raw.goalAlerts !== false,
    recurringAlerts: raw.recurringAlerts !== false,
    anomalyAlerts: raw.anomalyAlerts !== false,
  };
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [currencyRatesBase, setCurrencyRatesBase] = useState<string | null>(null);
  const [currencyRates, setCurrencyRates] = useState<Record<string, number> | null>(null);

  const persistSession = useCallback(async (auth: AuthResponse) => {
    await authStorage.setItem(auth.token);
    setToken(auth.token);
    setUser({
      ...auth.user,
      settings: normalizeSettings(auth.user.settings),
    });
  }, []);

  const clearSession = useCallback(async () => {
    await authStorage.deleteItem();
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const activeToken = token ?? (await authStorage.getItem());
    if (!activeToken) {
      return;
    }

    const response = await apiClient<{ data: AuthUser; error: null }>('/users/me', {
      method: 'GET',
      token: activeToken,
    });

    setUser({
      ...response.data,
      settings: normalizeSettings(response.data.settings),
    });
  }, [token]);

  const refreshCurrencyRates = useCallback(async () => {
    const activeToken = token ?? (await authStorage.getItem());
    const selectedCurrency = user?.settings?.currency?.toUpperCase();
    if (!activeToken || !selectedCurrency) return;
    const response = await fxApi.rates(activeToken, selectedCurrency);
    setCurrencyRatesBase(response.base);
    setCurrencyRates(response.rates);
  }, [token, user?.settings?.currency]);

  const signIn = useCallback(
    async (payload: { email: string; password: string }) => {
      const response = await apiClient<{ data: AuthResponse; error: null }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await persistSession(response.data);
    },
    [persistSession],
  );

  const signUp = useCallback(
    async (payload: { name: string; email: string; phone: string; password: string }) => {
      const response = await apiClient<{ data: AuthResponse; error: null }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await persistSession(response.data);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiClient('/auth/logout', {
          method: 'POST',
          token,
        });
      }
    } finally {
      await clearSession();
    }
  }, [clearSession, token]);

  const requestResetToken = useCallback(async (email: string) => {
    const response = await apiClient<{ data: { resetToken?: string }; error: null }>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    );

    return response.data.resetToken ?? null;
  }, []);

  const resetPassword = useCallback(async (resetToken: string, newPassword: string) => {
    await apiClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, newPassword }),
    });
  }, []);

  const updateProfile = useCallback(
    async (payload: { name: string; phone: string }) => {
      if (!token) return;

      const response = await apiClient<{ data: AuthUser; error: null }>('/users/me', {
        method: 'PATCH',
        token,
        body: JSON.stringify(payload),
      });

      setUser({
        ...response.data,
        settings: normalizeSettings(response.data.settings),
      });
    },
    [token],
  );

  const updateSettings = useCallback(
    async (settings: UserSettings) => {
      if (!token) return;

      const response = await apiClient<{ data: AuthUser; error: null }>('/users/me', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ settings }),
      });

      setUser({
        ...response.data,
        settings: normalizeSettings(response.data.settings),
      });
      const selectedCurrency = normalizeSettings(response.data.settings).currency;
      const fx = await fxApi.rates(token, selectedCurrency);
      setCurrencyRatesBase(fx.base);
      setCurrencyRates(fx.rates);
    },
    [token],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = await authStorage.getItem();

        if (!savedToken) {
          return;
        }

        setToken(savedToken);
        const response = await apiClient<{ data: AuthUser; error: null }>('/users/me', {
          method: 'GET',
          token: savedToken,
        });

        setUser({
          ...response.data,
          settings: normalizeSettings(response.data.settings),
        });
        const selectedCurrency = normalizeSettings(response.data.settings).currency;
        const fx = await fxApi.rates(savedToken, selectedCurrency);
        setCurrencyRatesBase(fx.base);
        setCurrencyRates(fx.rates);
      } catch {
        await clearSession();
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBootstrapping,
      signIn,
      signUp,
      logout,
      requestResetToken,
      resetPassword,
      refreshProfile,
      updateProfile,
      updateSettings,
      currencyRatesBase,
      currencyRates,
      refreshCurrencyRates,
    }),
    [
      user,
      token,
      isBootstrapping,
      signIn,
      signUp,
      logout,
      requestResetToken,
      resetPassword,
      refreshProfile,
      updateProfile,
      updateSettings,
      currencyRatesBase,
      currencyRates,
      refreshCurrencyRates,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
