import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { ActionButton, Field, Screen } from './common';

export const ProfileScreen = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
  }, [user?.name, user?.phone]);

  const onSave = async () => {
    try {
      setMessage('');
      setError('');
      await updateProfile({ name, phone });
      setMessage('Profile updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <Screen>
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.muted }}>
        Email: {user?.email ?? '-'}
      </Text>
      {error ? <Text style={{ color: theme.colors.state.danger }}>{error}</Text> : null}
      {message ? <Text style={{ color: theme.colors.state.success }}>{message}</Text> : null}
      <ActionButton label="Save profile" onPress={onSave} />
    </Screen>
  );
};
