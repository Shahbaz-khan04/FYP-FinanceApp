import { Ionicons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const { requestResetToken } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRequest = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      const resetToken = await requestResetToken(email.trim());
      const tokenInfo = resetToken ? ` Dev token: ${resetToken}` : '';
      setMessage(`Reset flow started.${tokenInfo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgGlowLeft} pointerEvents="none" />
      <View style={styles.bgGlowBottom} pointerEvents="none" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Moneylens</Text>
        <Text style={styles.subtitle}>Recover your vault key</Text>

        <View style={styles.card}>
          <Text style={styles.label}>IDENTIFIER</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={22} color="#7f8f9b" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#50616f"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={onRequest}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Requesting...' : 'Request reset token'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ResetPassword')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Go to reset screen</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerText}>
            Back to <Text style={styles.linkInline}>Login</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050914',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 30,
  },
  bgGlowLeft: {
    position: 'absolute',
    left: -140,
    top: 120,
    width: 300,
    height: 520,
    borderRadius: 999,
    backgroundColor: 'rgba(14, 201, 233, 0.11)',
  },
  bgGlowBottom: {
    position: 'absolute',
    right: -120,
    bottom: -80,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(50, 42, 255, 0.12)',
  },
  brand: {
    textAlign: 'center',
    color: '#20e7ff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'capitalize',
    textShadowColor: 'rgba(32, 231, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    marginTop: 48,
    marginBottom: 20,
    color: '#93a0aa',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    paddingHorizontal: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(149, 167, 180, 0.2)',
    backgroundColor: 'rgba(4, 10, 25, 0.86)',
    padding: 14,
  },
  label: {
    color: '#afbcc7',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  inputWrap: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(149, 167, 180, 0.26)',
    borderRadius: 10,
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 31, 46, 0.35)',
  },
  input: {
    flex: 1,
    color: '#e8f3fd',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 12,
    minHeight: 44,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#21d8f8',
    shadowColor: '#1edbff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.55,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#002239',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(149, 167, 180, 0.22)',
    minHeight: 42,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 14, 30, 0.65)',
  },
  secondaryButtonText: {
    color: '#a7b8c4',
    fontSize: 14,
    fontWeight: '700',
  },
  footerText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#90a0ad',
    fontSize: 14,
    fontWeight: '600',
  },
  linkInline: {
    color: '#1fdfff',
    fontWeight: '800',
  },
  error: {
    color: '#ff7f89',
    marginTop: 2,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  success: {
    color: '#65f2c0',
    marginTop: 2,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
