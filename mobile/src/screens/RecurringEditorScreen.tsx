import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { recurringApi } from '../lib/recurringApi';
import { transactionsApi } from '../lib/transactionsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { Category } from '../types/transaction';
import type { RecurringFrequency } from '../types/recurring';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'RecurringEditor'>;

export const RecurringEditorScreen = ({ route, navigation }: Props) => {
  const { token } = useAuth();
  const existing = route.params?.rule;
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '');
  const [frequency, setFrequency] = useState<RecurringFrequency>(existing?.frequency ?? 'monthly');
  const [customDays, setCustomDays] = useState(existing?.customDays ? String(existing.customDays) : '30');
  const [startDate, setStartDate] = useState(existing?.startDate ?? new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const data = await transactionsApi.listCategories(token, 'expense');
      setCategories(data);
      if (!existing && data.length > 0 && !categoryId) setCategoryId(data[0].id);
    };
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'));
  }, [token, existing, categoryId]);

  const onSave = async () => {
    if (!token) return;
    try {
      setError('');
      const payload = {
        amount: Number(amount),
        categoryId,
        frequency,
        ...(frequency === 'custom' ? { customDays: Number(customDays) } : {}),
        startDate,
      };
      if (existing) await recurringApi.update(token, existing.id, payload);
      else await recurringApi.create(token, payload);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recurring rule');
    }
  };

  const onDelete = async () => {
    if (!token || !existing) return;
    await recurringApi.remove(token, existing.id);
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount"
          keyboardType="decimal-pad"
          placeholderTextColor={theme.colors.text.muted}
          style={{
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
          value={startDate}
          onChangeText={setStartDate}
          placeholder="Start date (YYYY-MM-DD)"
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

        <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
          {(['weekly', 'monthly', 'custom'] as const).map((freq) => (
            <Pressable
              key={freq}
              onPress={() => setFrequency(freq)}
              style={{
                backgroundColor: frequency === freq ? theme.colors.brand.primary : theme.colors.background.surface,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing[3],
                paddingVertical: theme.spacing[2],
              }}
            >
              <Text style={{ color: frequency === freq ? theme.colors.text.inverse : theme.colors.text.primary }}>
                {freq}
              </Text>
            </Pressable>
          ))}
        </View>

        {frequency === 'custom' ? (
          <TextInput
            value={customDays}
            onChangeText={setCustomDays}
            placeholder="Custom days interval"
            keyboardType="number-pad"
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: theme.spacing[2] }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                style={{
                  borderWidth: 1,
                  borderColor: categoryId === category.id ? theme.colors.brand.primary : category.color,
                  borderRadius: theme.radius.pill,
                  paddingVertical: theme.spacing[2],
                  paddingHorizontal: theme.spacing[3],
                  backgroundColor: theme.colors.background.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[1],
                }}
              >
                <CategoryIcon icon={category.icon} color={category.color} />
                <Text style={{ color: theme.colors.text.primary }}>{category.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
        <ActionButton label={existing ? 'Save Rule' : 'Create Rule'} onPress={onSave} />
        {existing ? <ActionButton label="Delete Rule" onPress={onDelete} variant="secondary" /> : null}
      </ScrollView>
    </Screen>
  );
};

