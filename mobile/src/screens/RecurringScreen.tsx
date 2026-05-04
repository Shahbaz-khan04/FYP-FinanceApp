import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { formatMoney, getPreferredCurrency } from '../lib/currency';
import { recurringApi } from '../lib/recurringApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { RecurringRule } from '../types/recurring';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Recurring'>;

export const RecurringScreen = ({ navigation }: Props) => {
  const { token, user } = useAuth();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [error, setError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      setRules(await recurringApi.list(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recurring rules');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const togglePause = async (rule: RecurringRule) => {
    if (!token) return;
    await recurringApi.update(token, rule.id, { isPaused: !rule.isPaused });
    await load();
  };

  const runDueNow = async () => {
    if (!token) return;
    try {
      const result = await recurringApi.processMine(token);
      setSyncMessage(`Created ${result.createdTransactions} transaction(s) from ${result.processedRules} rule(s)`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process due rules');
    }
  };

  return (
    <Screen>
      <ActionButton label="Create Recurring Rule" onPress={() => navigation.navigate('RecurringEditor')} />
      <ActionButton label="Run Due Now" onPress={runDueNow} variant="secondary" />
      {syncMessage ? <Text style={{ color: theme.colors.state.success, marginTop: theme.spacing[2] }}>{syncMessage}</Text> : null}
      {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}

      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {rules.map((rule) => (
          <View
            key={rule.id}
            style={{
              backgroundColor: theme.colors.background.surface,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: rule.isPaused ? theme.colors.border.subtle : theme.colors.brand.primary,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                <CategoryIcon icon={rule.categoryIcon} color={rule.categoryColor} />
                <Text style={{ color: theme.colors.text.primary }}>{rule.categoryName}</Text>
              </View>
              <Text style={{ color: theme.colors.text.secondary }}>{formatMoney(rule.amount, preferredCurrency)}</Text>
            </View>
            <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              {rule.frequency === 'custom' ? `Every ${rule.customDays} day(s)` : rule.frequency}
            </Text>
            <Text style={{ color: theme.colors.text.muted }}>
              Next run: {rule.nextRunDate} {rule.isPaused ? '• Paused' : ''}
            </Text>

            <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
              <Pressable
                onPress={() => navigation.navigate('RecurringEditor', { rule })}
                style={{ paddingVertical: theme.spacing[2], paddingHorizontal: theme.spacing[3], backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.md }}
              >
                <Text style={{ color: theme.colors.text.primary }}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => togglePause(rule)}
                style={{ paddingVertical: theme.spacing[2], paddingHorizontal: theme.spacing[3], backgroundColor: theme.colors.background.surfaceRaised, borderRadius: theme.radius.md }}
              >
                <Text style={{ color: theme.colors.text.primary }}>{rule.isPaused ? 'Resume' : 'Pause'}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};
