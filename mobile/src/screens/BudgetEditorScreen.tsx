import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { budgetApi } from '../lib/budgetApi';
import { transactionsApi } from '../lib/transactionsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { Category } from '../types/transaction';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetEditor'>;

export const BudgetEditorScreen = ({ route, navigation }: Props) => {
  const { token } = useAuth();
  const existing = route.params.budget;
  const [month, setMonth] = useState(route.params.month);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '');
  const [plannedAmount, setPlannedAmount] = useState(existing ? String(existing.plannedAmount) : '');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const data = await transactionsApi.listCategories(token, 'expense');
      setCategories(data);
      if (!existing && data.length > 0 && !categoryId) {
        setCategoryId(data[0].id);
      }
    };
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'));
  }, [token, existing, categoryId]);

  const onSave = async () => {
    if (!token) return;
    try {
      setError('');
      const payload = {
        month,
        categoryId,
        plannedAmount: Number(plannedAmount),
      };
      if (existing) await budgetApi.update(token, existing.id, payload);
      else await budgetApi.create(token, payload);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    }
  };

  const onDelete = async () => {
    if (!token || !existing) return;
    try {
      setError('');
      await budgetApi.remove(token, existing.id);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete budget');
    }
  };

  return (
    <Screen>
      <ScrollView>
        <TextInput
          value={month}
          onChangeText={setMonth}
          placeholder="Month (YYYY-MM)"
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
          value={plannedAmount}
          onChangeText={setPlannedAmount}
          placeholder="Planned amount"
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
        <ActionButton label={existing ? 'Save Changes' : 'Create Budget'} onPress={onSave} />
        {existing ? <ActionButton label="Delete Budget" onPress={onDelete} variant="secondary" /> : null}
      </ScrollView>
    </Screen>
  );
};

