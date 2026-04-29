import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, ScreenContainer } from '../components/common';
import { useTransactions } from '../context/TransactionsContext';
import { RootTabParamList } from '../navigation/AppTabs';
import { radius, shadows, spacing, typography } from '../theme';

type TransactionsScreenProps = BottomTabScreenProps<RootTabParamList, 'Transactions'>;

const palette = {
  ink: '#1A1A18',
  primary: '#003F2A',
  muted: '#747B75',
  softText: '#B7BDB7',
  paper: '#F9FAF6',
  card: '#FFFFFF',
  line: '#E7E8E1',
  chip: '#E3E5DF',
  danger: '#C51D23',
  success: '#08784C',
  gold: '#FFDCA8',
  mint: '#CFF1D9',
  aqua: '#BFF1D9',
};

export function TransactionsScreen({ navigation }: TransactionsScreenProps) {
  const { transactions } = useTransactions();
  const groups = [
    { title: 'Today', items: transactions.filter((item) => item.date === 'Today') },
    { title: 'Yesterday', items: transactions.filter((item) => item.date === 'Yesterday') },
    { title: 'Earlier', items: transactions.filter((item) => item.date !== 'Today' && item.date !== 'Yesterday') },
  ].filter((group) => group.items.length > 0);

  return (
    <ScreenContainer style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="caption" color={palette.muted} style={styles.letterLabel}>
          MONTHLY OVERSIGHT
        </AppText>
        <AppText variant="display" color={palette.primary} style={styles.title}>
          Ledger
        </AppText>
      </View>

      <View style={[styles.summaryCard, styles.softShadow]}>
        <View style={styles.summaryTop}>
          <AppText variant="caption" color={palette.muted}>
            CURRENT OUTFLOW
          </AppText>
          <AppText variant="label" color={palette.danger} style={styles.change}>
            +12.4%
          </AppText>
        </View>
        <AppText variant="display" color={palette.primary} style={styles.outflowAmount}>
          $12,482.50
        </AppText>
        <View style={styles.summaryTrack}>
          <View style={styles.summaryFill} />
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={24} color="#3D4640" />
        <AppText color="#6D7480" style={styles.searchText}>
          Search merchants or categories...
        </AppText>
      </View>

      <View style={styles.filters}>
        <Pressable style={styles.filterPrimary}>
          <Ionicons name="filter" size={18} color={palette.paper} />
          <AppText variant="label" color={palette.paper} style={styles.filterText}>
            Filters
          </AppText>
        </Pressable>
        <Pressable style={styles.filterChip}>
          <AppText variant="label" color={palette.ink}>
            Last 30 Days
          </AppText>
        </Pressable>
        <Pressable style={styles.filterChip}>
          <AppText variant="label" color={palette.ink}>
            Category
          </AppText>
        </Pressable>
      </View>

      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <View style={styles.groupTitleRow}>
            <AppText variant="title" color={palette.primary} style={styles.groupTitle}>
              {group.title}
            </AppText>
            <View style={styles.divider} />
          </View>

          <View style={styles.transactionList}>
            {group.items.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.transactionRow, pressed && styles.pressed]}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
              >
                <View style={[styles.iconTile, { backgroundColor: item.tint }]}>
                  <Ionicons name={item.icon} size={21} color={palette.primary} />
                </View>

                <View style={styles.transactionBody}>
                  <AppText variant="subtitle" color={palette.ink} numberOfLines={2} style={styles.merchant}>
                    {item.merchant}
                  </AppText>
                  <AppText variant="caption" color={palette.muted} numberOfLines={1}>
                    {item.category.toUpperCase()}  •  {item.time}
                  </AppText>
                </View>

                <View style={styles.amountBlock}>
                  <AppText
                    variant="subtitle"
                    color={item.type === 'income' ? palette.success : palette.primary}
                    style={styles.amount}
                  >
                    {item.type === 'income' ? '+' : ''}${item.amount.toLocaleString(undefined, {
                      minimumFractionDigits: item.amount % 1 === 0 ? 0 : 2,
                      maximumFractionDigits: 2,
                    })}
                  </AppText>
                  <AppText variant="caption" color={palette.softText} numberOfLines={1}>
                    {item.currency} · {item.note}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.insightCard}>
        <View style={styles.insightIcon}>
          <Ionicons name="sparkles" size={30} color="#3F2605" />
        </View>
        <View style={styles.insightCopy}>
          <AppText variant="subtitle" color="#3F2605" style={styles.insightTitle}>
            Refined Perspective
          </AppText>
          <AppText color="#684C2E" style={styles.insightText}>
            Your dining expenditure is 18% higher than last month. Consider moving business lunches to
            your Corporate Spend ledger.
          </AppText>
        </View>
        <View style={styles.insightMark}>
          <Ionicons name="business" size={76} color="rgba(63, 38, 5, 0.08)" />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.paper,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 130,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xxs,
  },
  letterLabel: {
    letterSpacing: 3,
  },
  title: {
    fontSize: 56,
    lineHeight: 62,
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
  },
  summaryCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  change: {
    fontWeight: typography.weight.bold,
  },
  outflowAmount: {
    fontSize: 42,
    lineHeight: 48,
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
  },
  summaryTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    overflow: 'hidden',
  },
  summaryFill: {
    width: '74%',
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
  },
  searchBox: {
    minHeight: 62,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  searchText: {
    flex: 1,
    fontSize: 18,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  filterPrimary: {
    height: 50,
    borderRadius: 5,
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterText: {
    fontWeight: typography.weight.bold,
  },
  filterChip: {
    height: 50,
    minWidth: 128,
    borderRadius: 5,
    backgroundColor: palette.chip,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  group: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  groupTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.bold,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: palette.line,
  },
  transactionList: {
    gap: spacing.xl,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconTile: {
    width: 62,
    height: 62,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  merchant: {
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.weight.bold,
  },
  amountBlock: {
    alignItems: 'flex-end',
    width: 126,
    gap: 3,
  },
  amount: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 27,
    lineHeight: 32,
  },
  pressed: {
    opacity: 0.72,
  },
  insightCard: {
    minHeight: 206,
    borderRadius: radius.md,
    backgroundColor: '#FFF2DC',
    padding: spacing.xl,
    flexDirection: 'row',
    gap: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F5E2BD',
    marginTop: spacing.sm,
  },
  insightIcon: {
    width: 42,
    paddingTop: 6,
    alignItems: 'center',
  },
  insightCopy: {
    flex: 1,
    gap: spacing.md,
  },
  insightTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 25,
    lineHeight: 31,
  },
  insightText: {
    fontSize: 17,
    lineHeight: 28,
  },
  insightMark: {
    position: 'absolute',
    right: -8,
    top: 0,
  },
  softShadow: {
    shadowColor: '#17231B',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
});
