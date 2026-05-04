import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { notificationsApi } from '../lib/notificationsApi';
import { useAuth } from './AuthContext';

const SEEN_NOTIFICATION_IDS_KEY = 'seen_notification_ids_v1';

type NotificationContextValue = {
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') return;
    if (!user?.settings.notificationsEnabled) return;
    const perms = await Notifications.getPermissionsAsync();
    if (perms.granted) return;
    await Notifications.requestPermissionsAsync();
  }, [user?.settings.notificationsEnabled]);

  const pushLocalForNew = useCallback(
    async (items: Array<{ id: string; title: string; message: string }>) => {
      if (Platform.OS === 'web') return;
      const seenRaw = await AsyncStorage.getItem(SEEN_NOTIFICATION_IDS_KEY);
      const seen = new Set<string>(seenRaw ? (JSON.parse(seenRaw) as string[]) : []);
      let changed = false;
      for (const item of items) {
        if (seen.has(item.id)) continue;
        await Notifications.scheduleNotificationAsync({
          content: { title: item.title, body: item.message },
          trigger: null,
        });
        seen.add(item.id);
        changed = true;
      }
      if (changed) {
        await AsyncStorage.setItem(SEEN_NOTIFICATION_IDS_KEY, JSON.stringify(Array.from(seen)));
      }
    },
    [],
  );

  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    await notificationsApi.generate(token);
    const unread = await notificationsApi.list(token, false);
    setUnreadCount(unread.length);
    if (user?.settings.notificationsEnabled) {
      await pushLocalForNew(unread.map((item) => ({ id: item.id, title: item.title, message: item.message })));
    }
  }, [pushLocalForNew, token, user?.settings.notificationsEnabled]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    refreshNotifications();
    const id = setInterval(() => {
      refreshNotifications().catch(() => undefined);
    }, 60_000);
    return () => clearInterval(id);
  }, [refreshNotifications]);

  const value = useMemo<NotificationContextValue>(
    () => ({ unreadCount, refreshNotifications }),
    [unreadCount, refreshNotifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotificationCenter = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationCenter must be used within NotificationProvider');
  return context;
};
