import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DimensionValue, Pressable, StyleSheet, View } from 'react-native';

import { AppText, ScreenContainer } from '../components/common';
import { radius, shadows, spacing, typography } from '../theme';

const palette = {
  paper: '#F9FAF6',
  card: '#FFFFFF',
  panel: '#F2F4F0',
  ink: '#1A1A18',
  primary: '#003F2A',
  secondary: '#506354',
  muted: '#747B75',
  softText: '#A9AFA9',
  line: '#E2E5DE',
  warm: '#FFF1DC',
  peach: '#FFDCA8',
  danger: '#D01F2F',
  success: '#0E6B48',
};

const budgetCategories = [
  {
    id: '1',
    icon: 'home-outline' as const,
    label: 'Estate & Utilities',
    description: 'Fixed obligations for the residence',
    planned: 3200,
    spent: 980,
    color: palette.primary,
  },
  {
    id: '2',
    icon: 'basket-outline' as const,
    label: 'Provisions',
    description: 'Groceries, ingredients & pantry',
    planned: 850,
    spent: 210,
    color: palette.success,
  },
  {
    id: '3',
    icon: 'restaurant-outline' as const,
    label: 'Culinary Experiences',
    description: 'Gastronomy and social dining',
    planned: 1200,
    spent: 1248,
    color: palette.peach,
  },
  {
    id: '4',
    icon: 'car-outline' as const,
    label: 'Transit & Travel',
    description: 'Commute and local mobility',
    planned: 450,
    spent: 335,
    color: palette.primary,
  },
];

const variances = [
  {
    id: '1',
    icon: 'restaurant' as const,
    label: 'Gastronomy',
    detail: '4 transactions this week',
    amount: '+$420.00',
    status: 'OVERBUDGET',
    tone: 'danger',
  },
  {
    id: '2',
    icon: 'car' as const,
    label: 'Transport & Fuel',
    detail: 'Commute optimization active',
    amount: '-$115.40',
    status: 'UNDERBUDGET',
    tone: 'success',
  },
  {
    id: '3',
    icon: 'fitness' as const,
    label: 'Wellness',
    detail: 'Annual membership paid',
    amount: '-$40.00',
    status: 'UNDERBUDGET',
    tone: 'success',
  },
];

const savingBars = [34, 52, 48, 72, 86, 64];

export function BudgetsScreen() {
  const totalPlanned = budgetCategories.reduce((sum, item) => sum + item.planned, 0);
  const totalSpent = budgetCategories.reduce((sum, item) => sum + item.spent, 0);
  const safeToSpend = 12500 - totalSpent - 1872.5;
  const usedPercent = Math.round((totalSpent / totalPlanned) * 100);

  return (
    <ScreenContainer style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <AppText variant="caption" color={palette.secondary} style={styles.letterLabel}>
          CURRENT LIQUIDITY FOCUS
        </AppText>
        <AppText variant="display" color={palette.primary} style={styles.heroTitle}>
          Remaining{'\n'}Safe-to-Spend
        </AppText>
        <AppText variant="display" color={palette.primary} style={styles.safeAmount}>
          ${safeToSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </AppText>
        <AppText variant="label" color={palette.secondary} style={styles.throughDate}>
          Through Oct 31st
        </AppText>
        <View style={styles.heroTrack}>
          <View style={[styles.heroFill, { width: `${usedPercent}%` }]} />
        </View>
        <View style={styles.heroMeta}>
          <AppText variant="caption" color={palette.secondary}>
            {usedPercent}% OF MONTHLY LIMIT USED
          </AppText>
          <AppText variant="caption" color={palette.secondary}>
            IDEAL: 72%
          </AppText>
        </View>
      </View>

      <View style={styles.methodTabs}>
        <Pressable style={styles.methodActive}>
          <AppText variant="label" color={palette.paper} style={styles.methodText}>
            ENVELOPE
          </AppText>
        </Pressable>
        <Pressable style={styles.methodTab}>
          <AppText variant="label" color={palette.secondary}>
            ZERO-BASED
          </AppText>
        </Pressable>
        <Pressable style={styles.methodTabSmall}>
          <AppText variant="label" color={palette.secondary}>
            PERCENTAGE
          </AppText>
        </Pressable>
      </View>

      <View style={[styles.incomeCard, styles.softShadow]}>
        <AppText variant="caption" color={palette.secondary} style={styles.letterLabel}>
          TOTAL PROJECTED INCOME
        </AppText>
        <View style={styles.incomeRow}>
          <AppText variant="display" color={palette.primary} style={styles.incomeAmount}>
            $ 12,500
          </AppText>
          <AppText variant="title" color={palette.softText} style={styles.cents}>
            .00
          </AppText>
        </View>
      </View>

      <LinearGradient
        colors={['#1B5139', '#164B35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.scoreCard, styles.softShadow]}
      >
        <Ionicons name="sparkles" size={29} color="#9DB7A8" />
        <AppText variant="caption" color="#9DB7A8" style={styles.letterLabel}>
          EFFICIENCY SCORE
        </AppText>
        <AppText variant="title" color="#AFC9BA" style={styles.scoreText}>
          94%
        </AppText>
      </LinearGradient>

      <View style={[styles.methodCard, styles.softShadow]}>
        <AppText variant="subtitle" color={palette.primary} style={styles.methodologyTitle}>
          Methodology: The 50/30/20{'\n'}Balanced Journal
        </AppText>
        <View style={styles.methodBars}>
          <SegmentBar width="50%" color={palette.primary} label="50% NEEDS" />
          <SegmentBar width="30%" color="#8CB29B" label="30% WANTS" />
          <SegmentBar width="20%" color={palette.peach} label="20% SAVINGS" />
        </View>
      </View>

      <View style={styles.categoryList}>
        {budgetCategories.map((item) => {
          const progress = Math.min(100, (item.spent / item.planned) * 100);

          return (
            <View key={item.id} style={styles.categoryRow}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Ionicons name={item.icon} size={18} color="#A2B4AA" />
                  <AppText variant="subtitle" color={palette.primary} style={styles.categoryTitle}>
                    {item.label}
                  </AppText>
                </View>
                <View style={styles.plannedBlock}>
                  <AppText variant="title" color={palette.primary} style={styles.plannedAmount}>
                    {item.planned.toLocaleString()}
                  </AppText>
                  <AppText variant="caption" color={palette.softText}>
                    PLANNED
                  </AppText>
                </View>
              </View>
              <AppText color={palette.softText} style={styles.categoryDescription}>
                {item.description}
              </AppText>
              <View style={styles.categoryTrack}>
                <View style={[styles.categoryFill, { width: `${progress}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.recommendationCard, styles.softShadow]}>
        <AppText variant="caption" color="#3F2605" style={styles.recommendationLabel}>
          ✦ THE ATELIER RECOMMENDATION
        </AppText>
        <AppText variant="title" color="#3F2605" style={styles.recommendationCopy}>
          "Your Leisure & Dining category is trending 14% higher than last month. Reallocate $200 from your
          Buffer Fund to maintain your savings trajectory without compromise."
        </AppText>
      </View>

      <View style={[styles.varianceCard, styles.softShadow]}>
        <AppText variant="title" color={palette.ink} style={styles.varianceTitle}>
          Top Variances
        </AppText>
        <View style={styles.varianceList}>
          {variances.map((item) => (
            <View key={item.id} style={styles.varianceRow}>
              <View style={styles.varianceIcon}>
                <Ionicons name={item.icon} size={23} color={palette.primary} />
              </View>
              <View style={styles.varianceBody}>
                <AppText variant="subtitle" color={palette.primary} style={styles.varianceName}>
                  {item.label}
                </AppText>
                <AppText variant="label" color={palette.secondary}>
                  {item.detail}
                </AppText>
              </View>
              <View style={styles.varianceAmountBlock}>
                <AppText
                  variant="subtitle"
                  color={item.tone === 'danger' ? palette.danger : palette.primary}
                  style={styles.varianceAmount}
                >
                  {item.amount}
                </AppText>
                <AppText
                  variant="caption"
                  color={item.tone === 'danger' ? palette.danger : palette.secondary}
                >
                  {item.status}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </View>

      <LinearGradient
        colors={['#1F5A40', '#164B35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.investmentCard, styles.softShadow]}
      >
        <Ionicons name="business-outline" size={31} color="#9DB7A8" />
        <AppText variant="subtitle" color="#9DB7A8" style={styles.investmentTitle}>
          Investment Envelope
        </AppText>
        <AppText variant="caption" color="#75937F" style={styles.letterLabel}>
          PROJECTED CONTRIBUTION
        </AppText>
        <AppText variant="title" color="#9DB7A8" style={styles.investmentAmount}>
          $2,400.00
        </AppText>
      </LinearGradient>

      <View style={[styles.momentumCard, styles.softShadow]}>
        <AppText variant="caption" color={palette.secondary} style={styles.letterLabel}>
          SAVINGS MOMENTUM
        </AppText>
        <View style={styles.savingChart}>
          {savingBars.map((height, index) => (
            <View
              key={`${height}-${index}`}
              style={[
                styles.savingBar,
                {
                  height,
                  backgroundColor: index === 3 || index === 4 ? palette.primary : '#EFF0EC',
                },
              ]}
            />
          ))}
        </View>
        <AppText variant="label" color={palette.secondary}>
          Highest saving streak in 12 months
        </AppText>
      </View>

      <Pressable style={styles.commitButton}>
        <AppText variant="label" color={palette.paper} style={styles.commitText}>
          COMMIT TO JOURNAL
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
}

function SegmentBar({ width, color, label }: { width: DimensionValue; color: string; label: string }) {
  return (
    <View style={styles.segment}>
      <View style={[styles.segmentLine, { width, backgroundColor: color }]} />
      <AppText variant="caption" color={palette.secondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.paper,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 132,
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.xs,
  },
  letterLabel: {
    letterSpacing: 2.4,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    fontSize: 49,
    lineHeight: 53,
  },
  safeAmount: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    fontSize: 51,
    lineHeight: 55,
    textAlign: 'right',
  },
  throughDate: {
    textAlign: 'right',
    marginBottom: spacing.xl,
  },
  heroTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    overflow: 'hidden',
  },
  heroFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
  },
  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  methodTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  methodActive: {
    height: 36,
    minWidth: 112,
    borderRadius: radius.sm,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  methodTab: {
    height: 36,
    minWidth: 126,
    borderRadius: radius.sm,
    backgroundColor: '#EFF1ED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  methodTabSmall: {
    height: 36,
    minWidth: 128,
    borderRadius: radius.sm,
    backgroundColor: '#EFF1ED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  methodText: {
    fontWeight: typography.weight.bold,
  },
  incomeCard: {
    backgroundColor: palette.panel,
    borderRadius: radius.sm,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  incomeAmount: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 48,
    lineHeight: 54,
    fontWeight: typography.weight.regular,
  },
  cents: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    marginBottom: 4,
  },
  scoreCard: {
    minHeight: 150,
    borderRadius: radius.sm,
    padding: spacing.xxl,
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: typography.fontFamily.heading,
    fontStyle: 'italic',
    fontSize: 31,
    lineHeight: 36,
  },
  methodCard: {
    backgroundColor: palette.card,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: palette.peach,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  methodologyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontStyle: 'italic',
    fontWeight: typography.weight.regular,
    lineHeight: 28,
  },
  methodBars: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  segment: {
    flex: 1,
    gap: spacing.sm,
  },
  segmentLine: {
    height: 8,
    borderRadius: radius.pill,
  },
  categoryList: {
    gap: spacing.xl,
  },
  categoryRow: {
    gap: spacing.xs,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  categoryTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    fontSize: 24,
    lineHeight: 29,
  },
  plannedBlock: {
    alignItems: 'flex-end',
  },
  plannedAmount: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    fontSize: 30,
    lineHeight: 34,
  },
  categoryDescription: {
    maxWidth: 230,
    fontSize: 17,
    lineHeight: 24,
  },
  categoryTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  categoryFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  recommendationCard: {
    backgroundColor: palette.warm,
    borderRadius: radius.sm,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  recommendationLabel: {
    fontWeight: typography.weight.bold,
  },
  recommendationCopy: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    fontSize: 26,
    lineHeight: 39,
  },
  varianceCard: {
    backgroundColor: palette.panel,
    borderRadius: radius.sm,
    padding: spacing.xxl,
    gap: spacing.xxl,
  },
  varianceTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
  },
  varianceList: {
    gap: spacing.xl,
  },
  varianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  varianceIcon: {
    width: 48,
    height: 48,
    borderRadius: 5,
    backgroundColor: '#E1E4DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  varianceBody: {
    flex: 1,
  },
  varianceName: {
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.weight.bold,
  },
  varianceAmountBlock: {
    alignItems: 'flex-end',
  },
  varianceAmount: {
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.weight.medium,
  },
  investmentCard: {
    minHeight: 190,
    borderRadius: radius.sm,
    padding: spacing.xxl,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  investmentTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    marginBottom: spacing.xl,
  },
  investmentAmount: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    fontSize: 31,
  },
  momentumCard: {
    backgroundColor: palette.card,
    borderRadius: radius.sm,
    padding: spacing.xxl,
    gap: spacing.xl,
  },
  savingChart: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  savingBar: {
    width: 39,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  commitButton: {
    minHeight: 52,
    width: '78%',
    alignSelf: 'center',
    borderRadius: 6,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  commitText: {
    letterSpacing: 1.6,
    fontWeight: typography.weight.bold,
  },
  softShadow: {
    shadowColor: '#17231B',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
});
