import { useState } from 'react';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AppText, ScreenContainer } from '../components/common';
import { NewTransactionInput, TransactionType, useTransactions } from '../context/TransactionsContext';
import { RootTabParamList } from '../navigation/AppTabs';
import { radius, shadows, spacing, typography } from '../theme';

type AddTransactionScreenProps = BottomTabScreenProps<RootTabParamList, 'AddTransaction'>;

const palette = {
  paper: '#F9FAF6',
  card: '#FFFFFF',
  panel: '#F2F4F0',
  ink: '#1A1A18',
  primary: '#003F2A',
  secondary: '#506354',
  muted: '#737A75',
  softText: '#A8AEA8',
  line: '#E1E4DE',
  gold: '#FFF1D9',
  danger: '#C51D23',
};

const categories = ['Dining & Living', 'Shopping', 'Travel', 'Transit', 'Utilities', 'Software', 'Income'];
const currencies = ['USD', 'GBP', 'EUR'];

export function AddTransactionScreen({ navigation }: AddTransactionScreenProps) {
  const { addTransaction } = useTransactions();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('October 24, 2023');
  const [category, setCategory] = useState('Dining & Living');
  const [currency, setCurrency] = useState('USD');
  const [tags, setTags] = useState(['BusinessTrip', 'ProjectVeridian']);
  const [tagDraft, setTagDraft] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const numericAmount = Number(amount.replace(/,/g, ''));
  const canSave = merchant.trim().length > 0 && numericAmount > 0;

  function handleAddTag() {
    const cleanTag = tagDraft.trim().replace(/^#/, '');

    if (!cleanTag || tags.includes(cleanTag)) {
      setTagDraft('');
      return;
    }

    setTags((current) => [...current, cleanTag]);
    setTagDraft('');
  }

  function handleSave() {
    if (!canSave) {
      return;
    }

    const input: NewTransactionInput = {
      merchant: merchant.trim(),
      category,
      date,
      currency,
      amount: numericAmount,
      type,
      tags,
      recurring,
    };
    const created = addTransaction(input);
    navigation.navigate('TransactionDetail', { transactionId: created.id });
  }

  return (
    <ScreenContainer style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="close" size={24} color={palette.primary} />
        </Pressable>
        <AppText variant="title" color={palette.primary} style={styles.title}>
          New Entry
        </AppText>
        <Pressable onPress={handleSave} disabled={!canSave}>
          <AppText variant="subtitle" color={canSave ? palette.primary : palette.softText} style={styles.saveText}>
            SAVE
          </AppText>
        </Pressable>
      </View>

      <View style={styles.typeSelector}>
        <Pressable
          style={[styles.typePill, type === 'expense' && styles.typePillActive]}
          onPress={() => setType('expense')}
        >
          <Ionicons
            name="arrow-up"
            size={15}
            color={type === 'expense' ? palette.paper : palette.primary}
          />
          <AppText variant="label" color={type === 'expense' ? palette.paper : palette.primary}>
            Expense
          </AppText>
        </Pressable>
        <Pressable
          style={[styles.typePill, type === 'income' && styles.typePillActive]}
          onPress={() => {
            setType('income');
            setCategory('Income');
          }}
        >
          <Ionicons
            name="arrow-down"
            size={15}
            color={type === 'income' ? palette.paper : palette.primary}
          />
          <AppText variant="label" color={type === 'income' ? palette.paper : palette.primary}>
            Income
          </AppText>
        </Pressable>
      </View>

      <View style={styles.amountBlock}>
        <AppText variant="caption" color={palette.muted}>
          AMOUNT TO RECORD
        </AppText>
        <View style={styles.amountRow}>
          <AppText variant="display" color={palette.ink} style={styles.currencyMark}>
            $
          </AppText>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#DFE1DE"
            style={styles.amountInput}
          />
        </View>
        <Pressable
          style={styles.currencyPill}
          onPress={() => {
            const currentIndex = currencies.indexOf(currency);
            setCurrency(currencies[(currentIndex + 1) % currencies.length]);
          }}
        >
          <AppText variant="label" color={palette.ink}>
            {currency}
          </AppText>
          <Ionicons name="chevron-down" size={14} color={palette.muted} />
        </Pressable>
      </View>

      <View style={styles.formSection}>
        <FieldLabel label="MERCHANT" />
        <View style={styles.inputShell}>
          <Ionicons name="storefront-outline" size={22} color={palette.secondary} />
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Where was this spent?"
            placeholderTextColor="#7C8190"
            style={styles.textInput}
          />
        </View>
      </View>

      <View style={styles.formSection}>
        <FieldLabel label="DATE" />
        <View style={styles.inputShell}>
          <Ionicons name="calendar-outline" size={22} color={palette.secondary} />
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="October 24, 2023"
            placeholderTextColor="#7C8190"
            style={styles.textInput}
          />
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.labelRow}>
          <FieldLabel label="CATEGORY" />
          <View style={styles.aiLabel}>
            <Ionicons name="sparkles" size={14} color={palette.primary} />
            <AppText variant="caption" color={palette.secondary}>
              AI ASSISTED
            </AppText>
          </View>
        </View>
        <Pressable style={styles.categoryCard} onPress={() => setCategoryOpen((open) => !open)}>
          <View style={styles.categoryIcon}>
            <Ionicons name={category === 'Income' ? 'arrow-down' : 'restaurant'} size={28} color={palette.paper} />
          </View>
          <View style={styles.categoryCopy}>
            <AppText variant="subtitle" color={palette.primary} style={styles.categoryTitle}>
              {category}
            </AppText>
            <AppText variant="label" color={palette.secondary}>
              {type === 'income' ? 'Classified as incoming funds.' : 'Matches recent spending habits.'}
            </AppText>
          </View>
          <Ionicons name="swap-horizontal" size={24} color="#3F2605" />
        </Pressable>

        {categoryOpen && (
          <View style={styles.categoryList}>
            {categories.map((item) => (
              <Pressable
                key={item}
                style={[styles.categoryOption, item === category && styles.categoryOptionActive]}
                onPress={() => {
                  setCategory(item);
                  setType(item === 'Income' ? 'income' : type);
                  setCategoryOpen(false);
                }}
              >
                <AppText variant="label" color={item === category ? palette.paper : palette.primary}>
                  {item}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.recurringCard}>
        <View style={styles.recurringIcon}>
          <Ionicons name="calendar-outline" size={24} color={palette.primary} />
        </View>
        <View style={styles.recurringCopy}>
          <AppText variant="subtitle" color={palette.ink} style={styles.recurringTitle}>
            Mark as recurring
          </AppText>
          <AppText variant="label" color={palette.secondary}>
            Auto-record this {type} every month
          </AppText>
        </View>
        <Switch
          value={recurring}
          onValueChange={setRecurring}
          trackColor={{ false: '#DCDDD9', true: '#BFE8CD' }}
          thumbColor={recurring ? palette.primary : palette.paper}
        />
      </View>

      <View style={styles.formSection}>
        <FieldLabel label="INTERNAL TAGS" />
        <View style={styles.tagWrap}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              style={styles.tagChip}
              onPress={() => setTags((current) => current.filter((item) => item !== tag))}
            >
              <AppText variant="label" color={palette.secondary}>
                #{tag}
              </AppText>
              <Ionicons name="close" size={15} color={palette.secondary} />
            </Pressable>
          ))}
        </View>
        <View style={styles.tagInputRow}>
          <TextInput
            value={tagDraft}
            onChangeText={setTagDraft}
            onSubmitEditing={handleAddTag}
            placeholder="New Tag"
            placeholderTextColor={palette.secondary}
            style={styles.tagInput}
          />
          <Pressable style={styles.addTagButton} onPress={handleAddTag}>
            <Ionicons name="add" size={18} color={palette.secondary} />
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.uploadBox}>
        <Ionicons name="camera-outline" size={34} color="#B8BDB8" />
        <AppText variant="label" color={palette.secondary}>
          Upload Receipt or PDF
        </AppText>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.recordButton, !canSave && styles.recordButtonDisabled, pressed && canSave && styles.pressed]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <AppText variant="subtitle" color={palette.paper} style={styles.recordText}>
          Record Transaction
        </AppText>
        <Ionicons name="arrow-forward" size={28} color={palette.paper} />
      </Pressable>
    </ScreenContainer>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <AppText variant="caption" color={palette.secondary} style={styles.fieldLabel}>
      {label}
    </AppText>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.paper,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 130,
    gap: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.bold,
  },
  saveText: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.bold,
  },
  typeSelector: {
    alignSelf: 'center',
    backgroundColor: '#EFF1ED',
    borderRadius: radius.pill,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  typePill: {
    minWidth: 112,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typePillActive: {
    backgroundColor: palette.primary,
  },
  amountBlock: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  currencyMark: {
    fontSize: 30,
    lineHeight: 38,
    marginRight: spacing.xs,
  },
  amountInput: {
    minWidth: 180,
    textAlign: 'center',
    fontFamily: typography.fontFamily.heading,
    fontSize: 66,
    lineHeight: 76,
    color: palette.primary,
    padding: 0,
  },
  currencyPill: {
    minWidth: 84,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: '#F2F4F1',
    borderWidth: 1,
    borderColor: '#E9EBE6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  formSection: {
    gap: spacing.sm,
  },
  fieldLabel: {
    letterSpacing: 1,
    fontWeight: typography.weight.bold,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inputShell: {
    minHeight: 64,
    borderRadius: radius.sm,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  textInput: {
    flex: 1,
    color: palette.ink,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: typography.fontFamily.body,
  },
  categoryCard: {
    minHeight: 126,
    borderRadius: radius.lg,
    backgroundColor: palette.gold,
    borderWidth: 1,
    borderColor: '#F9E4BE',
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  categoryTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
  },
  categoryList: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  categoryOption: {
    minHeight: 42,
    borderRadius: radius.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  categoryOptionActive: {
    backgroundColor: palette.primary,
  },
  recurringCard: {
    minHeight: 122,
    borderRadius: radius.lg,
    backgroundColor: '#F2F4F0',
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recurringIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#E4E7E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringCopy: {
    flex: 1,
  },
  recurringTitle: {
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.weight.bold,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: '#DFE1DD',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagInputRow: {
    width: 150,
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BFC8BF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.sm,
  },
  tagInput: {
    flex: 1,
    color: palette.primary,
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
  },
  addTagButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBox: {
    minHeight: 146,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CFD5CF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FAFBF8',
  },
  recordButton: {
    minHeight: 78,
    borderRadius: radius.sm,
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  recordButtonDisabled: {
    backgroundColor: '#8FA197',
    shadowOpacity: 0,
    elevation: 0,
  },
  recordText: {
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.weight.bold,
  },
  pressed: {
    opacity: 0.82,
  },
});
