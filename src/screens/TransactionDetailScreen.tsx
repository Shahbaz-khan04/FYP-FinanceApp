import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, ScreenContainer } from '../components/common';
import { useTransactions } from '../context/TransactionsContext';
import { RootTabParamList } from '../navigation/AppTabs';
import { radius, shadows, spacing, typography } from '../theme';

type TransactionDetailScreenProps = BottomTabScreenProps<RootTabParamList, 'TransactionDetail'>;

type DetailRecord = {
  id: string;
  merchant: string;
  category: string;
  date: string;
  time: string;
  amount: number;
  currency: string;
  tags: string[];
  recurring: string;
  splitStatus: string;
  notes: string;
  tax: string;
  gratuity: string;
  paymentMethod: string;
  location: string;
};

const palette = {
  paper: '#F9FAF6',
  card: '#FFFFFF',
  panel: '#F2F4F0',
  ink: '#1A1A18',
  primary: '#003F2A',
  secondary: '#506354',
  muted: '#737A75',
  softText: '#A8AEA8',
  line: '#E4E6DF',
  gold: '#FFDAA6',
  mint: '#D9EFE1',
  danger: '#C51D23',
};

const detailById: Record<string, DetailRecord> = {
  'tx-001': {
    id: 'tx-001',
    merchant: "L'Avenue Brasserie",
    category: 'Dining & Lifestyle',
    date: 'October 24, 2023',
    time: '8:14 PM',
    amount: 482.5,
    currency: 'USD',
    tags: ['Client dinner', 'Business lunch', 'Receipt attached'],
    recurring: 'Monthly Dinner Club',
    splitStatus: 'Shared with 3 others',
    notes: 'Upscale client dinner with recurring dining pattern detected against the active lifestyle budget.',
    tax: '$39.84',
    gratuity: '$80.00',
    paymentMethod: 'Visa Emerald •• 9012',
    location: 'Fine Dining · French',
  },
  'tx-002': {
    id: 'tx-002',
    merchant: 'Harrods Knightsbridge',
    category: 'Lifestyle',
    date: 'October 24, 2023',
    time: '10:15 AM',
    amount: 2450,
    currency: 'GBP',
    tags: ['Apparel', 'Luxury', 'Flagged'],
    recurring: 'Not recurring',
    splitStatus: 'Personal ledger',
    notes: 'High-value discretionary spend. Consider tagging against lifestyle goals for clearer month-end reporting.',
    tax: '£408.33',
    gratuity: '£0.00',
    paymentMethod: 'Mastercard Black •• 4431',
    location: 'Curated Apparel · Knightsbridge',
  },
  'tx-003': {
    id: 'tx-003',
    merchant: 'Client Retainer',
    category: 'Income',
    date: 'October 24, 2023',
    time: '9:20 AM',
    amount: 5200,
    currency: 'USD',
    tags: ['Income', 'Nova Labs', 'Recurring'],
    recurring: 'Monthly Retainer',
    splitStatus: 'Business income',
    notes: 'Retainer received for the active Nova Labs project. Forecast now reflects improved monthly cash runway.',
    tax: '$0.00',
    gratuity: '$0.00',
    paymentMethod: 'Wire Transfer •• 7720',
    location: 'Consulting · Remote',
  },
};

const fallbackDetail: DetailRecord = {
  id: 'fallback',
  merchant: 'Shell Signature',
  category: 'Transit',
  date: 'October 23, 2023',
  time: '9:00 AM',
  amount: 120,
  currency: 'USD',
  tags: ['Transit', 'Fuel', 'Vehicle'],
  recurring: 'Weekly commute pattern',
  splitStatus: 'Personal ledger',
  notes: 'Fuel expense assigned to transit. This transaction is ready for review or edit in the next milestone.',
  tax: '$9.60',
  gratuity: '$0.00',
  paymentMethod: 'Visa Emerald •• 9012',
  location: 'Premium Refuel · Main Route',
};

const splitPeople = [
  { id: '1', name: 'You', amount: '$120.62', initials: 'SK', color: '#0C3F2B', progress: 78 },
  { id: '2', name: 'Julianne S.', amount: '$120.62', initials: 'JS', color: '#D7A072', progress: 44 },
  { id: '3', name: 'Marcus W.', amount: '$120.26', initials: 'MW', color: '#D9EFE1', progress: 32 },
];

export function TransactionDetailScreen({ navigation, route }: TransactionDetailScreenProps) {
  const { getTransactionById } = useTransactions();
  const ledgerTransaction = getTransactionById(route.params.transactionId);
  const transaction = detailById[route.params.transactionId] ?? (ledgerTransaction
    ? {
        id: ledgerTransaction.id,
        merchant: ledgerTransaction.merchant,
        category: ledgerTransaction.category,
        date: ledgerTransaction.fullDate ?? (ledgerTransaction.date === 'Today' ? 'April 29, 2026' : ledgerTransaction.date),
        time: ledgerTransaction.time,
        amount: ledgerTransaction.amount,
        currency: ledgerTransaction.currency,
        tags: ledgerTransaction.tags,
        recurring: ledgerTransaction.recurring ? 'Auto-record enabled' : 'Not recurring',
        splitStatus: ledgerTransaction.type === 'income' ? 'Business income' : 'Personal ledger',
        notes: `${ledgerTransaction.note} recorded from the local demo form. This frontend-only entry will stay available while the app session is active.`,
        tax: ledgerTransaction.type === 'income' ? '$0.00' : `$${(ledgerTransaction.amount * 0.08).toFixed(2)}`,
        gratuity: '$0.00',
        paymentMethod: 'Manual Entry',
        location: ledgerTransaction.category,
      }
    : fallbackDetail);

  return (
    <ScreenContainer style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable style={styles.navAction} onPress={() => navigation.navigate('Transactions')}>
          <Ionicons name="arrow-back" size={21} color={palette.primary} />
        </Pressable>
        <AppText variant="subtitle" color={palette.primary} style={styles.topTitle}>
          Ledger Detail
        </AppText>
        <View style={styles.topActions}>
          <Pressable style={styles.navAction}>
            <Ionicons name="pencil" size={18} color={palette.primary} />
          </Pressable>
          <Pressable style={styles.navAction}>
            <Ionicons name="share-social-outline" size={18} color={palette.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.summary}>
        <AppText variant="caption" color={palette.muted}>
          MERCHANT
        </AppText>
        <AppText variant="display" color={palette.primary} style={styles.merchant}>
          {transaction.merchant}
        </AppText>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={palette.muted} />
          <AppText variant="caption" color={palette.muted}>
            {transaction.date} · {transaction.time}
          </AppText>
        </View>
        <AppText variant="display" color={palette.primary} style={styles.amount}>
          ${transaction.amount.toLocaleString(undefined, {
            minimumFractionDigits: transaction.amount % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
          })}
        </AppText>
        <AppText variant="caption" color={palette.muted} style={styles.category}>
          {transaction.category.toUpperCase()}
        </AppText>
      </View>

      <View style={styles.receiptCard}>
        <LinearGradient colors={['#11130F', '#2A2C26']} style={styles.receiptBackdrop}>
          <View style={styles.receipt}>
            <AppText variant="caption" color={palette.muted} style={styles.receiptCenter}>
              SAFE WORTH
            </AppText>
            <AppText variant="caption" color={palette.muted} style={styles.receiptCenter}>
              RECEIPT
            </AppText>
            {['BRASSERIE SEATS', 'DINNER CLUB', 'DESSERT DUO', 'COFFEE SERVICE', 'GRATUITY'].map((line, index) => (
              <View key={line} style={styles.receiptLine}>
                <AppText variant="caption" color="#6D716B">
                  {line}
                </AppText>
                <AppText variant="caption" color="#6D716B">
                  {index === 4 ? '80.00' : `${(index + 1) * 18}.00`}
                </AppText>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      <View style={styles.metaCard}>
        <AppText variant="subtitle" color={palette.primary} style={styles.cardTitle}>
          Receipt Meta
        </AppText>
        <FieldRow label="Tax (9%)" value={transaction.tax} />
        <FieldRow label="Gratuity" value={transaction.gratuity} />
      </View>

      <StatusPanel
        icon="repeat-outline"
        label="RECURRING"
        value={transaction.recurring}
        background="#E1E4DF"
        accent={palette.primary}
      />

      <StatusPanel
        icon="git-merge-outline"
        label="SPLIT STATUS"
        value={transaction.splitStatus}
        background={palette.gold}
        accent="#805411"
      />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText variant="subtitle" color={palette.primary} style={styles.cardTitle}>
            Split Allocation
          </AppText>
          <Ionicons name="people-outline" size={18} color={palette.primary} />
        </View>
        <View style={styles.splitList}>
          {splitPeople.map((person) => (
            <View key={person.id} style={styles.splitRow}>
              <View style={[styles.personAvatar, { backgroundColor: person.color }]}>
                <AppText variant="caption" color={person.id === '1' ? palette.paper : palette.secondary}>
                  {person.initials}
                </AppText>
              </View>
              <View style={styles.personBody}>
                <View style={styles.personTop}>
                  <AppText variant="label" color={palette.ink}>
                    {person.name}
                  </AppText>
                  <AppText variant="label" color={palette.ink}>
                    {person.amount}
                  </AppText>
                </View>
                <View style={styles.personTrack}>
                  <View style={[styles.personFill, { width: `${person.progress}%` }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <AppText variant="subtitle" color={palette.primary} style={styles.cardTitle}>
          Merchant Details
        </AppText>
        <View style={styles.fieldGroup}>
          <AppText variant="caption" color={palette.muted}>
            CATEGORY
          </AppText>
          <AppText variant="label" color={palette.ink}>
            {transaction.location}
          </AppText>
        </View>
        <View style={styles.fieldGroup}>
          <AppText variant="caption" color={palette.muted}>
            PAYMENT METHOD
          </AppText>
          <View style={styles.inline}>
            <Ionicons name="card" size={13} color={palette.ink} />
            <AppText variant="label" color={palette.ink}>
              {transaction.paymentMethod}
            </AppText>
          </View>
        </View>
        <View style={styles.tags}>
          {transaction.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <AppText variant="caption" color={palette.primary}>
                {tag}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <LinearGradient colors={['#E8D2A2', '#F1E8CE']} style={styles.mapCard}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View key={index} style={[styles.mapLine, index % 2 === 0 ? styles.mapLineVertical : styles.mapLineHorizontal]} />
          ))}
          <View style={[styles.pin, styles.pinOne]}>
            <Ionicons name="location" size={18} color={palette.danger} />
          </View>
          <View style={[styles.pin, styles.pinTwo]}>
            <Ionicons name="location" size={18} color={palette.primary} />
          </View>
          <View style={styles.route} />
        </View>
      </LinearGradient>

      <View style={styles.notesCard}>
        <AppText variant="subtitle" color={palette.primary} style={styles.cardTitle}>
          Notes
        </AppText>
        <AppText color={palette.secondary}>{transaction.notes}</AppText>
      </View>

      <View style={styles.manage}>
        <AppText variant="label" color={palette.primary}>
          Manage Transaction
        </AppText>
        <AppText variant="caption" color={palette.muted}>
          Update category or remove from ledger
        </AppText>
        <View style={styles.manageActions}>
          <Pressable style={styles.editButton}>
            <AppText variant="label" color={palette.paper} style={styles.buttonText}>
              Edit Transaction
            </AppText>
          </Pressable>
          <Pressable style={styles.deleteButton}>
            <AppText variant="label" color={palette.danger} style={styles.buttonText}>
              Delete
            </AppText>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <AppText variant="label" color={palette.secondary}>
        {label}
      </AppText>
      <AppText variant="label" color={palette.ink}>
        {value}
      </AppText>
    </View>
  );
}

function StatusPanel({
  icon,
  label,
  value,
  background,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  background: string;
  accent: string;
}) {
  return (
    <View style={[styles.statusPanel, { backgroundColor: background, borderLeftColor: accent }]}>
      <View style={styles.statusIcon}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View>
        <AppText variant="caption" color={palette.muted}>
          {label}
        </AppText>
        <AppText variant="label" color={palette.primary} style={styles.statusValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.paper,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 130,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  navAction: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.bold,
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  summary: {
    paddingTop: spacing.lg,
  },
  merchant: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 37,
    lineHeight: 39,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xxs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.sm,
  },
  amount: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: typography.weight.regular,
  },
  category: {
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  receiptCard: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    ...shadows.soft,
  },
  receiptBackdrop: {
    minHeight: 294,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receipt: {
    width: 135,
    minHeight: 210,
    backgroundColor: '#F5F2EA',
    padding: spacing.sm,
    justifyContent: 'center',
  },
  receiptCenter: {
    textAlign: 'center',
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  metaCard: {
    backgroundColor: palette.card,
    borderRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.md,
  },
  notesCard: {
    backgroundColor: '#F3F5F1',
    borderRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statusPanel: {
    minHeight: 62,
    borderRadius: 5,
    borderLeftWidth: 3,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(249, 250, 246, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusValue: {
    fontWeight: typography.weight.bold,
  },
  splitList: {
    gap: spacing.md,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  personAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personBody: {
    flex: 1,
    gap: spacing.xs,
  },
  personTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  personTrack: {
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    overflow: 'hidden',
  },
  personFill: {
    height: '100%',
    backgroundColor: palette.secondary,
  },
  fieldGroup: {
    gap: spacing.xxs,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: palette.mint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  mapCard: {
    minHeight: 222,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  mapGrid: {
    flex: 1,
    position: 'relative',
  },
  mapLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.64)',
  },
  mapLineVertical: {
    width: 1,
    height: '100%',
    left: '50%',
  },
  mapLineHorizontal: {
    height: 1,
    width: '100%',
    top: '50%',
  },
  pin: {
    position: 'absolute',
  },
  pinOne: {
    top: '20%',
    left: '52%',
  },
  pinTwo: {
    bottom: '32%',
    left: '46%',
  },
  route: {
    position: 'absolute',
    right: 24,
    top: 88,
    width: 84,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: '#4BA7A9',
    transform: [{ rotate: '-24deg' }],
  },
  manage: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  manageActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  editButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 4,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  deleteButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 4,
    backgroundColor: palette.paper,
    borderBottomWidth: 1,
    borderBottomColor: '#F0C9C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: typography.weight.bold,
  },
});
