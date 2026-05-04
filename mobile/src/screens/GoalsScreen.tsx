import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { formatMoney, getPreferredCurrency } from '../lib/currency';
import { goalApi } from '../lib/goalApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { GoalItem } from '../types/goal';
import { ActionButton, EmptyState, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Goals'>;

export const GoalsScreen = ({ navigation }: Props) => {
  const { token, user } = useAuth();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      setGoals(await goalApi.list(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <ActionButton label="Create Goal" onPress={() => navigation.navigate('GoalEditor')} />
      {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}

      <ScrollView style={{ marginTop: theme.spacing[2] }}>
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
