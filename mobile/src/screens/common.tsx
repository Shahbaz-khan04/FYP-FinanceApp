import { type PropsWithChildren } from 'react';
import { Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';

export const Screen = ({ children }: PropsWithChildren) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.app }}>
    <View style={{ flex: 1, paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] }}>
      {children}
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
  <View style={{ marginBottom: theme.spacing[3] }}>
    <Text
      style={{
        ...theme.typography.label,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing[1],
      }}
    >
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize="none"
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[3],
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.background.surface,
      }}
    />
  </View>
);

export const ActionButton = ({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) => (
  <Pressable
    onPress={onPress}
    style={{
      backgroundColor:
        variant === 'primary' ? theme.colors.brand.primary : theme.colors.background.surfaceRaised,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing[3],
      alignItems: 'center',
      marginTop: theme.spacing[2],
    }}
  >
    <Text
      style={{
        ...theme.typography.label,
        color: variant === 'primary' ? theme.colors.text.inverse : theme.colors.text.primary,
      }}
    >
      {label}
    </Text>
  </Pressable>
);
