import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { goalApi } from '../lib/goalApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { GoalItem } from '../types/goal';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Goals'>;

export const GoalsScreen = ({ navigation }: Props) => {
  const { token } = useAuth();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      setGoals(await goalApi.list(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
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
              Saved {goal.savedAmount.toFixed(2)} / {goal.targetAmount.toFixed(2)}
            </Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.muted }}>
              Remaining {goal.remainingAmount.toFixed(2)} • Deadline {goal.deadline}
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

