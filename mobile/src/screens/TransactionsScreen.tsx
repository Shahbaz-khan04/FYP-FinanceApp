import { Ionicons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { useNotificationCenter } from '../context/NotificationContext';
import { alertsApi } from '../lib/alertsApi';
import { convertAmount, formatMoney, getPreferredCurrency } from '../lib/currency';
import { offlineTransactions } from '../lib/offlineTransactions';
import { transactionsApi } from '../lib/transactionsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { AnomalyAlert } from '../types/alert';
import type { Category, TransactionItem, TransactionType } from '../types/transaction';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;

export const TransactionsScreen = ({ navigation }: Props) => {
  const { token, user, currencyRates, currencyRatesBase } = useAuth();
  const { unreadCount } = useNotificationCenter();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const netInfo = useNetInfo();
  const isOnline = Boolean(netInfo.isConnected);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<TransactionType | ''>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
  const [openAlerts, setOpenAlerts] = useState<AnomalyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const total = useMemo(
    () => transactions.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0),
    [transactions],
  );

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      setSyncStatus(isOnline ? 'idle' : 'offline');
      const [tx, cats] = await Promise.all([
        offlineTransactions.loadTransactions(token, isOnline, {
          ...(type ? { type } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        }),
        transactionsApi.listCategories(token, type || undefined),
      ]);
      setTransactions(tx);
      setCategories(cats);
      try {
        const alerts = await alertsApi.list(token, false);
        setOpenAlerts(alerts);
      } catch {
        setOpenAlerts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, endDate, isOnline, search, startDate, token, type]);

  const runSync = useCallback(async () => {
    if (!token || !isOnline) return;
    try {
      setSyncStatus('syncing');
      await offlineTransactions.sync(token);
      setSyncStatus('synced');
      await load();
      setTimeout(() => setSyncStatus('idle'), 1200);
    } catch {
      setSyncStatus('idle');
    }
  }, [isOnline, load, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (isOnline) runSync();
    else setSyncStatus('offline');
  }, [isOnline, runSync]);

  const totalLabel = useMemo(() => {
    const amount = formatMoney(Math.abs(total), preferredCurrency);
    return total < 0 ? `-${amount}` : amount;
  }, [preferredCurrency, total]);

  const dateWindow = useMemo(() => {
    if (!transactions.length) return 'No data';
    const first = transactions[transactions.length - 1]?.date;
    const last = transactions[0]?.date;
    return `${first} → ${last}`;
  }, [transactions]);

  const categoryLookup = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgGlowLeft} pointerEvents="none" />
      <View style={styles.bgGlowBottom} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={16} color="#12dff8" />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Text style={styles.headerTitle}>MoneyLens</Text>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatarButton}>
            <Text style={styles.avatarText}>{(user?.name?.[0] ?? 'U').toUpperCase()}</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#7e8d99" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            placeholderTextColor="#7e8d99"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.typeRow}>
          <Pressable
            onPress={() => setType('expense')}
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
          >
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>EXPENSE</Text>
          </Pressable>
          <Pressable
            onPress={() => setType('income')}
            style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
          >
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>INCOME</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <View style={styles.chipsRow}>
            <Pressable
              onPress={() => setCategoryId('')}
              style={[styles.chip, !categoryId && styles.chipActive]}
            >
              <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>ALL</Text>
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(categoryId === category.id ? '' : category.id)}
                style={[styles.chip, categoryId === category.id && styles.chipActive]}
              >
                <View style={styles.chipContent}>
                  <CategoryIcon icon={category.icon} color={category.color} />
                  <Text style={[styles.chipText, categoryId === category.id && styles.chipTextActive]}>{category.name.toUpperCase()}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryLabel}>NET TOTAL</Text>
            <Ionicons name="calendar-outline" size={14} color="#7f909d" />
          </View>
          <Text style={styles.summaryAmount}>{totalLabel}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{isOnline ? `SYNC ${syncStatus.toUpperCase()}` : 'OFFLINE MODE'}</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickBtn} onPress={() => navigation.navigate('AddTransaction')}>
            <Ionicons name="add" size={16} color="#12dff8" />
            <Text style={styles.quickText}>ADD</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => navigation.navigate('ReceiptScan')}>
            <Ionicons name="scan-outline" size={16} color="#b9c9d6" />
            <Text style={styles.quickText}>SCAN</Text>
          </Pressable>
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.dateWindow}>{dateWindow}</Text>
        </View>

        <View style={styles.dateFiltersRow}>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="Start YYYY-MM-DD"
            placeholderTextColor="#7e8d99"
            style={styles.dateInput}
          />
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            placeholder="End YYYY-MM-DD"
            placeholderTextColor="#7e8d99"
            style={styles.dateInput}
          />
          <Pressable onPress={load} style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>APPLY</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading ? <Text style={styles.helperText}>Loading transactions...</Text> : null}
        {!isLoading && transactions.length === 0 ? <Text style={styles.helperText}>No transactions found.</Text> : null}

        {transactions.map((item) => {
          const amount = convertAmount(item.amount, item.currency, preferredCurrency, currencyRatesBase, currencyRates);
          const isExpense = item.type === 'expense';
          const hasAlert = openAlerts.some((alert) => alert.transactionId === item.id && !alert.isDismissed);
          const categoryMeta = item.categoryId ? categoryLookup.get(item.categoryId) : undefined;
          return (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
              style={styles.activityRow}
            >
              <View style={styles.activityIconWrap}>
                <CategoryIcon icon={categoryMeta?.icon ?? 'pricetag'} color={categoryMeta?.color ?? '#14dff8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {item.notes?.trim() || item.categoryName || 'Transaction'}
                </Text>
                <Text style={styles.activityMeta}>{`${item.date} · ${item.paymentMethod}`}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.activityAmount, isExpense ? styles.expenseAmount : styles.incomeAmount]}>
                  {`${isExpense ? '-' : '+'}${formatMoney(Math.abs(amount), preferredCurrency)}`}
                </Text>
                <Text style={[styles.tagText, hasAlert ? styles.alertTag : null]}>
                  {hasAlert ? 'ANOMALY' : item.type.toUpperCase()}
                </Text>
              </View>
            </Pressable>
          );
        })}

        <View style={styles.bottomNav}>
          <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="grid-outline" size={14} color="#7f909d" />
            <Text style={styles.bottomNavLabel}>DASHBOARD</Text>
          </Pressable>
          <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Transactions')}>
            <Ionicons name="receipt-outline" size={14} color="#14dff8" />
            <Text style={[styles.bottomNavLabel, { color: '#c6f9ff' }]}>TRANSACTIONS</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050914' },
  content: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 16 },
  bgGlowLeft: {
    position: 'absolute', left: -110, top: 90, width: 240, height: 420, borderRadius: 200,
    backgroundColor: 'rgba(14, 201, 233, 0.1)',
  },
  bgGlowBottom: {
    position: 'absolute', right: -90, bottom: -120, width: 220, height: 220, borderRadius: 200,
    backgroundColor: 'rgba(50, 42, 255, 0.1)',
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.18)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(12, 19, 33, 0.78)',
  },
  iconButton: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: {
    position: 'absolute', top: -4, right: -5, minWidth: 14, height: 14, borderRadius: 7,
    backgroundColor: '#14dff8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  badgeText: { fontSize: 9, color: '#032432', fontWeight: '700' },
  headerTitle: { color: '#15def8', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  avatarButton: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(24, 34, 50, 0.9)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#c7d5df', fontSize: 12, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)',
    borderRadius: 12, minHeight: 40, paddingHorizontal: 10, backgroundColor: 'rgba(17, 25, 39, 0.82)',
  },
  searchInput: { flex: 1, color: '#d5dfe7', fontSize: 14, paddingVertical: 0 },
  typeRow: {
    marginTop: 10, flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.18)',
    borderRadius: 12, padding: 4, backgroundColor: 'rgba(12, 20, 34, 0.85)',
  },
  typeBtn: { flex: 1, minHeight: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  typeBtnActive: { backgroundColor: '#1bdcf7' },
  typeText: { color: '#8293a0', fontSize: 18, fontWeight: '600' },
  typeTextActive: { color: '#00343f', fontWeight: '800' },
  chipsScroll: { marginTop: 10, maxHeight: 44 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingRight: 10 },
  chip: {
    borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.18)', borderRadius: 12, minHeight: 34,
    paddingHorizontal: 10, justifyContent: 'center', backgroundColor: 'rgba(17, 25, 39, 0.82)',
  },
  chipActive: { borderColor: '#12dff8', backgroundColor: 'rgba(7, 47, 62, 0.52)' },
  chipContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { color: '#9aaab6', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#cbf8ff' },
  summaryCard: {
    marginTop: 10, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.24)', borderRadius: 14,
    padding: 12, backgroundColor: 'rgba(28, 36, 48, 0.85)',
  },
  summaryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: '#91a1ad', fontSize: 18, fontWeight: '600', letterSpacing: 0.8 },
  summaryAmount: { marginTop: 8, color: '#14e0f9', fontSize: 20, fontWeight: '800' },
  statusPill: {
    marginTop: 8, alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(175, 77, 85, 0.28)',
    backgroundColor: 'rgba(68, 23, 28, 0.6)', paddingHorizontal: 8, paddingVertical: 3,
  },
  statusText: { color: '#e39fa5', fontSize: 14, fontWeight: '600' },
  quickRow: { marginTop: 10, marginBottom: 10, flexDirection: 'row', gap: '10px'},
  quickBtn: {
    width: 72, height: 52, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.18)',
    backgroundColor: 'rgba(17, 25, 39, 0.8)', alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  quickText: { color: '#95a6b3', fontSize: 10, fontWeight: '700' },
  recentHeader: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#dbe3ea', fontSize: 18, fontWeight: '700' },
  dateWindow: { color: '#8a99a5', fontSize: 14, fontWeight: '600' },
  dateFiltersRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  dateInput: {
    flex: 1, minHeight: 34, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)', borderRadius: 10,
    backgroundColor: 'rgba(17, 25, 39, 0.82)', color: '#d5dfe7', fontSize: 14, paddingHorizontal: 10, paddingVertical: 0,
  },
  applyBtn: {
    minWidth: 62, minHeight: 34, borderRadius: 10, backgroundColor: '#1bdcf7',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
  },
  applyBtnText: { color: '#00343f', fontSize: 14, fontWeight: '800' },
  helperText: { color: '#8a99a5', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  errorText: { color: '#ff8089', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.18)',
    borderRadius: 12, backgroundColor: 'rgba(17, 25, 39, 0.8)', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
  },
  activityIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(57, 71, 87, 0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  activityTitle: { color: '#d4dee6', fontSize: 18, fontWeight: '600' },
  activityMeta: { color: '#8596a2', fontSize: 14, fontWeight: '500' },
  activityAmount: { fontSize: 18, fontWeight: '700' },
  expenseAmount: { color: '#d7e1e8' },
  incomeAmount: { color: '#14dff8' },
  tagText: { marginTop: 2, color: '#8997a3', fontSize: 14, fontWeight: '600' },
  alertTag: { color: '#e8a5a8' },
  bottomNav: {
    marginTop: 8, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(12, 20, 34, 0.9)', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between',
  },
  bottomNavItem: { flex: 1, alignItems: 'center', gap: 2 },
  bottomNavLabel: { color: '#778997', fontSize: 9, fontWeight: '700' },
});
