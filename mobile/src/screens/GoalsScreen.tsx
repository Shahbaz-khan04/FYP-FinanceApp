import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { formatMoney, getPreferredCurrency } from '../lib/currency';
import { goalApi } from '../lib/goalApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { GoalItem, GoalPrioritySummary } from '../types/goal';
import { ActionButton, EmptyState, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Goals'>;

export const GoalsScreen = ({ navigation }: Props) => {
  const { token, user } = useAuth();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [prioritySummary, setPrioritySummary] = useState<GoalPrioritySummary | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      const [goalItems, priorities] = await Promise.all([goalApi.list(token), goalApi.priorities(token)]);
      setGoals(goalItems);
      setPrioritySummary(priorities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const priorityColor = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return theme.colors.state.danger;
    if (priority === 'medium') return theme.colors.state.warning;
    return theme.colors.state.success;
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <ActionButton label="Create Goal" onPress={() => navigation.navigate('GoalEditor')} />
      <ActionButton label="Refresh Priorities" onPress={load} variant="secondary" />
      {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}

      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {prioritySummary?.focusGoal ? (
          <View
            style={{
              backgroundColor: theme.colors.background.surface,
              borderWidth: 1,
              borderColor: priorityColor(prioritySummary.focusGoal.priority),
              borderRadius: theme.radius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}
          >
            <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted }}>Focus Goal</Text>
            <Text style={{ ...theme.typography.label, color: theme.colors.text.primary, marginTop: theme.spacing[1] }}>
              #{prioritySummary.focusGoal.rank} {prioritySummary.focusGoal.title}
            </Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              Reason: {prioritySummary.focusGoal.reason}
            </Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary }}>
              Suggested monthly contribution: {formatMoney(prioritySummary.focusGoal.suggestedMonthlyContribution, preferredCurrency)}
            </Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.muted }}>
              Deadline {prioritySummary.focusGoal.deadline} • {prioritySummary.focusGoal.daysRemaining} day(s) remaining
            </Text>
            <ActionButton
              label="Open Focus Goal"
              onPress={() => {
                const goal = goals.find((g) => g.id === prioritySummary.focusGoal?.goalId);
                if (goal) navigation.navigate('GoalDetail', { goal });
              }}
              variant="secondary"
            />
          </View>
        ) : null}

        {prioritySummary && prioritySummary.goals.length > 0 ? (
          <View
            style={{
              backgroundColor: theme.colors.background.surface,
              borderRadius: theme.radius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          >
            <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>Priority Ranking</Text>
            {prioritySummary.goals.slice(0, 5).map((item) => (
              <Pressable
                key={item.goalId}
                onPress={() => {
                  const goal = goals.find((g) => g.id === item.goalId);
                  if (goal) navigation.navigate('GoalDetail', { goal });
                }}
                style={{
                  marginTop: theme.spacing[2],
                  padding: theme.spacing[2],
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.background.surfaceRaised,
                  borderWidth: 1,
                  borderColor: priorityColor(item.priority),
                }}
              >
                <Text style={{ color: theme.colors.text.primary }}>
                  #{item.rank} {item.title}
                </Text>
                <Text style={{ ...theme.typography.caption, color: theme.colors.text.secondary }}>
                  {item.priority.toUpperCase()} • Score {item.priorityScore.toFixed(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {isLoading ? <Text style={{ color: theme.colors.text.secondary }}>Loading goals...</Text> : null}
        {!isLoading && goals.length === 0 ? (
          <EmptyState title="No goals yet" subtitle="Create a savings goal to track progress." />
        ) : null}
        {goals.map((goal) => (
          <Pressable
            key={goal.id}
            onPress={() => navigation.navigate('GoalDetail', { goal })}
            style={{
              backgroundColor: theme.colors.background.surface,
              borderWidth: 1,
              borderColor: goal.isCompleted ? theme.colors.state.success : theme.colors.border.subtle,
              borderRadius: theme.radius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>{goal.title}</Text>
              <Text style={{ color: goal.isCompleted ? theme.colors.state.success : theme.colors.text.secondary }}>
                {goal.progressPercent.toFixed(0)}%
              </Text>
            </View>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              Saved {formatMoney(goal.savedAmount, preferredCurrency)} / {formatMoney(goal.targetAmount, preferredCurrency)}
            </Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.muted }}>
              Remaining {formatMoney(goal.remainingAmount, preferredCurrency)} • Deadline {goal.deadline}
            </Text>
            <View style={{ height: 8, borderRadius: theme.radius.pill, backgroundColor: theme.colors.background.surfaceRaised, marginTop: theme.spacing[2] }}>
              <View
                style={{
                  width: `${goal.progressPercent}%`,
                  height: 8,
                  borderRadius: theme.radius.pill,
                  backgroundColor: goal.isCompleted ? theme.colors.state.success : theme.colors.brand.primary,
                }}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
};
