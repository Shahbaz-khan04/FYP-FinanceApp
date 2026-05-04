import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Field, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export const SignupScreen = ({ navigation }: Props) => {
  const { signUp } = useAuth();
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
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    if (phone.trim().length < 6) {
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
      await signUp({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? (
        <Text style={{ color: theme.colors.state.danger, marginBottom: theme.spacing[2] }}>{error}</Text>
      ) : null}
      <ActionButton label={isSubmitting ? 'Creating account...' : 'Create account'} onPress={onSignup} disabled={isSubmitting} />
      <ActionButton label="Back to login" onPress={() => navigation.navigate('Login')} variant="secondary" />
    </Screen>
  );
};
