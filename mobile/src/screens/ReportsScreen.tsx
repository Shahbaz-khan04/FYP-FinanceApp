import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { formatMoney, getPreferredCurrency } from '../lib/currency';
import { reportApi } from '../lib/reportApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type {
  BudgetVsActualPoint,
  CategorySpendingPoint,
  GoalProgressPoint,
  IncomeExpensePoint,
  SpendingTrendPoint,
} from '../types/report';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

const defaultRange = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
};

const monthOf = (date: string) => date.slice(0, 7);

export const ReportsScreen = ({ navigation }: Props) => {
  const { token, user } = useAuth();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const [{ startDate, endDate }, setRange] = useState(defaultRange());
  const [granularity, setGranularity] = useState<'daily' | 'weekly'>('weekly');
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpensePoint[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpendingPoint[]>([]);
  const [spendingTrend, setSpendingTrend] = useState<SpendingTrendPoint[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActualPoint[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgressPoint[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      const [incomeData, categoryData, trendData, budgetData, goalData] = await Promise.all([
        reportApi.incomeExpenses(token, startDate, endDate),
        reportApi.categorySpending(token, startDate, endDate),
        reportApi.spendingTrend(token, startDate, endDate, granularity),
        reportApi.budgetVsActual(token, monthOf(endDate)),
        reportApi.goalProgress(token),
      ]);
      setIncomeExpenses(incomeData);
      setCategorySpending(categoryData);
      setSpendingTrend(trendData);
      setBudgetVsActual(budgetData);
      setGoalProgress(goalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    }
  }, [token, startDate, endDate, granularity]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const maxIncomeExpense = useMemo(
    () =>
      Math.max(
        ...incomeExpenses.flatMap((i) => [i.income, i.expenses]),
        1,
      ),
    [incomeExpenses],
  );
  const maxTrend = useMemo(() => Math.max(...spendingTrend.map((i) => i.amount), 1), [spendingTrend]);
  const maxBudget = useMemo(() => Math.max(...budgetVsActual.map((i) => Math.max(i.planned, i.actual)), 1), [budgetVsActual]);

  return (
    <Screen>
      <ScrollView>
        <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>Reports</Text>
        <View style={{ marginTop: theme.spacing[2], flexDirection: 'row', gap: theme.spacing[2] }}>
          <TextInput
            value={startDate}
            onChangeText={(value) => setRange((prev) => ({ ...prev, startDate: value }))}
            placeholder="Start YYYY-MM-DD"
            placeholderTextColor={theme.colors.text.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.background.surface,
            }}
          />
          <TextInput
            value={endDate}
            onChangeText={(value) => setRange((prev) => ({ ...prev, endDate: value }))}
            placeholder="End YYYY-MM-DD"
            placeholderTextColor={theme.colors.text.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.background.surface,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
          <Pressable
            onPress={() => setGranularity('daily')}
            style={{
              backgroundColor:
                granularity === 'daily' ? theme.colors.brand.primary : theme.colors.background.surface,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
            }}
          >
            <Text style={{ color: granularity === 'daily' ? theme.colors.text.inverse : theme.colors.text.primary }}>
              Daily
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setGranularity('weekly')}
            style={{
              backgroundColor:
                granularity === 'weekly' ? theme.colors.brand.primary : theme.colors.background.surface,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
            }}
          >
            <Text style={{ color: granularity === 'weekly' ? theme.colors.text.inverse : theme.colors.text.primary }}>
              Weekly
            </Text>
          </Pressable>
        </View>
        <ActionButton label="Apply Range" onPress={load} />

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Monthly Income vs Expenses</Text>
          {incomeExpenses.map((item) => (
            <View key={item.month} style={{ marginTop: theme.spacing[2] }}>
              <Text style={{ color: theme.colors.text.secondary }}>{item.month}</Text>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: 4 }}>
                <View style={{ width: `${(item.income / maxIncomeExpense) * 100}%`, height: 8, backgroundColor: theme.colors.state.success, borderRadius: theme.radius.pill }} />
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: 4 }}>
                <View style={{ width: `${(item.expenses / maxIncomeExpense) * 100}%`, height: 8, backgroundColor: theme.colors.state.danger, borderRadius: theme.radius.pill }} />
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Category-wise Spending</Text>
          {categorySpending.map((item) => (
            <View key={item.category} style={{ marginTop: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                  <CategoryIcon icon={item.icon} color={item.color} />
                  <Text style={{ color: theme.colors.text.secondary }}>{item.category}</Text>
                </View>
                <Text style={{ color: theme.colors.text.primary }}>{formatMoney(item.amount, preferredCurrency)}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: 4 }}>
                <View style={{ width: `${item.percent}%`, height: 8, backgroundColor: item.color, borderRadius: theme.radius.pill }} />
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Spending Trend ({granularity})</Text>
          {spendingTrend.map((item) => (
            <View key={item.period} style={{ marginTop: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.text.secondary }}>{item.period}</Text>
                <Text style={{ color: theme.colors.text.primary }}>{formatMoney(item.amount, preferredCurrency)}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: 4 }}>
                <View style={{ width: `${(item.amount / maxTrend) * 100}%`, height: 8, backgroundColor: theme.colors.brand.secondary, borderRadius: theme.radius.pill }} />
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Budget Planned vs Actual ({monthOf(endDate)})</Text>
          {budgetVsActual.map((item) => (
            <View key={item.category} style={{ marginTop: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                  <CategoryIcon icon={item.icon} color={item.color} />
                  <Text style={{ color: theme.colors.text.secondary }}>{item.category}</Text>
                </View>
                <Text style={{ color: theme.colors.text.primary }}>{item.percentUsed.toFixed(0)}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: 4 }}>
                <View style={{ width: `${(item.planned / maxBudget) * 100}%`, height: 8, backgroundColor: theme.colors.state.info, borderRadius: theme.radius.pill }} />
              </View>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: 4 }}>
                <View style={{ width: `${(item.actual / maxBudget) * 100}%`, height: 8, backgroundColor: theme.colors.state.warning, borderRadius: theme.radius.pill }} />
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing[3], backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.md, padding: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Goal Progress Report</Text>
          {goalProgress.map((goal) => (
            <View key={goal.title + goal.deadline} style={{ marginTop: theme.spacing[2] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.text.secondary }}>{goal.title}</Text>
                <Text style={{ color: goal.isCompleted ? theme.colors.state.success : theme.colors.text.primary }}>
                  {goal.progressPercent.toFixed(0)}%
                </Text>
              </View>
              <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.muted }}>
                Saved {formatMoney(goal.savedAmount, preferredCurrency)} / {formatMoney(goal.targetAmount, preferredCurrency)}
              </Text>
              <View style={{ height: 8, backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.pill, marginTop: 4 }}>
                <View style={{ width: `${goal.progressPercent}%`, height: 8, backgroundColor: goal.isCompleted ? theme.colors.state.success : theme.colors.brand.primary, borderRadius: theme.radius.pill }} />
              </View>
            </View>
          ))}
        </View>

        {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
        <ActionButton label="Back to Dashboard" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </ScrollView>
    </Screen>
  );
};
