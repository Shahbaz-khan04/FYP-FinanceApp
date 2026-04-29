import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, ScreenContainer } from '../components/common';
import { RootTabParamList } from '../navigation/AppTabs';
import { radius, shadows, spacing, typography } from '../theme';

type HomeScreenProps = BottomTabScreenProps<RootTabParamList, 'Home'>;

const palette = {
  ink: '#1A1A18',
  muted: '#6F7771',
  paper: '#F9FAF6',
  card: '#FFFFFF',
  cardWarm: '#FFF9EF',
  line: '#E7E8E1',
  primary: '#003F2A',
  secondary: '#506354',
  paleGreen: '#C7F7D8',
  danger: '#C51D23',
  gold: '#F4C776',
};

const budgetItems = [
  { id: '1', label: 'Estate Maintenance', spent: '$2,400', limit: '$3,000', progress: 80, status: 'normal' },
  { id: '2', label: 'Fine Dining', spent: '$1,240', limit: '$800', progress: 100, status: 'over' },
  { id: '3', label: 'Travel & Leisure', spent: '$4,200', limit: '$12,000', progress: 36, status: 'normal' },
];

const goalItems = [
  { id: '1', label: 'Emergency Fund', progress: 68, amount: '$20,400 saved' },
  { id: '2', label: 'Heritage Goal', progress: 62, amount: '$75,000 saved' },
];

const cashFlowBars = [
  { id: '1', label: 'Jan', value: 44, type: 'outflow' },
  { id: '2', label: 'Feb', value: 58, type: 'outflow' },
  { id: '3', label: 'Mar', value: 52, type: 'outflow' },
  { id: '4', label: 'Apr', value: 78, type: 'inflow' },
  { id: '5', label: 'May', value: 66, type: 'outflow' },
  { id: '6', label: 'Jun', value: 88, type: 'current' },
];

export function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <ScreenContainer
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Pressable style={styles.iconButton}>
          <Ionicons name="menu" size={20} color={palette.primary} />
        </Pressable>
        <AppText variant="subtitle" color={palette.primary} style={styles.appTitle}>
          Finance Analyzer
        </AppText>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={palette.card} />
        </View>
      </View>

      <View style={styles.valuationBlock}>
        <AppText variant="caption" color={palette.muted}>
          PORTFOLIO VALUATION
        </AppText>
        <View style={styles.amountRow}>
          <AppText variant="display" color={palette.ink} style={styles.heroAmount}>
            $412,850.42
          </AppText>
          <View style={styles.gainPill}>
            <AppText variant="caption" color={palette.primary} style={styles.gainText}>
              +2.4%
            </AppText>
          </View>
        </View>
      </View>

      <View style={[styles.alertCard, styles.softShadow]}>
        <View style={styles.alertIcon}>
          <Ionicons name="warning" size={18} color={palette.danger} />
        </View>
        <View style={styles.alertCopy}>
          <AppText variant="label" color={palette.ink} style={styles.alertTitle}>
            Anomaly Alert
          </AppText>
          <AppText variant="label" color={palette.secondary}>
            Dining up 24% vs avg. Review recent recurring and lifestyle activity.
          </AppText>
        </View>
        <View style={styles.alertMark}>
          <Ionicons name="trending-up" size={58} color="#EEECE4" />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <AppText variant="title" color={palette.ink} style={styles.sectionTitle}>
            Net Cash Flow
          </AppText>
          <AppText variant="label" color={palette.muted}>
            Last 6 months liquidity trend
          </AppText>
        </View>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: palette.primary }]} />
          <AppText variant="caption" color={palette.secondary}>
            Inflow
          </AppText>
          <View style={[styles.legendDot, { backgroundColor: '#BBC6BD' }]} />
          <AppText variant="caption" color={palette.secondary}>
            Outflow
          </AppText>
        </View>
      </View>

      <View style={[styles.chartCard, styles.softShadow]}>
        <View style={styles.chart}>
          {cashFlowBars.map((bar) => (
            <View key={bar.id} style={styles.barColumn}>
              {bar.type === 'current' && (
                <View style={styles.currentBadge}>
                  <AppText variant="caption" color={palette.card} style={styles.currentText}>
                    Current
                  </AppText>
                </View>
              )}
              <View
                style={[
                  styles.bar,
                  {
                    height: `${bar.value}%`,
                    backgroundColor: bar.type === 'inflow' || bar.type === 'current' ? palette.primary : '#BBC6BD',
                    opacity: bar.type === 'current' ? 1 : 0.72,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, styles.softShadow]}>
        <AppText variant="subtitle" color={palette.ink} style={styles.cardTitle}>
          Budget Health
        </AppText>
        <View style={styles.progressList}>
          {budgetItems.map((item) => (
            <View key={item.id} style={styles.progressItem}>
              <View style={styles.progressRow}>
                <AppText variant="label" color={palette.ink}>
                  {item.label}
                </AppText>
                <AppText variant="label" color={item.status === 'over' ? palette.danger : palette.secondary}>
                  {item.spent} / {item.limit}
                </AppText>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${item.progress}%`,
                      backgroundColor: item.status === 'over' ? palette.danger : palette.primary,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.savingsCard, styles.softShadow]}>
        <View style={styles.sparkleOne}>
          <Ionicons name="sparkles" size={46} color="#DCDDDA" />
        </View>
        <AppText variant="subtitle" color={palette.ink} style={styles.cardTitle}>
          Automated Savings
        </AppText>
        <AppText variant="label" color={palette.secondary} style={styles.savingsCopy}>
          Your assistant moved $450 to Swiss Alpha Fund after forecasting lower volatility.
        </AppText>
        <AppText variant="label" color={palette.primary} style={styles.linkText}>
          Review Strategy
        </AppText>
      </View>

      <View style={styles.ctaGroup}>
        <Pressable
          style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Ionicons name="add-circle-outline" size={19} color={palette.paper} />
          <AppText variant="label" color={palette.paper} style={styles.ctaText}>
            Add Transaction
          </AppText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
          onPress={() => navigation.navigate('ScanReceipt')}
        >
          <Ionicons name="receipt-outline" size={19} color={palette.primary} />
          <AppText variant="label" color={palette.primary} style={styles.ctaText}>
            Scan Receipt
          </AppText>
        </Pressable>
      </View>

      <View style={[styles.card, styles.softShadow]}>
        <AppText variant="subtitle" color={palette.ink} style={styles.cardTitle}>
          Goals Progress
        </AppText>
        <View style={styles.progressList}>
          {goalItems.map((goal) => (
            <View key={goal.id} style={styles.progressItem}>
              <View style={styles.progressRow}>
                <AppText variant="label" color={palette.ink}>
                  {goal.label}
                </AppText>
                <AppText variant="label" color={palette.secondary}>
                  {goal.progress}%
                </AppText>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${goal.progress}%`, backgroundColor: palette.secondary }]} />
              </View>
              <AppText variant="caption" color={palette.muted}>
                {goal.amount}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <LinearGradient
        colors={['#1B5A3B', '#063F2C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.goalHero, styles.softShadow]}
      >
        <AppText variant="subtitle" color="#DDE9D8" style={styles.goalTitle}>
          Heritage Goal
        </AppText>
        <AppText variant="label" color="#BFD0C3">
          Collection of 17th Century Maps
        </AppText>
        <AppText variant="title" color={palette.paper} style={styles.goalAmount}>
          $125,000
        </AppText>
        <View style={styles.goalTrack}>
          <View style={styles.goalFill} />
        </View>
        <View style={styles.goalMeta}>
          <AppText variant="caption" color="#DDE9D8">
            62% COMPLETE
          </AppText>
          <AppText variant="caption" color="#DDE9D8">
            $75,000 SAVED
          </AppText>
        </View>
      </LinearGradient>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.paper,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 128,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    flex: 1,
    marginLeft: spacing.xs,
    fontFamily: typography.fontFamily.heading,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: palette.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuationBlock: {
    marginTop: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroAmount: {
    flex: 1,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: 0,
  },
  gainPill: {
    backgroundColor: '#DDF7E6',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    marginBottom: spacing.xs,
  },
  gainText: {
    fontWeight: typography.weight.bold,
  },
  alertCard: {
    minHeight: 122,
    backgroundColor: palette.cardWarm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F2EAD8',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: '#F8DEDC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  alertCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  alertTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.bold,
  },
  alertMark: {
    position: 'absolute',
    right: -5,
    top: -1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.heading,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingBottom: 3,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    marginLeft: spacing.xs,
  },
  chartCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 184,
  },
  chart: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 3,
  },
  bar: {
    width: '100%',
    maxWidth: 45,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  currentBadge: {
    position: 'absolute',
    top: 0,
    backgroundColor: palette.primary,
    borderRadius: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    zIndex: 2,
  },
  currentText: {
    fontSize: 9,
    lineHeight: 11,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.xl,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.heading,
    marginBottom: spacing.lg,
  },
  progressList: {
    gap: spacing.md,
  },
  progressItem: {
    gap: spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  track: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  savingsCard: {
    backgroundColor: '#F6F7F3',
    borderRadius: radius.md,
    padding: spacing.xl,
    minHeight: 154,
    overflow: 'hidden',
  },
  savingsCopy: {
    maxWidth: 236,
  },
  sparkleOne: {
    position: 'absolute',
    right: 18,
    bottom: 12,
  },
  linkText: {
    marginTop: spacing.lg,
    fontWeight: typography.weight.bold,
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: palette.primary,
    paddingBottom: 2,
  },
  ctaGroup: {
    gap: spacing.sm,
  },
  primaryCta: {
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    ...shadows.soft,
  },
  secondaryCta: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: '#E2E4DE',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ctaText: {
    fontWeight: typography.weight.bold,
  },
  pressed: {
    opacity: 0.82,
  },
  goalHero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    minHeight: 180,
    overflow: 'hidden',
  },
  goalTitle: {
    fontFamily: typography.fontFamily.heading,
    marginBottom: spacing.xs,
  },
  goalAmount: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    fontFamily: typography.fontFamily.heading,
  },
  goalTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(249, 250, 246, 0.32)',
    overflow: 'hidden',
  },
  goalFill: {
    width: '62%',
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: palette.paleGreen,
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  softShadow: {
    shadowColor: '#17231B',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
});
