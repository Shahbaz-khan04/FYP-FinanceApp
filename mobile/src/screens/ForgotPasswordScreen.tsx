import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Field, Screen } from './common';

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
    <Screen>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      {error ? <Text style={{ color: theme.colors.state.danger }}>{error}</Text> : null}
      {message ? <Text style={{ color: theme.colors.state.success }}>{message}</Text> : null}
      <ActionButton
        label={isSubmitting ? 'Requesting...' : 'Request reset token'}
        onPress={onRequest}
        disabled={isSubmitting}
      />
      <ActionButton label="Go to reset screen" onPress={() => navigation.navigate('ResetPassword')} variant="secondary" />
    </Screen>
  );
};
