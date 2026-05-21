import { Ionicons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { getPreferredCurrency } from '../lib/currency';
import { offlineTransactions } from '../lib/offlineTransactions';
import { transactionsApi } from '../lib/transactionsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Category, TransactionType } from '../types/transaction';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

const today = () => new Date().toISOString().slice(0, 10);

const currencyLabel = (code: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) ?? code;
  } catch {
    return code;
  }
};

export const AddTransactionScreen = ({ navigation }: Props) => {
  const { token, user } = useAuth();
  const preferredCurrency = getPreferredCurrency(user?.settings);
  const netInfo = useNetInfo();
  const isOnline = Boolean(netInfo.isConnected);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const data = await transactionsApi.listCategories(token, type);
      setCategories(data);
      if (data.length > 0) setCategoryId((prev) => prev || data[0].id);
      else setCategoryId('');
    };
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'));
  }, [token, type]);

  const onSave = async () => {
    if (!token) return;
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError('Enter a valid amount greater than 0');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Use date format YYYY-MM-DD');
      return;
    }
    if (!paymentMethod.trim()) {
      setError('Payment method is required');
      return;
    }
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
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const categoryName = categories.find((c) => c.id === payload.categoryId)?.name ?? null;
      await offlineTransactions.createLocal(payload, categoryName);
      if (isOnline) await offlineTransactions.sync(token);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgGlowLeft} pointerEvents="none" />
      <View style={styles.bgGlowBottom} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={16} color="#9aabb8" />
          </Pressable>
          <Text style={styles.headerTitle}>MoneyLens</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.caption}>ENTER AMOUNT</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountText}>{`${preferredCurrency} ${amount || '0.00'}`}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#6e7d89"
            style={styles.hiddenAmountInput}
          />
        </View>

        <View style={styles.typeRow}>
          <Pressable onPress={() => setType('expense')} style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}>
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
          </Pressable>
          <Pressable onPress={() => setType('income')} style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}>
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <View style={styles.categoriesRow}>
            <Pressable
              onPress={() => setCategoryId('')}
              style={[styles.categoryCard, !categoryId && styles.categoryCardActive]}
            >
              <Ionicons name="remove" size={16} color={!categoryId ? '#17dff8' : '#95a6b2'} />
              <Text style={[styles.categoryName, !categoryId && styles.categoryNameActive]}>None</Text>
            </Pressable>
            {categories.map((category) => {
              const active = categoryId === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  style={[styles.categoryCard, active && styles.categoryCardActive]}
                >
                  <CategoryIcon icon={category.icon} color={active ? '#17dff8' : '#95a6b2'} />
                  <Text style={[styles.categoryName, active && styles.categoryNameActive]}>{category.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.fieldGrid}>
          <View style={styles.gridCol}>
            <Text style={styles.sectionLabel}>Date</Text>
            <View style={styles.fieldChip}>
              <Ionicons name="calendar-outline" size={14} color="#16def8" />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#70808c"
                style={styles.fieldInput}
              />
            </View>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.sectionLabel}>Method</Text>
            <View style={styles.fieldChip}>
              <Ionicons name="card-outline" size={14} color="#16def8" />
              <TextInput
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                placeholder="Cash"
                placeholderTextColor="#70808c"
                style={styles.fieldInput}
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Currency</Text>
        <Pressable style={styles.currencyCard} onPress={() => navigation.navigate('Settings')}>
          <View style={styles.currencyCodePill}>
            <Text style={styles.currencyCodeText}>{preferredCurrency}</Text>
          </View>
          <Text style={styles.currencyLabel}>{currencyLabel(preferredCurrency)}</Text>
          <Ionicons name="chevron-down" size={14} color="#8ea0ad" />
        </Pressable>

        <Text style={styles.sectionLabel}>Note</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="What was this for?"
          placeholderTextColor="#70808c"
          multiline
          style={styles.noteInput}
        />

        <TextInput
          value={tags}
          onChangeText={setTags}
          placeholder="Tags (comma separated)"
          placeholderTextColor="#70808c"
          style={styles.tagsInput}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable onPress={onSave} disabled={isSaving} style={({ pressed }) => [styles.saveBtn, (pressed || isSaving) && styles.pressed]}>
          <Ionicons name="checkmark" size={16} color="#083844" />
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Transaction'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050914' },
  content: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 18 },
  bgGlowLeft: {
    position: 'absolute', left: -110, top: 90, width: 240, height: 420, borderRadius: 200,
    backgroundColor: 'rgba(14, 201, 233, 0.1)',
  },
  bgGlowBottom: {
    position: 'absolute', right: -90, bottom: -120, width: 220, height: 220, borderRadius: 200,
    backgroundColor: 'rgba(50, 42, 255, 0.1)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.24)',
    backgroundColor: 'rgba(17, 25, 39, 0.8)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#15def8', fontSize: 20, fontWeight: '800', letterSpacing: 0.4 },
  headerSpacer: { width: 32, height: 32 },
  caption: { color: '#8ea0ad', fontSize: 14, fontWeight: '600', letterSpacing: 1, textAlign: 'center', marginBottom: 8 },
  amountRow: { alignItems: 'center', marginBottom: 10 },
  amountText: { color: '#14e0f9', fontSize: 20, fontWeight: '800' },
  hiddenAmountInput: {
    marginTop: 6, width: '100%', minHeight: 34, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)', borderRadius: 10,
    backgroundColor: 'rgba(17, 25, 39, 0.82)', color: '#d5dfe7', fontSize: 14, paddingHorizontal: 10, paddingVertical: 0,
  },
  typeRow: {
    marginTop: 2, flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.18)',
    borderRadius: 12, padding: 4, backgroundColor: 'rgba(12, 20, 34, 0.85)',
  },
  typeBtn: { flex: 1, minHeight: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  typeBtnActive: { backgroundColor: '#1bdcf7' },
  typeText: { color: '#8293a0', fontSize: 14, fontWeight: '600' },
  typeTextActive: { color: '#00343f', fontWeight: '800' },
  sectionLabel: { marginTop: 12, marginBottom: 6, color: '#95a7b3', fontSize: 14, fontWeight: '600', letterSpacing: 0.6 },
  categoriesScroll: { maxHeight: 86 },
  categoriesRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  categoryCard: {
    width: 68, minHeight: 68, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(17, 25, 39, 0.82)', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  categoryCardActive: { borderColor: '#12dff8', backgroundColor: 'rgba(7, 47, 62, 0.52)' },
  categoryName: { color: '#9aaab6', fontSize: 14, fontWeight: '600' },
  categoryNameActive: { color: '#cbf8ff' },
  fieldGrid: { flexDirection: 'row', gap: 8, marginTop: 2 },
  gridCol: { flex: 1 },
  fieldChip: {
    minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(17, 25, 39, 0.82)', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  fieldInput: { flex: 1, color: '#d5dfe7', fontSize: 14, paddingVertical: 0 },
  currencyCard: {
    minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(17, 25, 39, 0.82)', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  currencyCodePill: {
    minWidth: 36, height: 28, borderRadius: 10, backgroundColor: 'rgba(86, 97, 110, 0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  currencyCodeText: { color: '#d4dee6', fontSize: 14, fontWeight: '700' },
  currencyLabel: { flex: 1, color: '#d4dee6', fontSize: 18, fontWeight: '500' },
  noteInput: {
    minHeight: 96, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(17, 25, 39, 0.82)', paddingHorizontal: 10, paddingVertical: 8, color: '#d5dfe7', fontSize: 14,
    textAlignVertical: 'top',
  },
  tagsInput: {
    marginTop: 8, minHeight: 34, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(17, 25, 39, 0.82)', paddingHorizontal: 10, color: '#d5dfe7', fontSize: 14, paddingVertical: 0,
  },
  errorText: { color: '#ff8089', fontSize: 14, fontWeight: '600', marginTop: 8 },
  saveBtn: {
    marginTop: 12, minHeight: 44, borderRadius: 12, backgroundColor: '#1bdcf7',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  saveBtnText: { color: '#083844', fontSize: 18, fontWeight: '800' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
