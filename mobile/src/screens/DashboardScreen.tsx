import { Ionicons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotificationCenter } from '../context/NotificationContext';
import { convertAmount, formatMoney, getPreferredCurrency } from '../lib/currency';
import { dashboardApi } from '../lib/dashboardApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { DashboardCategoryBreakdown, DashboardMonthTotal, DashboardSummary } from '../types/dashboard';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const currentMonth = () => new Date().toISOString().slice(0, 7);
const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};

const monthLabel = (month: string) => {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const shortMonth = (month: string) => {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
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

  const netWorthBars = useMemo(() => {
    const points = monthlyTotals.length > 0 ? monthlyTotals : [{ month, income: 0, expenses: 0 }];
    const values = points.map((p) => Math.max(p.income - p.expenses, 0));
    const max = Math.max(...values, 1);
    return points.map((p, i) => ({
      key: p.month,
      label: shortMonth(p.month),
      height: 26 + Math.round(((Math.max(p.income - p.expenses, 0) / max) * 84)),
      active: i === points.length - 1,
    }));
  }, [monthlyTotals, month]);

  const topSpending = useMemo(() => {
    const top = categoryBreakdown.slice(0, 3);
    const total = top.reduce((sum, item) => sum + item.total, 0);
    return top.map((item) => ({
      ...item,
      pct: total > 0 ? Math.round((item.total / total) * 100) : 0,
    }));
  }, [categoryBreakdown]);

  const budgetPct = useMemo(() => {
    const spent = summary?.budgetUsage.spent ?? 0;
    const planned = summary?.budgetUsage.planned ?? 0;
    if (planned <= 0) return 0;
    return Math.min(100, Math.round((spent / planned) * 100));
  }, [summary]);

  const goalPct = Math.max(0, Math.min(100, Math.round(summary?.goalProgress.completionRate ?? 0)));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgGlowLeft} pointerEvents="none" />
      <View style={styles.bgGlowBottom} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={16} color="#12dff8" />
            {unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View> : null}
          </Pressable>

          <Text style={styles.headerTitle}>MoneyLens</Text>

          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatarButton}>
            <Text style={styles.avatarText}>{(user?.name?.[0] ?? 'U').toUpperCase()}</Text>
          </Pressable>
        </View>

        <View style={styles.monthRow}>
          <Pressable onPress={() => setMonth((prev) => shiftMonth(prev, -1))} style={styles.monthNavBtn}>
            <Ionicons name="chevron-back" size={16} color="#90a0ad" />
          </Pressable>
          <View>
            <Text style={styles.monthTitle}>{monthLabel(month)}</Text>
            <Text style={styles.monthSub}>OVERVIEW</Text>
          </View>
          <Pressable onPress={() => setMonth((prev) => shiftMonth(prev, 1))} style={styles.monthNavBtn}>
            <Ionicons name="chevron-forward" size={16} color="#90a0ad" />
          </Pressable>
        </View>

        <View style={styles.metricsRow}>
          <Pressable style={[styles.card, styles.balanceCard]} onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.cardLabel}>TOTAL BALANCE</Text>
            <Text style={styles.mainAmount}>{formatMoney(summary?.balance ?? 0, preferredCurrency)}</Text>
            <Text style={styles.posText}>~ {summary?.balance ? 'Live from transactions' : 'Add transactions to begin'}</Text>
          </Pressable>

          <Pressable style={[styles.card, styles.sideCard]} onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.cardLabel}>INCOME</Text>
            <Text style={styles.sideAmount}>{formatMoney(summary?.income ?? 0, preferredCurrency)}</Text>
            <View style={styles.sideLine} />
            <Text style={styles.cardLabel}>EXPENSE</Text>
            <Text style={[styles.sideAmount, { color: '#c8d4df' }]}>{formatMoney(summary?.expenses ?? 0, preferredCurrency)}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.card} onPress={() => navigation.navigate('Reports')}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Net Worth Trend</Text>
            <Ionicons name="information-circle-outline" size={16} color="#7d8c99" />
          </View>
          <View style={styles.barChartRow}>
            {netWorthBars.map((bar) => (
              <View key={bar.key} style={styles.barWrap}>
                <View style={[styles.bar, { height: bar.height }, bar.active ? styles.barActive : null]} />
                <Text style={styles.barLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        <Pressable style={styles.card} onPress={() => navigation.navigate('Categories')}>
          <Text style={styles.sectionTitle}>Top Spending</Text>
          {topSpending.length === 0 ? <Text style={styles.helperText}>No category spending data yet.</Text> : null}
          {topSpending.map((item) => (
            <View key={`${item.name}-${item.categoryId ?? 'none'}`} style={styles.progressRowBlock}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{item.name}</Text>
                <Text style={styles.progressPct}>{item.pct}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${item.pct}%`, backgroundColor: item.color || '#14dff8' }]} />
              </View>
            </View>
          ))}
        </Pressable>

        <Pressable style={[styles.card, styles.inlineCard]} onPress={() => navigation.navigate('Budgets')}>
          <View style={styles.ringWrap}>
            <Text style={styles.ringText}>{budgetPct}%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Budget Used</Text>
            <Text style={styles.helperText}>
              {formatMoney(summary?.budgetUsage.spent ?? 0, preferredCurrency)} / {formatMoney(summary?.budgetUsage.planned ?? 0, preferredCurrency)}
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.card} onPress={() => navigation.navigate('Goals')}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Goal Progress</Text>
            <Text style={styles.goalPct}>{goalPct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${goalPct}%`, backgroundColor: '#14dff8' }]} />
          </View>
          <Text style={styles.helperText}>
            {summary?.goalProgress.completedGoals ?? 0}/{summary?.goalProgress.totalGoals ?? 0} goals completed
          </Text>
        </Pressable>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Pressable onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.linkText}>See All</Text>
          </Pressable>
        </View>

        {(summary?.recentTransactions ?? []).slice(0, 5).map((tx) => {
          const amount = convertAmount(tx.amount, tx.currency, preferredCurrency, currencyRatesBase, currencyRates);
          const isExpense = tx.type === 'expense';
          return (
            <Pressable key={tx.id} style={styles.activityRow} onPress={() => navigation.navigate('Transactions')}>
              <View style={styles.activityIconWrap}>
                <Ionicons name={isExpense ? 'arrow-down-outline' : 'arrow-up-outline'} size={14} color="#14dff8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{tx.categoryName}</Text>
                <Text style={styles.activityMeta}>{tx.date}</Text>
              </View>
              <Text style={styles.activityAmount}>{`${isExpense ? '-' : '+'}${formatMoney(Math.abs(amount), preferredCurrency)}`}</Text>
            </Pressable>
          );
        })}

        {!isLoading && (summary?.recentTransactions?.length ?? 0) === 0 ? (
          <Text style={styles.helperText}>No recent transactions yet.</Text>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.fab} onPress={() => navigation.navigate('AddTransaction')}>
          <Ionicons name="add" size={20} color="#00323a" />
        </Pressable>

        <View style={styles.bottomNav}>
          <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="grid-outline" size={14} color="#14dff8" />
            <Text style={[styles.bottomNavLabel, { color: '#c6f9ff' }]}>DASHBOARD</Text>
          </Pressable>
          <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Transactions')}>
            <Ionicons name="receipt-outline" size={14} color="#7f909d" />
            <Text style={styles.bottomNavLabel}>TRANSACTIONS</Text>
          </Pressable>
          <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Budgets')}>
            <Ionicons name="pie-chart-outline" size={14} color="#7f909d" />
            <Text style={styles.bottomNavLabel}>BUDGETS</Text>
          </Pressable>
          <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Goals')}>
            <Ionicons name="radio-button-on-outline" size={14} color="#7f909d" />
            <Text style={styles.bottomNavLabel}>GOALS</Text>
          </Pressable>
          <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={14} color="#7f909d" />
            <Text style={styles.bottomNavLabel}>SETTINGS</Text>
          </Pressable>
        </View>

        <Pressable style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050914',
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 20,
  },
  bgGlowLeft: {
    position: 'absolute',
    left: -110,
    top: 90,
    width: 240,
    height: 420,
    borderRadius: 200,
    backgroundColor: 'rgba(14, 201, 233, 0.1)',
  },
  bgGlowBottom: {
    position: 'absolute',
    right: -90,
    bottom: -120,
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: 'rgba(50, 42, 255, 0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(154, 170, 184, 0.18)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(12, 19, 33, 0.78)',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -5,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#14dff8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 9,
    color: '#032432',
    fontWeight: '700',
  },
  headerTitle: {
    color: '#15def8',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  avatarButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(24, 34, 50, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#c7d5df',
    fontSize: 12,
    fontWeight: '700',
  },
  monthRow: {
    marginTop: 4,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(154, 170, 184, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 25, 40, 0.8)',
  },
  monthTitle: {
    color: '#d3dde5',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  monthSub: {
    marginTop: 2,
    color: '#738390',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(17, 25, 39, 0.82)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  balanceCard: {
    flex: 1.45,
  },
  sideCard: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#8293a0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  mainAmount: {
    marginTop: 6,
    color: '#b9f7ff',
    fontSize: 20,
    fontWeight: '800',
  },
  sideAmount: {
    marginTop: 3,
    color: '#14dff8',
    fontSize: 14,
    fontWeight: '700',
  },
  sideLine: {
    marginVertical: 5,
    width: 30,
    height: 2,
    backgroundColor: '#14dff8',
    borderRadius: 2,
  },
  posText: {
    marginTop: 6,
    color: '#17d2eb',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#dbe3ea',
    fontSize: 18,
    fontWeight: '700',
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: 4,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(20, 223, 248, 0.4)',
  },
  barActive: {
    backgroundColor: '#b9f7ff',
  },
  barLabel: {
    marginTop: 6,
    color: '#81909c',
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 4,
    color: '#8a99a5',
    fontSize: 14,
    fontWeight: '500',
  },
  progressRowBlock: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: '#c9d5de',
    fontSize: 14,
    fontWeight: '600',
  },
  progressPct: {
    color: '#97a9b6',
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    marginTop: 4,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(150, 166, 179, 0.24)',
    overflow: 'hidden',
  },
  fill: {
    height: 7,
    borderRadius: 4,
  },
  inlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ringWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#c8faff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    color: '#c8faff',
    fontSize: 14,
    fontWeight: '700',
  },
  goalPct: {
    color: '#14dff8',
    fontSize: 18,
    fontWeight: '700',
  },
  quickRow: {
    marginTop: 4,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickBtn: {
    width: 68,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(154, 170, 184, 0.18)',
    backgroundColor: 'rgba(17, 25, 39, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  quickText: {
    color: '#95a6b3',
    fontSize: 10,
    fontWeight: '700',
  },
  recentHeader: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    color: '#16ddf7',
    fontSize: 14,
    fontWeight: '700',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(154, 170, 184, 0.18)',
    borderRadius: 10,
    backgroundColor: 'rgba(17, 25, 39, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  activityIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(57, 71, 87, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    color: '#d4dee6',
    fontSize: 14,
    fontWeight: '700',
  },
  activityMeta: {
    color: '#8596a2',
    fontSize: 14,
    fontWeight: '500',
  },
  activityAmount: {
    color: '#d7e1e8',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 4,
    marginBottom: 6,
    color: '#ff8089',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 14,
    bottom: 74,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#17def8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17def8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomNav: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(12, 20, 34, 0.9)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bottomNavLabel: {
    color: '#778997',
    fontSize: 9,
    fontWeight: '700',
  },
  logout: {
    marginTop: 10,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(154, 170, 184, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(17, 25, 39, 0.8)',
  },
  logoutText: {
    color: '#a8b7c4',
    fontSize: 14,
    fontWeight: '600',
  },
});
