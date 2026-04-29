import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme';

interface AppCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({ children, style }: AppCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
});
