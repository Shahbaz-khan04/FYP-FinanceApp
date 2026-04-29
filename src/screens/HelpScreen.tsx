import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, ScreenContainer } from '../components/common';
import { helpTopics } from '../data/dummyData';
import { colors, radius, spacing } from '../theme';

export function HelpScreen() {
  return (
    <ScreenContainer>
      <View>
        <AppText variant="caption" color={colors.textMuted}>
          SUPPORT CENTER
        </AppText>
        <AppText variant="title">Help & Guidance</AppText>
      </View>

      <AppCard>
        <View style={styles.rowTop}>
          <View style={styles.iconBadge}>
            <Ionicons name="sparkles-outline" size={18} color={colors.neutral} />
          </View>
          <View style={styles.topTextWrap}>
            <AppText variant="subtitle">Demo Assistance</AppText>
            <AppText variant="label" color={colors.textSecondary}>
              Learn what this milestone includes and what is intentionally deferred.
            </AppText>
          </View>
        </View>
      </AppCard>

      {helpTopics.map((topic) => (
        <AppCard key={topic.id}>
          <AppText variant="subtitle" style={styles.topicTitle}>
            {topic.title}
          </AppText>
          <AppText color={colors.textSecondary}>{topic.description}</AppText>
        </AppCard>
      ))}

      <View style={styles.actionRow}>
        <View style={[styles.actionButton, { backgroundColor: colors.brandPrimary }]}> 
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.neutral} />
          <AppText variant="label">Chat Support</AppText>
        </View>
        <View style={[styles.actionButton, { backgroundColor: colors.brandTertiary }]}> 
          <Ionicons name="book-outline" size={18} color={colors.neutral} />
          <AppText variant="label">FYP Docs</AppText>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  rowTop: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTextWrap: {
    flex: 1,
    gap: spacing.xxs,
  },
  topicTitle: {
    marginBottom: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 92,
  },
});
