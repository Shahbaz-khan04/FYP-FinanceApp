import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { receiptApi } from '../lib/receiptApi';
import { transactionsApi } from '../lib/transactionsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { Category, TransactionType } from '../types/transaction';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'ReceiptConfirm'>;

const today = () => new Date().toISOString().slice(0, 10);

export const ReceiptConfirmScreen = ({ route, navigation }: Props) => {
  const { token } = useAuth();
  const { receipt } = route.params;
  const [amount, setAmount] = useState(receipt.extractedAmount ? String(receipt.extractedAmount) : '');
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(receipt.extractedDate ?? today());
  const [currency, setCurrency] = useState('PKR');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [notes, setNotes] = useState(receipt.extractedMerchant ?? '');
  const [tags, setTags] = useState('receipt');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const data = await transactionsApi.listCategories(token, type);
      setCategories(data);
      if (data.length && !categoryId) setCategoryId(data[0].id);
    };
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'));
  }, [token, type, categoryId]);

  const createFromReceipt = async () => {
    if (!token) return;
    try {
      setSaving(true);
      setError('');
      const transaction = await transactionsApi.createTransaction(token, {
        amount: Number(amount),
        type,
        categoryId: categoryId || null,
        date,
        currency: currency.toUpperCase(),
        paymentMethod,
        notes: notes || null,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      await receiptApi.link(token, receipt.id, transaction.id);
      navigation.navigate('Transactions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create transaction from receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView>
        <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary }}>
          OCR suggestion detected from receipt. Confirm or edit before save.
        </Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount"
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
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
          <Pressable
            onPress={() => setType('income')}
            style={{
              backgroundColor: type === 'income' ? theme.colors.brand.primary : theme.colors.background.surface,
              paddingVertical: theme.spacing[2],
              paddingHorizontal: theme.spacing[3],
              borderRadius: theme.radius.md,
            }}
          >
            <Text style={{ color: type === 'income' ? theme.colors.text.inverse : theme.colors.text.primary }}>Income</Text>
          </Pressable>
          <Pressable
            onPress={() => setType('expense')}
            style={{
              backgroundColor: type === 'expense' ? theme.colors.brand.tertiary : theme.colors.background.surface,
              paddingVertical: theme.spacing[2],
              paddingHorizontal: theme.spacing[3],
              borderRadius: theme.radius.md,
            }}
          >
            <Text style={{ color: theme.colors.text.inverse }}>Expense</Text>
          </Pressable>
        </View>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="Date (YYYY-MM-DD)"
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
        <TextInput
          value={currency}
          onChangeText={setCurrency}
          placeholder="Currency"
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
        <TextInput
          value={paymentMethod}
          onChangeText={setPaymentMethod}
          placeholder="Payment method"
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
            <Pressable
              onPress={() => setCategoryId('')}
              style={{
                backgroundColor: categoryId ? theme.colors.background.surface : theme.colors.brand.secondary,
                paddingVertical: theme.spacing[2],
                paddingHorizontal: theme.spacing[3],
                borderRadius: theme.radius.pill,
              }}
            >
              <Text style={{ color: theme.colors.text.primary }}>No Category</Text>
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                style={{
                  backgroundColor:
                    categoryId === category.id ? theme.colors.brand.secondary : theme.colors.background.surface,
                  paddingVertical: theme.spacing[2],
                  paddingHorizontal: theme.spacing[3],
                  borderRadius: theme.radius.pill,
                  borderWidth: 1,
                  borderColor: category.color,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                  <CategoryIcon icon={category.icon} color={category.color} />
                  <Text style={{ color: theme.colors.text.primary }}>{category.name}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes"
          placeholderTextColor={theme.colors.text.muted}
          multiline
          style={{
            marginTop: theme.spacing[2],
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.background.surface,
            minHeight: 80,
          }}
        />
        <TextInput
          value={tags}
          onChangeText={setTags}
          placeholder="Tags (comma separated)"
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
        {saving ? <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[2] }}>Saving...</Text> : null}
        {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
        <ActionButton label="Create Transaction" onPress={createFromReceipt} />
      </ScrollView>
    </Screen>
  );
};
