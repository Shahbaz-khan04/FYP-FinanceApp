import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { helpApi } from '../lib/helpApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { FaqItem } from '../types/help';
import { Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpFaqDetail'>;

export const HelpFaqDetailScreen = ({ route }: Props) => {
  const [faq, setFaq] = useState<FaqItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setError('');
        const item = await helpApi.getFaqById(route.params.faqId);
        if (mounted) setFaq(item);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load FAQ');
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [route.params.faqId]);

  return (
    <Screen>
      <ScrollView>
        <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>
          {faq?.question ?? 'FAQ Detail'}
        </Text>
        {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
        <Text
          style={{
            ...theme.typography.body,
            color: theme.colors.text.secondary,
            marginTop: theme.spacing[3],
            lineHeight: 24,
          }}
        >
          {faq?.answer ?? 'Loading...'}
        </Text>
      </ScrollView>
    </Screen>
  );
};
