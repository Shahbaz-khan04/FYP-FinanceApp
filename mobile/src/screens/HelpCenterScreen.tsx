import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { helpApi } from '../lib/helpApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { FaqItem } from '../types/help';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpCenter'>;

export const HelpCenterScreen = ({ navigation }: Props) => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (searchInput?: string) => {
    try {
      setError('');
      setFaqs(await helpApi.listFaqs(searchInput));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load FAQs');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search);
    }, [load, search]),
  );

  return (
    <Screen>
      <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>Help Center</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search FAQs"
        placeholderTextColor={theme.colors.text.muted}
        style={{
          marginTop: theme.spacing[3],
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
          color: theme.colors.text.primary,
          backgroundColor: theme.colors.background.surface,
        }}
      />
      <ActionButton label="Search FAQ" onPress={() => load(search)} />
      <ActionButton label="Ask a Question" onPress={() => navigation.navigate('HelpAskQuestion')} variant="secondary" />
      <ActionButton label="My Questions" onPress={() => navigation.navigate('HelpMyQuestions')} variant="secondary" />
      {error ? <Text style={{ color: theme.colors.state.danger }}>{error}</Text> : null}

      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {faqs.map((faq) => (
          <Pressable
            key={faq.id}
            onPress={() => navigation.navigate('HelpFaqDetail', { faqId: faq.id })}
            style={{
              backgroundColor: theme.colors.background.surface,
              borderColor: theme.colors.border.subtle,
              borderWidth: 1,
              borderRadius: theme.radius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}
          >
            <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>{faq.question}</Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing[1], marginTop: theme.spacing[1], flexWrap: 'wrap' }}>
              {faq.tags.slice(0, 3).map((tag) => (
                <View
                  key={`${faq.id}-${tag}`}
                  style={{
                    backgroundColor: theme.colors.background.surfaceRaised,
                    borderRadius: theme.radius.pill,
                    paddingHorizontal: theme.spacing[2],
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ ...theme.typography.caption, color: theme.colors.text.secondary }}>{tag}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
};
