import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { useNotificationCenter } from '../context/NotificationContext';
import { convertAmount, formatMoney, getPreferredCurrency } from '../lib/currency';
import { dashboardApi } from '../lib/dashboardApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { DashboardCategoryBreakdown, DashboardMonthTotal, DashboardSummary } from '../types/dashboard';
import { ActionButton, EmptyState, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const currentMonth = () => new Date().toISOString().slice(0, 7);
const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};

export const DashboardScreen = ({ navigation }: Props) => {
  const { token, logout, user, currencyRates, currencyRatesBase } = useAuth();
  const { unreadCount } = useNotificationCenter();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyTotals, setMonthlyTotals] = useState<DashboardMonthTotal[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<DashboardCategoryBreakdown[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      const [summaryData, totalsData, breakdownData] = await Promise.all([
        dashboardApi.getSummary(token, month),
        dashboardApi.getMonthlyTotals(token, 6),
        dashboardApi.getCategoryBreakdown(token, month),
      ]);
      setSummary(summaryData);
      setMonthlyTotals(totalsData);
      setCategoryBreakdown(breakdownData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [month, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const maxBreakdown = useMemo(
    () => Math.max(...categoryBreakdown.map((item) => item.total), 1),
    [categoryBreakdown],
  );

  return (
    <Screen>
      <ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable onPress={() => setMonth((prev) => shiftMonth(prev, -1))}>
            <Text style={{ color: theme.colors.brand.primary }}>{'< Prev'}</Text>
          </Pressable>
          <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>{month}</Text>
          <Pressable onPress={() => setMonth((prev) => shiftMonth(prev, 1))}>
            <Text style={{ color: theme.colors.brand.primary }}>{'Next >'}</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[3] }}>
          <View style={{ flex: 1, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
            <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted }}>Income</Text>
            <Text style={{ ...theme.typography.title2, color: theme.colors.state.success }}>
              {summary ? formatMoney(summary.income, preferredCurrency) : formatMoney(0, preferredCurrency)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
            <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted }}>Expenses</Text>
            <Text style={{ ...theme.typography.title2, color: theme.colors.state.danger }}>
              {summary ? formatMoney(summary.expenses, preferredCurrency) : formatMoney(0, preferredCurrency)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
            <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted }}>Balance</Text>
            <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>
              {summary ? formatMoney(summary.balance, preferredCurrency) : formatMoney(0, preferredCurrency)}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Top Spending Categories</Text>
          {isLoading ? <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[2] }}>Loading category spending...</Text> : null}
          {!isLoading && categoryBreakdown.length === 0 ? (
            <EmptyState title="No category spending yet" subtitle="Add expense transactions to see top categories." />
          ) : null}
          {categoryBreakdown.slice(0, 5).map((item) => (
            <View key={`${item.name}-${item.categoryId ?? 'none'}`} style={{ marginTop: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                  <CategoryIcon icon={item.icon} color={item.color} />
                  <Text style={{ color: theme.colors.text.secondary }}>{item.name}</Text>
                </View>
                <Text style={{ color: theme.colors.text.primary }}>{formatMoney(item.total, preferredCurrency)}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: theme.spacing[1] }}>
                <View
                  style={{
                    width: `${(item.total / maxBreakdown) * 100}%`,
                    height: 8,
                    backgroundColor: item.color,
                    borderRadius: theme.radius.pill,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Recent Transactions</Text>
          {isLoading ? <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[2] }}>Loading recent transactions...</Text> : null}
          {!isLoading && (summary?.recentTransactions?.length ?? 0) === 0 ? (
            <EmptyState title="No transactions yet" subtitle="Create your first transaction to populate dashboard history." />
          ) : null}
          {(summary?.recentTransactions ?? []).map((tx) => (
            <View key={tx.id} style={{ marginTop: theme.spacing[2], borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle, paddingBottom: theme.spacing[2] }}>
              <Text style={{ color: theme.colors.text.primary }}>
                {formatMoney(
                  convertAmount(tx.amount, tx.currency, preferredCurrency, currencyRatesBase, currencyRates),
                  preferredCurrency,
                )}{' '}
                • {tx.type}
              </Text>
              <Text style={{ color: theme.colors.text.secondary }}>
                {tx.categoryName} • {tx.date}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[3] }}>
          <View style={{ flex: 1, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
            <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Budget Usage</Text>
            <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              Spent: {formatMoney(summary?.budgetUsage.spent ?? 0, preferredCurrency)}
            </Text>
            <Text style={{ color: theme.colors.text.secondary }}>
              Planned: {formatMoney(summary?.budgetUsage.planned ?? 0, preferredCurrency)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
            <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Goal Progress</Text>
            <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              Completed: {summary?.goalProgress.completedGoals ?? 0}/{summary?.goalProgress.totalGoals ?? 0}
            </Text>
            <Text style={{ color: theme.colors.text.secondary }}>
              Rate: {summary?.goalProgress.completionRate.toFixed(1) ?? '0.0'}%
            </Text>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Monthly Snapshot</Text>
          {monthlyTotals.map((m) => (
            <View key={m.month} style={{ marginTop: theme.spacing[2], flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.text.secondary }}>{m.month}</Text>
              <Text style={{ color: theme.colors.text.primary }}>
                +{m.income.toFixed(0)} / -{m.expenses.toFixed(0)}
              </Text>
            </View>
          ))}
        </View>

        {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
        <ActionButton label="Transactions" onPress={() => navigation.navigate('Transactions')} />
        <ActionButton label="Recurring" onPress={() => navigation.navigate('Recurring')} />
        <ActionButton label="Reports" onPress={() => navigation.navigate('Reports')} />
        <ActionButton label="Forecast" onPress={() => navigation.navigate('Forecast')} />
        <ActionButton label="Alerts" onPress={() => navigation.navigate('Alerts')} />
        <ActionButton
          label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          onPress={() => navigation.navigate('Notifications')}
        />
        <ActionButton label="Help Center" onPress={() => navigation.navigate('HelpCenter')} />
        <ActionButton label="Recommendations" onPress={() => navigation.navigate('Recommendations')} />
        <ActionButton label="Budgets" onPress={() => navigation.navigate('Budgets')} />
        <ActionButton label="Goals" onPress={() => navigation.navigate('Goals')} />
        <ActionButton label="Categories" onPress={() => navigation.navigate('Categories')} variant="secondary" />
        <ActionButton label="Profile" onPress={() => navigation.navigate('Profile')} variant="secondary" />
        <ActionButton label="Settings" onPress={() => navigation.navigate('Settings')} variant="secondary" />
        <ActionButton label="Logout" onPress={logout} variant="secondary" />
      </ScrollView>
    </Screen>
  );
};
