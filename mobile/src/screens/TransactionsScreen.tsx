import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { offlineTransactions } from '../lib/offlineTransactions';
import { transactionsApi } from '../lib/transactionsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { Category, TransactionItem, TransactionType } from '../types/transaction';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;

export const TransactionsScreen = ({ navigation }: Props) => {
  const { token } = useAuth();
  const netInfo = useNetInfo();
  const isOnline = Boolean(netInfo.isConnected);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<TransactionType | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');

  const total = useMemo(
    () => transactions.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0),
    [transactions],
  );

  const load = useCallback(async () => {
    if (!token) return;
    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
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
    if (isOnline) {
      runSync();
    } else {
      setSyncStatus('offline');
    }
  }, [isOnline, runSync]);

  return (
    <Screen>
      <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary, marginBottom: theme.spacing[2] }}>
        Transactions
      </Text>
      <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary }}>
        Net total: {total.toFixed(2)}
      </Text>
      <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.muted, marginTop: theme.spacing[1] }}>
        {isOnline ? 'Online' : 'Offline'} • Sync: {syncStatus}
      </Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search notes or payment method"
        placeholderTextColor={theme.colors.text.muted}
        style={{
          marginTop: theme.spacing[3],
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
          color: theme.colors.text.primary,
          backgroundColor: theme.colors.background.surface,
        }}
      />

      <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
        <Pressable
          onPress={() => setType(type === 'income' ? '' : 'income')}
          style={{
            backgroundColor: type === 'income' ? theme.colors.brand.primary : theme.colors.background.surface,
            paddingVertical: theme.spacing[2],
            paddingHorizontal: theme.spacing[3],
            borderRadius: theme.radius.md,
          }}
        >
          <Text style={{ color: type === 'income' ? theme.colors.text.inverse : theme.colors.text.primary }}>
            Income
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType(type === 'expense' ? '' : 'expense')}
          style={{
            backgroundColor: type === 'expense' ? theme.colors.brand.tertiary : theme.colors.background.surface,
            paddingVertical: theme.spacing[2],
            paddingHorizontal: theme.spacing[3],
            borderRadius: theme.radius.md,
          }}
        >
          <Text style={{ color: theme.colors.text.inverse }}>Expense</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: theme.spacing[2], maxHeight: 52 }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
          <Pressable
            onPress={() => setCategoryId('')}
            style={{
              backgroundColor: categoryId ? theme.colors.background.surface : theme.colors.brand.secondary,
              paddingVertical: theme.spacing[2],
              paddingHorizontal: theme.spacing[3],
              borderRadius: theme.radius.pill,
            }}
          >
            <Text style={{ color: theme.colors.text.primary }}>All Categories</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(categoryId === category.id ? '' : category.id)}
              style={{
                backgroundColor:
                  categoryId === category.id ? theme.colors.brand.secondary : theme.colors.background.surface,
                paddingVertical: theme.spacing[2],
                paddingHorizontal: theme.spacing[3],
                borderRadius: theme.radius.pill,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                <CategoryIcon icon={category.icon} color={category.color} />
                <Text style={{ color: theme.colors.text.primary }}>{category.name}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={{ marginTop: theme.spacing[2], flexDirection: 'row', gap: theme.spacing[2] }}>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="Start YYYY-MM-DD"
          placeholderTextColor={theme.colors.text.muted}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            borderRadius: theme.radius.md,
            maxWidth: 180,
            paddingHorizontal: theme.spacing[2],
            paddingVertical: theme.spacing[2],
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.background.surface,
          }}
        />
        <TextInput
          value={endDate}
          onChangeText={setEndDate}
          placeholder="End YYYY-MM-DD"
          placeholderTextColor={theme.colors.text.muted}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            borderRadius: theme.radius.md,
            maxWidth: 180,
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.background.surface,
          }}
        />
      </View>

      <ActionButton label="Apply filters" onPress={load} />
      <ActionButton label="Add transaction" onPress={() => navigation.navigate('AddTransaction')} variant="secondary" />
      <ActionButton label="Recurring Rules" onPress={() => navigation.navigate('Recurring')} variant="secondary" />
      {isOnline ? <ActionButton label="Sync Now" onPress={runSync} variant="secondary" /> : null}

      {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}

      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {transactions.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
            style={{
              backgroundColor: theme.colors.background.surface,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              borderRadius: theme.radius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}
          >
            <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>
              {item.currency} {item.amount.toFixed(2)} • {item.type}
            </Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary }}>
              {item.categoryName ?? 'Uncategorized'} • {item.date}
            </Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.muted }}>
              {item.paymentMethod} {item.notes ? `• ${item.notes}` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
};
