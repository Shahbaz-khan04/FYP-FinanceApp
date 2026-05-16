import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { budgetApi } from '../lib/budgetApi';
import { formatMoney, getPreferredCurrency } from '../lib/currency';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { BudgetItem, BudgetMethodology } from '../types/budget';
import { ActionButton, EmptyState, Screen } from './common';

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
  const [methodology, setMethodology] = useState<BudgetMethodology>('envelope');
  const [totalIncome, setTotalIncome] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const totals = useMemo(() => {
    const planned = items.reduce((sum, item) => sum + item.plannedAmount, 0);
    const actual = items.reduce((sum, item) => sum + item.actualAmount, 0);
    return { planned, actual, remaining: planned - actual };
  }, [items]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      const result = await budgetApi.list(token, month);
      setItems(result.items);
      setMethodology(result.plan.methodology);
      setTotalIncome(result.plan.totalIncome === null ? '' : String(result.plan.totalIncome));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  }, [token, month]);

  const savePlan = async () => {
    if (!token) return;
    try {
      setError('');
      await budgetApi.savePlan(token, {
        month,
        methodology,
        ...(methodology !== 'envelope'
          ? { totalIncome: totalIncome.trim() ? Number(totalIncome) : null }
          : { totalIncome: null }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget plan');
    }
  };

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

      <View
        style={{
          marginTop: theme.spacing[2],
          backgroundColor: theme.colors.background.surface,
          borderRadius: theme.radius.md,
          padding: theme.spacing[3],
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <Text style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing[2] }}>
          Methodology for {month}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], flexWrap: 'wrap' }}>
          {(['envelope', 'percentage', 'zero_based'] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setMethodology(mode)}
              style={{
                paddingVertical: theme.spacing[2],
                paddingHorizontal: theme.spacing[3],
                borderRadius: theme.radius.pill,
                backgroundColor:
                  methodology === mode ? theme.colors.brand.primary : theme.colors.background.surfaceRaised,
              }}
            >
              <Text style={{ color: methodology === mode ? theme.colors.text.inverse : theme.colors.text.primary }}>
                {mode === 'zero_based' ? 'Zero-Based' : mode[0].toUpperCase() + mode.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        {methodology !== 'envelope' ? (
          <TextInput
            value={totalIncome}
            onChangeText={setTotalIncome}
            placeholder="Monthly total income"
            keyboardType="decimal-pad"
            placeholderTextColor={theme.colors.text.muted}
            style={{
              marginTop: theme.spacing[2],
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.background.surface,
            }}
          />
        ) : null}
        <ActionButton label="Save Methodology" onPress={savePlan} />
      </View>

      <ActionButton label="Create Budget" onPress={() => navigation.navigate('BudgetEditor', { month })} />

      {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}

      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {isLoading ? <Text style={{ color: theme.colors.text.secondary }}>Loading budgets...</Text> : null}
        {!isLoading && items.length === 0 ? (
          <EmptyState title="No budgets for this month" subtitle="Create a budget to start tracking planned vs actual spend." />
        ) : null}
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
