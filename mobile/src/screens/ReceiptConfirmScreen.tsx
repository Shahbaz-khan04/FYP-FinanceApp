import { Ionicons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { getPreferredCurrency } from '../lib/currency';
import { receiptApi } from '../lib/receiptApi';
import { transactionsApi } from '../lib/transactionsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Category, TransactionType } from '../types/transaction';
import { Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'ReceiptConfirm'>;
const today = () => new Date().toISOString().slice(0, 10);

export const ReceiptConfirmScreen = ({ route, navigation }: Props) => {
  const { token, user } = useAuth();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const { receipt } = route.params;

  const [amount, setAmount] = useState(receipt.extractedAmount ? String(receipt.extractedAmount) : '');
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(receipt.extractedDate ?? today());
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
        currency: preferredCurrency,
        paymentMethod,
        notes: notes || null,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={16} color="#c6d5df" />
          </Pressable>
          <Text style={styles.headerTitle}>Confirm Receipt</Text>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.iconBtn}>
            <Ionicons name="person-circle-outline" size={16} color="#c6d5df" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>OCR PREVIEW</Text>
          <Text style={styles.heroAmount}>{amount ? `${preferredCurrency} ${amount}` : `${preferredCurrency} 0.00`}</Text>
          <Text style={styles.heroMerchant}>{notes || 'Merchant'}</Text>
        </View>

        <View style={styles.typeRow}>
          <Pressable onPress={() => setType('expense')} style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}>
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
          </Pressable>
          <Pressable onPress={() => setType('income')} style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}>
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
          </Pressable>
        </View>

        <View style={styles.gridRow}>
          <TextInput value={amount} onChangeText={setAmount} placeholder="Amount" placeholderTextColor="#70808c" keyboardType="decimal-pad" style={styles.input} />
          <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#70808c" style={styles.input} />
        </View>

        <TextInput value={paymentMethod} onChangeText={setPaymentMethod} placeholder="Payment method" placeholderTextColor="#70808c" style={styles.fullInput} />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 42 }}>
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

        <TextInput value={notes} onChangeText={setNotes} placeholder="Add notes" placeholderTextColor="#70808c" style={styles.fullInput} />
        <TextInput value={tags} onChangeText={setTags} placeholder="Tags (comma separated)" placeholderTextColor="#70808c" style={styles.fullInput} />

        {saving ? <Text style={styles.helper}>Saving...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={createFromReceipt} disabled={saving} style={styles.primaryBtn}>
          <Ionicons name="checkmark-done-outline" size={15} color="#063742" />
          <Text style={styles.primaryBtnText}>Confirm & Save</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ReceiptScan')} style={styles.secondaryBtn}>
          <Ionicons name="refresh-outline" size={14} color="#17dff8" />
          <Text style={styles.secondaryBtnText}>Rescan</Text>
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
  heroCard: {
    borderWidth: 1, borderColor: 'rgba(154,170,184,0.24)', borderRadius: 12,
    backgroundColor: 'rgba(17,25,39,0.82)', padding: 12, marginBottom: 10,
  },
  heroLabel: { color: '#8fa1ad', fontSize: 14, fontWeight: '600' },
  heroAmount: { color: '#14e0f9', fontSize: 20, fontWeight: '800', marginTop: 4 },
  heroMerchant: { color: '#dbe3ea', fontSize: 18, fontWeight: '700', marginTop: 2 },
  typeRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(154,170,184,0.18)', borderRadius: 12,
    padding: 4, backgroundColor: 'rgba(12, 20, 34, 0.85)', marginBottom: 10,
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
  helper: { color: '#8a99a5', fontSize: 14, marginBottom: 6 },
  error: { color: '#ff8089', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  primaryBtn: {
    minHeight: 42, borderRadius: 12, backgroundColor: '#1bdcf7',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  primaryBtnText: { color: '#063742', fontSize: 18, fontWeight: '800' },
  secondaryBtn: {
    marginTop: 8, minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: '#17dff8',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(17,25,39,0.82)',
  },
  secondaryBtnText: { color: '#17dff8', fontSize: 18, fontWeight: '700' },
});
