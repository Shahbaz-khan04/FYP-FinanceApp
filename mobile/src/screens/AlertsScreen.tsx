import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { alertsApi } from '../lib/alertsApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { AnomalyAlert } from '../types/alert';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Alerts'>;

const severityColor = (severity: AnomalyAlert['severity']) => {
  if (severity === 'high') return theme.colors.state.danger;
  if (severity === 'medium') return theme.colors.state.warning;
  return theme.colors.state.success;
};

export const AlertsScreen = (_props: Props) => {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [error, setError] = useState('');
  const [includeDismissed, setIncludeDismissed] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      setAlerts(await alertsApi.list(token, includeDismissed));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    }
  }, [includeDismissed, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const dismiss = useCallback(
    async (alertId: string) => {
      if (!token) return;
      try {
        await alertsApi.dismiss(token, alertId);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to dismiss alert');
      }
    },
    [load, token],
  );

  const scanNow = useCallback(async () => {
    if (!token) return;
    try {
      setScanMessage('');
      const result = await alertsApi.detect(token);
      setScanMessage(`Scanned ${result.scanned} transactions`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan anomalies');
    }
  }, [load, token]);

  return (
    <Screen>
      <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>Alert Center</Text>
      <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
        Unusual spending and duplicate-like transactions
      </Text>

      <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[3] }}>
        <Pressable
          onPress={() => setIncludeDismissed((prev) => !prev)}
          style={{
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
            borderRadius: theme.radius.md,
            backgroundColor: includeDismissed ? theme.colors.brand.secondary : theme.colors.background.surface,
          }}
        >
          <Text style={{ color: theme.colors.text.primary }}>
            {includeDismissed ? 'Showing all' : 'Only open alerts'}
          </Text>
        </Pressable>
      </View>

      <ActionButton label="Scan anomalies now" onPress={scanNow} />
      {scanMessage ? <Text style={{ color: theme.colors.text.secondary }}>{scanMessage}</Text> : null}
      {error ? <Text style={{ color: theme.colors.state.danger }}>{error}</Text> : null}

      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {alerts.map((alert) => (
          <View
            key={alert.id}
            style={{
              backgroundColor: theme.colors.background.surface,
              borderColor: severityColor(alert.severity),
              borderWidth: 1,
              borderRadius: theme.radius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}
          >
            <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>{alert.title}</Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              {alert.message}
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted, marginTop: theme.spacing[1] }}>
              Severity: {alert.severity.toUpperCase()} • {alert.createdAt.slice(0, 10)}
            </Text>
            {!alert.isDismissed ? (
              <ActionButton label="Dismiss" onPress={() => dismiss(alert.id)} variant="secondary" />
            ) : null}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};
