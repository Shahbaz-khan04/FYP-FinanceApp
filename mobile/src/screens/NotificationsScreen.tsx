import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotificationCenter } from '../context/NotificationContext';
import { notificationsApi } from '../lib/notificationsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { AppNotificationItem } from '../types/notification';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export const NotificationsScreen = (_props: Props) => {
  const { token } = useAuth();
  const { refreshNotifications } = useNotificationCenter();
  const [items, setItems] = useState<AppNotificationItem[]>([]);
  const [includeRead, setIncludeRead] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      setItems(await notificationsApi.list(token, includeRead));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    }
  }, [includeRead, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      await notificationsApi.markRead(token, id);
      await load();
      await refreshNotifications();
    },
    [load, refreshNotifications, token],
  );

  const dismiss = useCallback(
    async (id: string) => {
      if (!token) return;
      await notificationsApi.dismiss(token, id);
      await load();
      await refreshNotifications();
    },
    [load, refreshNotifications, token],
  );

  const refreshAll = useCallback(async () => {
    if (!token) return;
    await notificationsApi.generate(token);
    await load();
    await refreshNotifications();
  }, [load, refreshNotifications, token]);

  return (
    <Screen>
      <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>Notification Center</Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
        <Pressable
          onPress={() => setIncludeRead((prev) => !prev)}
          style={{
            backgroundColor: includeRead ? theme.colors.brand.secondary : theme.colors.background.surface,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing[2],
            paddingHorizontal: theme.spacing[3],
          }}
        >
          <Text style={{ color: theme.colors.text.primary }}>{includeRead ? 'Showing all' : 'Unread only'}</Text>
        </Pressable>
      </View>
      <ActionButton label="Refresh notifications" onPress={refreshAll} />
      {error ? <Text style={{ color: theme.colors.state.danger }}>{error}</Text> : null}
      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: theme.colors.background.surface,
              borderWidth: 1,
              borderColor: item.isRead ? theme.colors.border.subtle : theme.colors.brand.primary,
              borderRadius: theme.radius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}
          >
            <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>{item.title}</Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              {item.message}
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted, marginTop: theme.spacing[1] }}>
              {item.createdAt.slice(0, 16).replace('T', ' ')}
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
              {!item.isRead ? <ActionButton label="Mark Read" onPress={() => markRead(item.id)} variant="secondary" /> : null}
              <ActionButton label="Dismiss" onPress={() => dismiss(item.id)} variant="secondary" />
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};
