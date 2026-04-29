import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, ScreenContainer } from '../components/common';
import { RootTabParamList } from '../navigation/AppTabs';
import { colors, radius, spacing } from '../theme';

type ScanReceiptScreenProps = BottomTabScreenProps<RootTabParamList, 'ScanReceipt'>;

export function ScanReceiptScreen({ navigation }: ScanReceiptScreenProps) {
  return (
    <ScreenContainer style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral} />
        </Pressable>
        <View>
          <AppText variant="caption" color={colors.textMuted}>
            PLACEHOLDER
          </AppText>
          <AppText variant="title">Scan Receipt</AppText>
        </View>
      </View>

      <View style={styles.placeholder}>
        <Ionicons name="receipt-outline" size={34} color={colors.brandPrimary} />
        <AppText variant="subtitle">Receipt scanning placeholder</AppText>
        <AppText color={colors.textSecondary} style={styles.copy}>
          OCR and camera behavior are intentionally deferred. This screen keeps the Home CTA flow demo-ready.
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    minHeight: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  copy: {
    maxWidth: 280,
  },
});
