import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText, ScreenContainer } from '../components/common';
import { monthlyTrend, spendingSplit } from '../data/dummyData';
import { radius, shadows, spacing, typography } from '../theme';

const palette = {
  paper: '#F9FAF6',
  card: '#FFFFFF',
  panel: '#F2F4F0',
  ink: '#1A1A18',
  primary: '#003F2A',
  secondary: '#506354',
  muted: '#747B75',
  line: '#E2E5DE',
  peach: '#FFDCA8',
  mint: '#CFF1D9',
  blue: '#DBE8F0',
};

export function ReportsScreen() {
  const maxValue = Math.max(...monthlyTrend.map((point) => point.value));
  const currentMonth = monthlyTrend[monthlyTrend.length - 1];

  return (
    <ScreenContainer style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="caption" color={palette.muted} style={styles.letterLabel}>
          PERFORMANCE REPORTS
        </AppText>
        <AppText variant="display" color={palette.primary} style={styles.title}>
          Financial{'\n'}Intelligence
        </AppText>
      </View>

      <LinearGradient
        colors={['#1F5A40', '#063F2C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, styles.softShadow]}
      >
        <View>
          <AppText variant="caption" color="#AFC9BA">
            FORECASTED SURPLUS
          </AppText>
          <AppText variant="display" color={palette.paper} style={styles.heroAmount}>
            $3,340
          </AppText>
        </View>
        <View style={styles.heroBadge}>
          <Ionicons name="trending-up" size={16} color={palette.primary} />
          <AppText variant="caption" color={palette.primary}>
            +8.6%
          </AppText>
        </View>
      </LinearGradient>

      <View style={[styles.card, styles.softShadow]}>
        <View style={styles.cardHeader}>
          <View>
            <AppText variant="subtitle" color={palette.ink} style={styles.cardTitle}>
              6-Month Expense Trend
            </AppText>
            <AppText variant="label" color={palette.muted}>
              Current view: {currentMonth.month}
            </AppText>
          </View>
          <Ionicons name="bar-chart-outline" size={22} color={palette.primary} />
        </View>
        <View style={styles.chartRow}>
          {monthlyTrend.map((point, index) => (
            <View key={point.month} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(point.value / maxValue) * 100}%`,
                      backgroundColor: index >= 3 ? palette.primary : '#DDE2DB',
                    },
                  ]}
                />
              </View>
              <AppText variant="caption" color={palette.muted}>
                {point.month}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, styles.softShadow]}>
        <AppText variant="subtitle" color={palette.ink} style={styles.cardTitle}>
          Spending Split
        </AppText>
        <View style={styles.splitList}>
          {spendingSplit.map((part) => (
            <View key={part.id} style={styles.splitRow}>
              <View style={styles.splitLeft}>
                <View style={[styles.legendDot, { backgroundColor: part.color }]} />
                <View>
                  <AppText variant="label" color={palette.ink}>
                    {part.label}
                  </AppText>
                  <AppText variant="caption" color={palette.muted}>
                    {part.percentage}% of total outflow
                  </AppText>
                </View>
              </View>
              <View style={styles.splitTrack}>
                <View style={[styles.splitFill, { width: `${part.percentage}%`, backgroundColor: part.color }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.insightGrid}>
        <View style={[styles.metricCard, styles.softShadow]}>
          <Ionicons name="shield-checkmark-outline" size={22} color={palette.primary} />
          <AppText variant="caption" color={palette.muted}>
            RISK
          </AppText>
          <AppText variant="title" color={palette.primary} style={styles.metricValue}>
            Low
          </AppText>
        </View>
        <View style={[styles.metricCard, styles.softShadow]}>
          <Ionicons name="cash-outline" size={22} color={palette.primary} />
          <AppText variant="caption" color={palette.muted}>
            RUNWAY
          </AppText>
          <AppText variant="title" color={palette.primary} style={styles.metricValue}>
            5.3 mo
          </AppText>
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
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  letterLabel: {
    letterSpacing: 2.4,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    fontSize: 48,
    lineHeight: 52,
  },
  heroCard: {
    minHeight: 150,
    borderRadius: radius.md,
    padding: spacing.xl,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroAmount: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    fontSize: 48,
    lineHeight: 54,
    marginTop: spacing.xs,
  },
  heroBadge: {
    backgroundColor: palette.mint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 172,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  barTrack: {
    width: 38,
    height: 138,
    backgroundColor: palette.panel,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  splitList: {
    gap: spacing.lg,
  },
  splitRow: {
    gap: spacing.sm,
  },
  splitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
  },
  splitTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    overflow: 'hidden',
  },
  splitFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  insightGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minHeight: 136,
    borderRadius: radius.md,
    backgroundColor: palette.card,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  metricValue: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
  },
  softShadow: {
    shadowColor: '#17231B',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
});
