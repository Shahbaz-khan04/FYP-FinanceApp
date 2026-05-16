import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { googleAuth } from '../lib/googleAuth';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Field, Screen } from './common';

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
    <Screen>
      <Field label="Email or Phone" value={identifier} onChangeText={setIdentifier} />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? (
        <Text style={{ color: theme.colors.state.danger, marginBottom: theme.spacing[2] }}>{error}</Text>
      ) : null}
      <ActionButton label={isSubmitting ? 'Logging in...' : 'Login'} onPress={onLogin} disabled={isSubmitting} />
      <ActionButton
        label={isSubmitting ? 'Please wait...' : 'Continue with Google'}
        onPress={onGoogle}
        variant="secondary"
        disabled={isSubmitting}
      />
      <ActionButton label="Create account" onPress={() => navigation.navigate('Signup')} variant="secondary" />
      <ActionButton
        label="Forgot password"
        onPress={() => navigation.navigate('ForgotPassword')}
        variant="secondary"
      />
    </Screen>
  );
};
