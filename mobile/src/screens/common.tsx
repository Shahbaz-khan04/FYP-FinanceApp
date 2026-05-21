import { type PropsWithChildren } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppTabBar } from '../components/AppTabBar';
import { theme } from '../theme';

export const Screen = ({ children, showTabBar = true }: PropsWithChildren<{ showTabBar?: boolean }>) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.backgroundGlowTop} pointerEvents="none" />
    <View style={styles.backgroundGlowBottom} pointerEvents="none" />
    <View style={styles.content}>
      {children}
      {showTabBar ? <AppTabBar /> : null}
    </View>
  </SafeAreaView>
);

export const Field = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize="none"
      placeholderTextColor={theme.colors.text.muted}
      style={styles.fieldInput}
    />
  </View>
);

export const ActionButton = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.buttonBase,
      variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
      (disabled || pressed) && styles.buttonPressed,
    ]}
  >
    <Text style={[styles.buttonText, variant === 'primary' ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>
      {label}
    </Text>
  </Pressable>
);

export const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.emptyWrap}>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[3],
  },
  backgroundGlowTop: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: theme.radius.pill,
    top: -100,
    right: -40,
    backgroundColor: 'rgba(122, 162, 255, 0.25)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: theme.radius.pill,
    bottom: -100,
    left: -60,
    backgroundColor: 'rgba(86, 255, 225, 0.2)',
  },
  fieldWrap: {
    marginBottom: theme.spacing[3],
  },
  fieldLabel: {
    ...theme.typography.label,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
    letterSpacing: 0.25,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.surface,
    ...theme.shadows.raised,
  },
  buttonBase: {
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing[3],
    alignItems: 'center',
    marginTop: theme.spacing[2],
    borderWidth: 1,
    ...theme.shadows.raised,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  buttonSecondary: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.strong,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    ...theme.typography.label,
    letterSpacing: 0.35,
  },
  buttonTextPrimary: {
    color: theme.colors.text.inverse,
  },
  buttonTextSecondary: {
    color: theme.colors.text.primary,
  },
  emptyWrap: {
    marginTop: theme.spacing[3],
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: theme.spacing[4],
    ...theme.shadows.raised,
  },
  emptyTitle: {
    ...theme.typography.label,
    color: theme.colors.text.primary,
  },
  emptySubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
});
