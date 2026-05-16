import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { googleAuth } from '../lib/googleAuth';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Field, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export const SignupScreen = ({ navigation }: Props) => {
  const { signUp, signInWithGoogle } = useAuth();
  const { request: googleRequest, promptAsync: promptGoogle } = googleAuth.useGoogleIdTokenRequest();
  const googleConfigured = googleAuth.isConfigured();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignup = async () => {
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    const emailValue = email.trim();
    const phoneValue = phone.trim();
    if (!emailValue && !phoneValue) {
      setError('Enter email or phone');
      return;
    }
    if (emailValue && !emailValue.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    if (phoneValue && phoneValue.length < 6) {
      setError('Phone must be at least 6 characters');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await signUp({
        name: name.trim(),
        ...(emailValue ? { email: emailValue } : {}),
        ...(phoneValue ? { phone: phoneValue } : {}),
        password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleSignup = async () => {
    if (!googleConfigured) {
      setError('Google sign up is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and restart Expo.');
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
      await signInWithGoogle({ idToken, ...(phone.trim() ? { phone: phone.trim() } : {}) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? (
        <Text style={{ color: theme.colors.state.danger, marginBottom: theme.spacing[2] }}>{error}</Text>
      ) : null}
      <ActionButton label={isSubmitting ? 'Creating account...' : 'Create account'} onPress={onSignup} disabled={isSubmitting} />
      <ActionButton
        label={isSubmitting ? 'Please wait...' : 'Sign up with Google'}
        onPress={onGoogleSignup}
        variant="secondary"
        disabled={isSubmitting}
      />
      <ActionButton label="Back to login" onPress={() => navigation.navigate('Login')} variant="secondary" />
    </Screen>
  );
};
