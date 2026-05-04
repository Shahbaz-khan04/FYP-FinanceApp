import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Field, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await signIn({ email: email.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? (
        <Text style={{ color: theme.colors.state.danger, marginBottom: theme.spacing[2] }}>{error}</Text>
      ) : null}
      <ActionButton label={isSubmitting ? 'Logging in...' : 'Login'} onPress={onLogin} disabled={isSubmitting} />
      <ActionButton label="Create account" onPress={() => navigation.navigate('Signup')} variant="secondary" />
      <ActionButton
        label="Forgot password"
        onPress={() => navigation.navigate('ForgotPassword')}
        variant="secondary"
      />
    </Screen>
  );
};
