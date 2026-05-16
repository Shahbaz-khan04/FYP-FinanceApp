import type React from 'react';
import { Platform, Text, View } from 'react-native';
import { theme } from '../theme';

type ChartKind = 'bar' | 'line' | 'doughnut';

type Props = {
  kind: ChartKind;
  title: string;
  data: Record<string, unknown>;
  options?: Record<string, unknown>;
  height?: number;
};

export const ChartCardWeb = ({ kind, title, data, options, height = 260 }: Props) => {
  if (Platform.OS !== 'web') return null;

  // Chart.js and react-chartjs-2 are only rendered on web.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('chart.js/auto');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const charts = require('react-chartjs-2') as {
    Bar: React.ComponentType<any>;
    Line: React.ComponentType<any>;
    Doughnut: React.ComponentType<any>;
  };

  const ChartComponent = kind === 'line' ? charts.Line : kind === 'doughnut' ? charts.Doughnut : charts.Bar;

  return (
    <View
      style={{
        marginTop: theme.spacing[3],
        backgroundColor: theme.colors.background.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing[3],
      }}
    >
      <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>{title}</Text>
      <View style={{ height, marginTop: theme.spacing[2] }}>
        <ChartComponent data={data} options={{ responsive: true, maintainAspectRatio: false, ...options }} />
      </View>
    </View>
  );
};
