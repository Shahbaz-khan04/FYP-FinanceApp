import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { budgetApi } from '../lib/budgetApi';
import { formatMoney, getPreferredCurrency } from '../lib/currency';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { BudgetItem } from '../types/budget';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Budgets'>;

const currentMonth = () => new Date().toISOString().slice(0, 7);
const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};

export const BudgetsScreen = ({ navigation }: Props) => {
  const { token, user } = useAuth();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [error, setError] = useState('');

  const totals = useMemo(() => {
    const planned = items.reduce((sum, item) => sum + item.plannedAmount, 0);
    const actual = items.reduce((sum, item) => sum + item.actualAmount, 0);
    return { planned, actual, remaining: planned - actual };
  }, [items]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      setItems(await budgetApi.list(token, month));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    }
  }, [token, month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => setMonth((prev) => shiftMonth(prev, -1))}>
          <Text style={{ color: theme.colors.brand.primary }}>{'< Prev'}</Text>
        </Pressable>
        <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>{month}</Text>
        <Pressable onPress={() => setMonth((prev) => shiftMonth(prev, 1))}>
          <Text style={{ color: theme.colors.brand.primary }}>{'Next >'}</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: theme.spacing[2], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
        <Text style={{ color: theme.colors.text.secondary }}>
          Planned: {formatMoney(totals.planned, preferredCurrency)} • Spent: {formatMoney(totals.actual, preferredCurrency)} • Remaining: {formatMoney(totals.remaining, preferredCurrency)}
        </Text>
      </View>

      <ActionButton label="Create Budget" onPress={() => navigation.navigate('BudgetEditor', { month })} />

      {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}

      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => navigation.navigate('BudgetEditor', { month, budget: item })}
            style={{
              backgroundColor: theme.colors.background.surface,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: item.overBudget ? theme.colors.state.danger : item.nearLimit ? theme.colors.brand.tertiary : theme.colors.border.subtle,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                <CategoryIcon icon={item.categoryIcon} color={item.categoryColor} />
                <Text style={{ color: theme.colors.text.primary }}>{item.categoryName}</Text>
              </View>
              <Text style={{ color: theme.colors.text.secondary }}>{item.percentUsed.toFixed(0)}%</Text>
            </View>
            <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              Planned {formatMoney(item.plannedAmount, preferredCurrency)} • Actual {formatMoney(item.actualAmount, preferredCurrency)} • Remaining {formatMoney(item.remainingAmount, preferredCurrency)}
            </Text>
            <View style={{ height: 8, borderRadius: theme.radius.pill, backgroundColor: theme.colors.background.surfaceRaised, marginTop: theme.spacing[2] }}>
              <View
                style={{
                  width: `${Math.min(item.percentUsed, 100)}%`,
                  height: 8,
                  borderRadius: theme.radius.pill,
                  backgroundColor: item.overBudget ? theme.colors.state.danger : item.nearLimit ? theme.colors.brand.tertiary : theme.colors.brand.primary,
                }}
              />
            </View>
            {item.overBudget ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[1] }}>Over budget</Text> : null}
            {!item.overBudget && item.nearLimit ? <Text style={{ color: theme.colors.brand.tertiary, marginTop: theme.spacing[1] }}>Near limit</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
};
