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
import { googleAuth } from '../lib/googleAuth';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const { signIn, signInWithGoogle } = useAuth();
  const { request: googleRequest, promptAsync: promptGoogle } = googleAuth.useGoogleIdTokenRequest();
  const googleConfigured = googleAuth.isConfigured();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogin = async () => {
    if (!identifier.trim()) {
      setError('Enter your email or phone');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await signIn({ identifier: identifier.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogle = async () => {
    if (!googleConfigured) {
      setError('Google login is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and restart Expo.');
      return;
    }
    if (!googleRequest) {
      setError('Google auth is still initializing. Try again in a second.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      const result = await promptGoogle();
      if (result.type !== 'success') return;
      const idToken =
        result.authentication?.idToken ??
        (result as { params?: Record<string, string | undefined> }).params?.id_token ??
        null;
      if (!idToken) {
        throw new Error('Google sign-in did not return an ID token');
      }
      await signInWithGoogle({ idToken });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
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
        <Text style={styles.subtitle}>Enter your credentials to access your secure vault</Text>

        <View style={styles.card}>
          <Text style={styles.label}>IDENTIFIER</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="at-outline" size={22} color="#7f8f9b" />
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              style={styles.input}
              placeholder="Email or Phone"
              placeholderTextColor="#50616f"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>KEY</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#7f8f9b" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#50616f"
              secureTextEntry
              autoCapitalize="none"
            />
            <Ionicons name="eye-outline" size={24} color="#7f8f9b" />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={onLogin}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Logging in...' : 'Login'}</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onGoogle}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.googleButton, (pressed || isSubmitting) && styles.pressed]}
          >
            <Ionicons name="logo-google" size={22} color="#1ad9ff" />
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.linkInline}>Create account</Text>
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
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'capitalize',
    textShadowColor: 'rgba(32, 231, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    marginTop: 92,
    marginBottom: 24,
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
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
  dividerRow: {
    marginTop: 26,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(149, 167, 180, 0.2)',
  },
  dividerText: {
    color: '#4f6472',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  googleButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(149, 167, 180, 0.22)',
    minHeight: 42,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 14, 30, 0.65)',
  },
  link: {
    marginTop: 26,
    textAlign: 'center',
    color: '#1fdfff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerText: {
    marginTop: 14,
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
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
