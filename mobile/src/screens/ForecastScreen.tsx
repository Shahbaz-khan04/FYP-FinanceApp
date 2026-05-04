import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { forecastApi } from '../lib/forecastApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { ForecastSummary } from '../types/forecast';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Forecast'>;

export const ForecastScreen = ({ navigation }: Props) => {
  const { token } = useAuth();
  const [summary, setSummary] = useState<ForecastSummary | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      setSummary(await forecastApi.get(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecast');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const maxTrend = useMemo(
    () => Math.max(...(summary?.trendSeries.map((x) => Math.max(x.income, x.expenses)) ?? [1]), 1),
    [summary?.trendSeries],
  );

  return (
    <Screen>
      <ScrollView>
        <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>Forecast ({summary?.nextMonth ?? '-'})</Text>

        <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[3] }}>
          <View style={{ flex: 1, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
            <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted }}>Expected Income</Text>
            <Text style={{ ...theme.typography.title2, color: theme.colors.state.success }}>
              {summary ? summary.expectedIncome.toFixed(2) : '0.00'}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
            <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted }}>Expected Expenses</Text>
            <Text style={{ ...theme.typography.title2, color: theme.colors.state.danger }}>
              {summary ? summary.expectedExpenses.toFixed(2) : '0.00'}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Cash Flow Summary</Text>
          <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
            Current balance: {summary?.currentBalance.toFixed(2) ?? '0.00'}
          </Text>
          <Text style={{ color: theme.colors.text.secondary }}>
            Expected net cash flow: {summary?.expectedNetCashFlow.toFixed(2) ?? '0.00'}
          </Text>
          <Text style={{ color: theme.colors.text.secondary }}>
            Forecast next month balance: {summary?.forecastNextMonthBalance.toFixed(2) ?? '0.00'}
          </Text>
          <Text style={{ color: theme.colors.text.secondary }}>
            3-month avg income/expense: {summary?.averageIncomeLast3Months.toFixed(2) ?? '0.00'} / {summary?.averageExpensesLast3Months.toFixed(2) ?? '0.00'}
          </Text>
          <Text style={{ color: theme.colors.text.secondary }}>
            Recurring projection: {summary?.projectedRecurringNextMonth.toFixed(2) ?? '0.00'}
          </Text>
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Forecast Chart</Text>
          {(summary?.trendSeries ?? []).map((point) => (
            <View key={point.month} style={{ marginTop: theme.spacing[2] }}>
              <Text style={{ color: theme.colors.text.secondary }}>{point.month}</Text>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: 4 }}>
                <View style={{ width: `${(point.income / maxTrend) * 100}%`, height: 8, backgroundColor: theme.colors.state.success, borderRadius: theme.radius.pill }} />
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: 4 }}>
                <View style={{ width: `${(point.expenses / maxTrend) * 100}%`, height: 8, backgroundColor: theme.colors.state.danger, borderRadius: theme.radius.pill }} />
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3], borderWidth: 1, borderColor: summary?.riskLevel === 'high' ? theme.colors.state.danger : summary?.riskLevel === 'medium' ? theme.colors.brand.tertiary : theme.colors.state.success }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>
            Risk level: {summary?.riskLevel?.toUpperCase() ?? 'LOW'}
          </Text>
          {(summary?.warnings ?? []).map((w) => (
            <Text key={w} style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              - {w}
            </Text>
          ))}
        </View>

        {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
        <ActionButton label="Refresh Forecast" onPress={load} />
        <ActionButton label="Back to Dashboard" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </ScrollView>
    </Screen>
  );
};

