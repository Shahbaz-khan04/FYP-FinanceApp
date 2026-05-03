import { useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { ActionButton, Field, Screen } from './common';

export const ResetPasswordScreen = () => {
  const { resetPassword } = useAuth();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onReset = async () => {
    try {
      setError('');
      setMessage('');
      await resetPassword(token, newPassword);
      setMessage('Password reset successful');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  return (
    <Screen>
      <Field label="Reset token" value={token} onChangeText={setToken} />
      <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      {error ? <Text style={{ color: theme.colors.state.danger }}>{error}</Text> : null}
      {message ? <Text style={{ color: theme.colors.state.success }}>{message}</Text> : null}
      <ActionButton label="Reset password" onPress={onReset} />
    </Screen>
  );
};
