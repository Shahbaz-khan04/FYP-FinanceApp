import { Ionicons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { getPreferredCurrency } from '../lib/currency';
import { offlineTransactions } from '../lib/offlineTransactions';
import { transactionsApi } from '../lib/transactionsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Category, TransactionType } from '../types/transaction';
import { Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionDetail'>;

export const TransactionDetailScreen = ({ route, navigation }: Props) => {
  const { token, user } = useAuth();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const netInfo = useNetInfo();
  const isOnline = Boolean(netInfo.isConnected);
  const { transaction } = route.params;

  const [amount, setAmount] = useState(String(transaction.amount));
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [date, setDate] = useState(transaction.date);
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod);
  const [notes, setNotes] = useState(transaction.notes ?? '');
  const [tags, setTags] = useState(transaction.tags.join(', '));
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>(transaction.categoryId ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const data = await transactionsApi.listCategories(token, type);
      setCategories(data);
    };
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'));
  }, [token, type]);

  const onSave = async () => {
    if (!token) return;
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) return setError('Enter a valid amount greater than 0');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Use date format YYYY-MM-DD');
    if (!paymentMethod.trim()) return setError('Payment method is required');

    try {
      setIsSaving(true);
      setError('');
      const payload = {
        amount: amountValue,
        type,
        categoryId: categoryId || null,
        date,
        currency: preferredCurrency,
        paymentMethod,
        notes: notes || null,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      };
      const categoryName = categories.find((c) => c.id === payload.categoryId)?.name ?? null;
      await offlineTransactions.updateLocal(transaction.id, payload, categoryName);
      if (isOnline) await offlineTransactions.sync(token);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async () => {
    if (!token) return;
    try {
      setError('');
      await offlineTransactions.deleteLocal(transaction.id);
      if (isOnline) await offlineTransactions.sync(token);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={16} color="#c6d5df" />
          </Pressable>
          <Text style={styles.headerTitle}>MoneyLens</Text>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={16} color="#c6d5df" />
          </Pressable>
        </View>

        <View style={styles.heroWrap}>
          <Text style={styles.statusPill}>CONFIRMED</Text>
          <Text style={styles.heroAmount}>{`${type === 'expense' ? '-' : '+'}${preferredCurrency} ${amount || '0.00'}`}</Text>
          <Text style={styles.heroTitle}>{notes || transaction.categoryName || 'Transaction'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 42, marginBottom: 8 }}>
            <View style={styles.chipsRow}>
              <Pressable onPress={() => setCategoryId('')} style={[styles.chip, !categoryId && styles.chipActive]}>
                <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>No Category</Text>
              </Pressable>
              {categories.map((category) => (
                <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.chip, categoryId === category.id && styles.chipActive]}>
                  <View style={styles.chipInner}>
                    <CategoryIcon icon={category.icon} color={categoryId === category.id ? '#17dff8' : '#95a6b2'} />
                    <Text style={[styles.chipText, categoryId === category.id && styles.chipTextActive]}>{category.name}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={styles.typeRow}>
            <Pressable onPress={() => setType('expense')} style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}>
              <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
            </Pressable>
            <Pressable onPress={() => setType('income')} style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}>
              <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
            </Pressable>
          </View>

          <View style={styles.gridRow}>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Amount" placeholderTextColor="#70808c" style={styles.input} />
            <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#70808c" style={styles.input} />
          </View>

          <TextInput value={paymentMethod} onChangeText={setPaymentMethod} placeholder="Payment method" placeholderTextColor="#70808c" style={styles.fullInput} />
          <TextInput value={notes} onChangeText={setNotes} placeholder="Transaction note" placeholderTextColor="#70808c" style={styles.fullInput} />
          <TextInput value={tags} onChangeText={setTags} placeholder="Tags (comma separated)" placeholderTextColor="#70808c" style={styles.fullInput} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={onSave} disabled={isSaving} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>{isSaving ? 'Saving...' : 'Edit Transaction'}</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={14} color="#d79f9f" />
          <Text style={styles.deleteText}>Delete Transaction</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 8 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(154,170,184,0.2)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(12, 19, 33, 0.78)',
  },
  iconBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#dbe3ea', fontSize: 20, fontWeight: '800' },
  heroWrap: { alignItems: 'center', marginBottom: 10 },
  statusPill: {
    borderWidth: 1, borderColor: 'rgba(154,170,184,0.26)', borderRadius: 10,
    minHeight: 26, paddingHorizontal: 10, textAlignVertical: 'center', color: '#c7d4de',
    fontSize: 14, fontWeight: '700',
  },
  heroAmount: { marginTop: 8, color: '#14e0f9', fontSize: 20, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: '#dbe3ea', fontSize: 18, fontWeight: '700' },
  card: {
    borderWidth: 1, borderColor: 'rgba(154,170,184,0.24)', borderRadius: 12,
    backgroundColor: 'rgba(17,25,39,0.82)', padding: 10, marginBottom: 10,
  },
  label: { color: '#95a7b3', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  chip: {
    minHeight: 34, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(154,170,184,0.2)',
    backgroundColor: 'rgba(17,25,39,0.82)', paddingHorizontal: 10, justifyContent: 'center',
  },
  chipActive: { borderColor: '#12dff8', backgroundColor: 'rgba(7, 47, 62, 0.52)' },
  chipInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { color: '#9aaab6', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#cbf8ff' },
  typeRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(154,170,184,0.18)', borderRadius: 12,
    padding: 4, backgroundColor: 'rgba(12, 20, 34, 0.85)', marginBottom: 8,
  },
  typeBtn: { flex: 1, minHeight: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  typeBtnActive: { backgroundColor: '#1bdcf7' },
  typeText: { color: '#8293a0', fontSize: 14, fontWeight: '600' },
  typeTextActive: { color: '#00343f', fontWeight: '800' },
  gridRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1, minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(154,170,184,0.2)',
    backgroundColor: 'rgba(17,25,39,0.82)', color: '#d5dfe7', fontSize: 14, paddingHorizontal: 10, paddingVertical: 0,
  },
  fullInput: {
    minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(154,170,184,0.2)',
    backgroundColor: 'rgba(17,25,39,0.82)', color: '#d5dfe7', fontSize: 14, paddingHorizontal: 10, paddingVertical: 0,
    marginBottom: 8,
  },
  primaryBtn: {
    minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#49d6e7',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5, 12, 24, 0.86)',
  },
  primaryBtnText: { color: '#d9f8ff', fontSize: 18, fontWeight: '700' },
  deleteBtn: {
    marginTop: 8, minHeight: 36, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  deleteText: { color: '#d79f9f', fontSize: 18, fontWeight: '600' },
  error: { color: '#ff8089', fontSize: 14, fontWeight: '600', marginBottom: 8 },
});
