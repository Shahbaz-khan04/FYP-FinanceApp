import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, ScreenContainer } from '../components/common';
import { helpTopics } from '../data/dummyData';
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
  warm: '#FFF1DC',
};

export function HelpScreen() {
  return (
    <ScreenContainer style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="caption" color={palette.muted} style={styles.letterLabel}>
          SUPPORT CENTER
        </AppText>
        <AppText variant="display" color={palette.primary} style={styles.title}>
          Demo{'\n'}Guidance
        </AppText>
      </View>

      <LinearGradient
        colors={['#1F5A40', '#063F2C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, styles.softShadow]}
      >
        <View style={styles.heroIcon}>
          <Ionicons name="sparkles-outline" size={24} color={palette.primary} />
        </View>
        <View style={styles.heroCopy}>
          <AppText variant="subtitle" color={palette.paper} style={styles.heroTitle}>
            Frontend Demo Mode
          </AppText>
          <AppText color="#C8D9CF">
            This build uses polished dummy data, local state, and guided flows for the FYP presentation.
          </AppText>
        </View>
      </LinearGradient>

      {helpTopics.map((topic, index) => (
        <View key={topic.id} style={[styles.topicCard, styles.softShadow]}>
          <View style={styles.topicIndex}>
            <AppText variant="caption" color={palette.primary}>
              0{index + 1}
            </AppText>
          </View>
          <View style={styles.topicBody}>
            <AppText variant="subtitle" color={palette.ink} style={styles.topicTitle}>
              {topic.title}
            </AppText>
            <AppText color={palette.secondary}>{topic.description}</AppText>
          </View>
        </View>
      ))}

      <View style={[styles.scopeCard, styles.softShadow]}>
        <AppText variant="subtitle" color={palette.primary} style={styles.scopeTitle}>
          Current Scope
        </AppText>
        <View style={styles.scopeList}>
          <ScopeRow icon="phone-portrait-outline" label="Mobile-first Expo frontend" />
          <ScopeRow icon="file-tray-stacked-outline" label="Dummy financial data and local state" />
          <ScopeRow icon="lock-closed-outline" label="No backend, API, database, tax, or bank connection" />
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryAction}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={palette.paper} />
          <AppText variant="label" color={palette.paper} style={styles.actionText}>
            Demo Script
          </AppText>
        </Pressable>
        <Pressable style={styles.secondaryAction}>
          <Ionicons name="book-outline" size={18} color={palette.primary} />
          <AppText variant="label" color={palette.primary} style={styles.actionText}>
            FYP Notes
          </AppText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function ScopeRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.scopeRow}>
      <Ionicons name={icon} size={18} color={palette.primary} />
      <AppText variant="label" color={palette.secondary} style={styles.scopeLabel}>
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
    minHeight: 156,
    borderRadius: radius.md,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#D9EFE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
  },
  topicCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  topicIndex: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: palette.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicBody: {
    flex: 1,
    gap: spacing.xs,
  },
  topicTitle: {
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.weight.bold,
  },
  scopeCard: {
    backgroundColor: palette.panel,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  scopeTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
  },
  scopeList: {
    gap: spacing.md,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scopeLabel: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryAction: {
    flex: 1,
    minHeight: 54,
    borderRadius: radius.sm,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    ...shadows.soft,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 54,
    borderRadius: radius.sm,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionText: {
    fontWeight: typography.weight.bold,
  },
  softShadow: {
    shadowColor: '#17231B',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
});
