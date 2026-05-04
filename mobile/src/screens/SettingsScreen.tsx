import { useEffect, useMemo, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fxApi, type CurrencyOption } from '../lib/fxApi';
import { theme } from '../theme';
import { ActionButton, Screen } from './common';

export const SettingsScreen = () => {
  const { user, token, updateSettings } = useAuth();
  const defaults = useMemo(
    () =>
      user?.settings ?? {
        notificationsEnabled: true,
        theme: 'dark' as const,
        currency: 'PKR',
        billReminders: true,
        budgetAlerts: true,
        goalAlerts: true,
        recurringAlerts: true,
        anomalyAlerts: true,
      },
    [user?.settings],
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(defaults.notificationsEnabled);
  const [appTheme, setAppTheme] = useState<'dark' | 'light'>(defaults.theme);
  const [currency, setCurrency] = useState(defaults.currency ?? 'PKR');
  const [billReminders, setBillReminders] = useState(defaults.billReminders);
  const [budgetAlerts, setBudgetAlerts] = useState(defaults.budgetAlerts);
  const [goalAlerts, setGoalAlerts] = useState(defaults.goalAlerts);
  const [recurringAlerts, setRecurringAlerts] = useState(defaults.recurringAlerts);
  const [anomalyAlerts, setAnomalyAlerts] = useState(defaults.anomalyAlerts);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCurrencies = async () => {
      if (!token) return;
      try {
        const data = await fxApi.listCurrencies(token);
        setCurrencies(data);
      } catch {
        setCurrencies([
          { code: 'PKR', name: 'Pakistani Rupee' },
          { code: 'USD', name: 'US Dollar' },
          { code: 'EUR', name: 'Euro' },
        ]);
      }
    };
    loadCurrencies();
  }, [token]);

  const onSave = async () => {
    try {
      setMessage('');
      setError('');
      await updateSettings({
        notificationsEnabled,
        theme: appTheme,
        currency,
        billReminders,
        budgetAlerts,
        goalAlerts,
        recurringAlerts,
        anomalyAlerts,
      });
      setMessage('Settings updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Settings update failed');
    }
  };

  return (
    <Screen>
      <View
        style={{
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[3],
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ ...theme.typography.body, color: theme.colors.text.primary }}>
          Notifications
        </Text>
        <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
      </View>
      <View
        style={{
          marginTop: theme.spacing[3],
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[3],
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <Text style={{ ...theme.typography.body, color: theme.colors.text.primary, marginBottom: theme.spacing[2] }}>
          Theme
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
          {(['dark', 'light'] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setAppTheme(mode)}
              style={{
                backgroundColor: appTheme === mode ? theme.colors.brand.primary : theme.colors.background.surfaceRaised,
                paddingVertical: theme.spacing[2],
                paddingHorizontal: theme.spacing[3],
                borderRadius: theme.radius.pill,
              }}
            >
              <Text style={{ color: appTheme === mode ? theme.colors.text.inverse : theme.colors.text.primary }}>
                {mode === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View
        style={{
          marginTop: theme.spacing[3],
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[3],
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          gap: theme.spacing[2],
        }}
      >
        {[
          ['Bill reminders', billReminders, setBillReminders],
          ['Budget alerts', budgetAlerts, setBudgetAlerts],
          ['Goal alerts', goalAlerts, setGoalAlerts],
          ['Recurring alerts', recurringAlerts, setRecurringAlerts],
          ['Anomaly alerts', anomalyAlerts, setAnomalyAlerts],
        ].map(([label, value, setter]) => (
          <View
            key={String(label)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary }}>
              {String(label)}
            </Text>
            <Switch value={Boolean(value)} onValueChange={(setter as (v: boolean) => void)} />
          </View>
        ))}
      </View>
      <View
        style={{
          marginTop: theme.spacing[3],
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[3],
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <Text style={{ ...theme.typography.body, color: theme.colors.text.primary, marginBottom: theme.spacing[2] }}>
          Preferred Currency
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
          {(currencies.length ? currencies : [{ code: 'PKR', name: 'Pakistani Rupee' }]).map((item) => (
            <Pressable
              key={item.code}
              onPress={() => setCurrency(item.code)}
              style={{
                backgroundColor: currency === item.code ? theme.colors.brand.primary : theme.colors.background.surfaceRaised,
                paddingVertical: theme.spacing[2],
                paddingHorizontal: theme.spacing[3],
                borderRadius: theme.radius.pill,
              }}
            >
              <Text style={{ color: currency === item.code ? theme.colors.text.inverse : theme.colors.text.primary }}>{item.code}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {error ? (
        <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[3] }}>{error}</Text>
      ) : null}
      {message ? (
        <Text style={{ color: theme.colors.state.success, marginTop: theme.spacing[3] }}>
          {message}
        </Text>
      ) : null}
      <ActionButton label="Save settings" onPress={onSave} />
    </Screen>
  );
};
