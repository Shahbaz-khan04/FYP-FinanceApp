import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, ScreenContainer } from '../components/common';
import { budgets } from '../data/dummyData';
import { colors, radius, spacing } from '../theme';

export function BudgetsScreen() {
  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <ScreenContainer>
      <View>
        <AppText variant="caption" color={colors.textMuted}>
          FLEXIBLE BUDGETS
        </AppText>
        <AppText variant="title">Monthly Budget Planner</AppText>
      </View>

      <AppCard>
        <View style={styles.summaryRow}>
          <View>
            <AppText variant="caption" color={colors.textMuted}>
              TOTAL ALLOCATED
            </AppText>
            <AppText variant="subtitle">${totalLimit.toLocaleString()}</AppText>
          </View>
          <View>
            <AppText variant="caption" color={colors.textMuted}>
              SPENT SO FAR
            </AppText>
            <AppText variant="subtitle">${totalSpent.toLocaleString()}</AppText>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, (totalSpent / totalLimit) * 100)}%`,
                backgroundColor: colors.brandPrimary,
              },
            ]}
          />
        </View>
      </AppCard>

      {budgets.map((item) => {
        const percentage = Math.min(100, (item.spent / item.limit) * 100);

        return (
          <AppCard key={item.id}>
            <View style={styles.itemHead}>
              <AppText variant="subtitle">{item.category}</AppText>
              <AppText variant="label" color={colors.textSecondary}>
                ${item.spent} / ${item.limit}
              </AppText>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: item.color }]}
              />
            </View>

            <AppText variant="caption" color={colors.textMuted}>
              {Math.round(percentage)}% utilized this month
            </AppText>
          </AppCard>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  itemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
