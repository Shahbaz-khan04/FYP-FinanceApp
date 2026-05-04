import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { recommendationApi } from '../lib/recommendationApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { RecommendationItem, RecommendationSummary } from '../types/recommendation';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Recommendations'>;

const currentMonth = () => new Date().toISOString().slice(0, 7);
const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};

const priorityColor = (priority: RecommendationItem['priority']) => {
  if (priority === 'high') return theme.colors.state.danger;
  if (priority === 'medium') return theme.colors.state.warning;
  return theme.colors.state.success;
};

export const RecommendationsScreen = (_props: Props) => {
  const { token } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<RecommendationSummary | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      setSummary(await recommendationApi.get(token, month));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    }
  }, [month, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
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

        <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing[2] }}>
          Explainable recommendations based on your actual budgets, spending, income trend, and goals.
        </Text>

        {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
        <ActionButton label="Refresh" onPress={load} />

        <View style={{ marginTop: theme.spacing[2] }}>
          {(summary?.recommendations ?? []).map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: theme.colors.background.surface,
                borderWidth: 1,
                borderColor: priorityColor(item.priority),
                borderRadius: theme.radius.md,
                padding: theme.spacing[3],
                marginBottom: theme.spacing[2],
              }}
            >
              <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>{item.title}</Text>
              <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
                {item.message}
              </Text>
              <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted, marginTop: theme.spacing[2] }}>
                Reason: {item.reason}
              </Text>
              <Text style={{ ...theme.typography.caption, color: priorityColor(item.priority), marginTop: theme.spacing[1] }}>
                Priority: {item.priority.toUpperCase()}
              </Text>
            </View>
          ))}
          {summary && summary.recommendations.length === 0 ? (
            <View
              style={{
                backgroundColor: theme.colors.background.surface,
                borderRadius: theme.radius.md,
                padding: theme.spacing[3],
              }}
            >
              <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary }}>
                No strong recommendation signals for this month yet.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
};
