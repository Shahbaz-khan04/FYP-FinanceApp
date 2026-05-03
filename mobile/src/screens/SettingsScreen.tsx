import { useMemo, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { ActionButton, Screen } from './common';

export const SettingsScreen = () => {
  const { user, updateSettings } = useAuth();
  const defaults = useMemo(
    () => user?.settings ?? { notificationsEnabled: true, theme: 'dark' as const },
    [user?.settings],
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(defaults.notificationsEnabled);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSave = async () => {
    try {
      setMessage('');
      setError('');
      await updateSettings({
        notificationsEnabled,
        theme: 'dark',
      });
      setMessage('Settings updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Settings update failed');
    }
  };

  return (
    <Screen>
      <View
        style={{
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[3],
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ ...theme.typography.body, color: theme.colors.text.primary }}>
          Notifications
        </Text>
        <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
      </View>
      {error ? (
        <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[3] }}>{error}</Text>
      ) : null}
      {message ? (
        <Text style={{ color: theme.colors.state.success, marginTop: theme.spacing[3] }}>
          {message}
        </Text>
      ) : null}
      <ActionButton label="Save settings" onPress={onSave} />
    </Screen>
  );
};
