import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { transactionsApi } from '../lib/transactionsApi';
import { theme } from '../theme';
import type { Category, TransactionType } from '../types/transaction';
import { ActionButton, Screen } from './common';

const iconOptions = [
  'circle',
  'wallet',
  'briefcase',
  'chart',
  'trending-up',
  'gift',
  'utensils',
  'car',
  'home',
  'receipt',
  'shopping-bag',
  'heart',
  'film',
  'building',
];
const colorOptions = [
  '#4ADE80',
  '#34D399',
  '#22C55E',
  '#16A34A',
  '#10B981',
  '#84CC16',
  '#F97316',
  '#F59E0B',
  '#EF4444',
  '#FB7185',
  '#EC4899',
  '#8B5CF6',
  '#3B82F6',
  '#94A3B8',
];

export const CategoriesScreen = () => {
  const { token } = useAuth();
  const [type, setType] = useState<TransactionType>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('circle');
  const [color, setColor] = useState('#94A3B8');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      const data = await transactionsApi.listCategories(token, type);
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    }
  }, [token, type]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onCreate = async () => {
    if (!token || !name.trim()) return;
    try {
      setError('');
      await transactionsApi.createCategory(token, {
        name: name.trim(),
        type,
        icon,
        color,
      });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const onDelete = async (category: Category) => {
    if (!token || category.is_default) return;
    try {
      setError('');
      await transactionsApi.deleteCategory(token, category.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  return (
    <Screen>
      <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>
        Categories
      </Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
        <Pressable
          onPress={() => setType('income')}
          style={{
            backgroundColor:
              type === 'income' ? theme.colors.brand.primary : theme.colors.background.surface,
            paddingVertical: theme.spacing[2],
            paddingHorizontal: theme.spacing[3],
            borderRadius: theme.radius.md,
          }}
        >
          <Text style={{ color: type === 'income' ? theme.colors.text.inverse : theme.colors.text.primary }}>
            Income
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType('expense')}
          style={{
            backgroundColor:
              type === 'expense' ? theme.colors.brand.tertiary : theme.colors.background.surface,
            paddingVertical: theme.spacing[2],
            paddingHorizontal: theme.spacing[3],
            borderRadius: theme.radius.md,
          }}
        >
          <Text style={{ color: theme.colors.text.inverse }}>Expense</Text>
        </Pressable>
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={`New ${type} category`}
        placeholderTextColor={theme.colors.text.muted}
        style={{
          marginTop: theme.spacing[3],
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
          {iconOptions.map((item) => (
            <Pressable
              key={item}
              onPress={() => setIcon(item)}
              style={{
                borderWidth: 1,
                borderColor: icon === item ? theme.colors.brand.primary : theme.colors.border.subtle,
                backgroundColor: theme.colors.background.surface,
                borderRadius: theme.radius.pill,
                paddingVertical: theme.spacing[2],
                paddingHorizontal: theme.spacing[3],
              }}
            >
              <CategoryIcon icon={item} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: theme.spacing[2] }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
          {colorOptions.map((item) => (
            <Pressable
              key={item}
              onPress={() => setColor(item)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: item,
                borderWidth: color === item ? 2 : 1,
                borderColor: color === item ? theme.colors.text.primary : theme.colors.border.subtle,
              }}
            />
          ))}
        </View>
      </ScrollView>

      <ActionButton label="Create Category" onPress={onCreate} />
      {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}

      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {categories.map((category) => (
          <View
            key={category.id}
            style={{
              borderWidth: 1,
              borderColor: category.color,
              backgroundColor: theme.colors.background.surface,
              borderRadius: theme.radius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
              <CategoryIcon icon={category.icon} color={category.color} />
              <Text style={{ ...theme.typography.body, color: theme.colors.text.primary }}>
                {category.name}
              </Text>
              {category.is_default ? (
                <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted }}>Default</Text>
              ) : null}
            </View>
            {!category.is_default ? (
              <Pressable onPress={() => onDelete(category)}>
                <Text style={{ color: theme.colors.state.danger }}>Delete</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};

