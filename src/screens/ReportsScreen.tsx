import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, ScreenContainer } from '../components/common';
import { monthlyTrend, spendingSplit } from '../data/dummyData';
import { colors, radius, spacing } from '../theme';

export function ReportsScreen() {
  const maxValue = Math.max(...monthlyTrend.map((point) => point.value));

  return (
    <ScreenContainer>
      <View>
        <AppText variant="caption" color={colors.textMuted}>
          PERFORMANCE REPORTS
        </AppText>
        <AppText variant="title">Spending Analytics</AppText>
      </View>

      <AppCard>
        <AppText variant="subtitle" style={styles.cardTitle}>
          6-Month Expense Trend
        </AppText>
        <View style={styles.chartRow}>
          {monthlyTrend.map((point) => (
            <View key={point.month} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: `${(point.value / maxValue) * 100}%`, backgroundColor: colors.brandPrimary },
                  ]}
                />
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {point.month}
              </AppText>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" style={styles.cardTitle}>
          Spending Split
        </AppText>
        <View style={styles.splitList}>
          {spendingSplit.map((part) => (
            <View key={part.id} style={styles.splitRow}>
              <View style={styles.splitLeft}>
                <View style={[styles.legendDot, { backgroundColor: part.color }]} />
                <AppText variant="label">{part.label}</AppText>
              </View>
              <AppText variant="label" color={colors.textSecondary}>
                {part.percentage}%
              </AppText>
            </View>
          ))}
        </View>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    marginBottom: spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barCol: {
    alignItems: 'center',
    width: 38,
    gap: spacing.xs,
  },
  barTrack: {
    width: '100%',
    height: 132,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    justifyContent: 'flex-end',
    padding: 4,
  },
  bar: {
    width: '100%',
    borderRadius: radius.sm,
  },
  splitList: {
    gap: spacing.md,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
});
