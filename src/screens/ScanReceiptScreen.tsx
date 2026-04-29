import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, ScreenContainer } from '../components/common';
import { RootTabParamList } from '../navigation/AppTabs';
import { radius, shadows, spacing, typography } from '../theme';

type ScanReceiptScreenProps = BottomTabScreenProps<RootTabParamList, 'ScanReceipt'>;

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

export function ScanReceiptScreen({ navigation }: ScanReceiptScreenProps) {
  return (
    <ScreenContainer style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={22} color={palette.primary} />
        </Pressable>
        <AppText variant="subtitle" color={palette.primary} style={styles.topTitle}>
          Receipt Capture
        </AppText>
      </View>

      <View style={styles.header}>
        <AppText variant="caption" color={palette.muted} style={styles.letterLabel}>
          OCR PREVIEW
        </AppText>
        <AppText variant="display" color={palette.primary} style={styles.title}>
          Scan{'\n'}Receipt
        </AppText>
      </View>

      <LinearGradient
        colors={['#1A1A18', '#363A33']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cameraCard, styles.softShadow]}
      >
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
          <Ionicons name="receipt-outline" size={72} color="#E8EFE9" />
          <AppText variant="label" color="#C8D2CB">
            Camera and OCR are deferred for frontend demo
          </AppText>
        </View>
      </LinearGradient>

      <View style={[styles.resultCard, styles.softShadow]}>
        <AppText variant="subtitle" color={palette.ink} style={styles.cardTitle}>
          Extracted Preview
        </AppText>
        <PreviewRow label="Merchant" value="Blue Bottle Coffee" />
        <PreviewRow label="Category" value="Dining & Living" />
        <PreviewRow label="Estimated Total" value="$18.40" />
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryAction} onPress={() => navigation.navigate('AddTransaction')}>
          <Ionicons name="create-outline" size={18} color={palette.paper} />
          <AppText variant="label" color={palette.paper} style={styles.actionText}>
            Create Entry
          </AppText>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="close-outline" size={18} color={palette.primary} />
          <AppText variant="label" color={palette.primary} style={styles.actionText}>
            Cancel
          </AppText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewRow}>
      <AppText variant="label" color={palette.secondary}>
        {label}
      </AppText>
      <AppText variant="label" color={palette.ink} style={styles.previewValue}>
        {value}
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
    paddingTop: spacing.md,
    paddingBottom: 130,
    gap: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.bold,
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
    fontSize: 52,
    lineHeight: 56,
  },
  cameraCard: {
    minHeight: 360,
    borderRadius: radius.md,
    padding: spacing.xl,
  },
  scanFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(249, 250, 246, 0.34)',
    borderStyle: 'dashed',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#D9EFE1',
  },
  cornerTopLeft: {
    top: 18,
    left: 18,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 18,
    right: 18,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 18,
    left: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 18,
    right: 18,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  resultCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.weight.regular,
    marginBottom: spacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  previewValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: typography.weight.bold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryAction: {
    flex: 1,
    minHeight: 56,
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
    minHeight: 56,
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
