import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { helpApi } from '../lib/helpApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import type { HelpQuestionItem } from '../types/help';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpMyQuestions'>;

const statusColor = (status: HelpQuestionItem['status']) => {
  if (status === 'answered') return theme.colors.state.success;
  if (status === 'closed') return theme.colors.state.warning;
  return theme.colors.brand.secondary;
};

export const HelpMyQuestionsScreen = ({ navigation }: Props) => {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<HelpQuestionItem[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      setQuestions(await helpApi.listMyQuestions(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <ActionButton label="Ask a New Question" onPress={() => navigation.navigate('HelpAskQuestion')} />
      {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
      <ScrollView style={{ marginTop: theme.spacing[2] }}>
        {questions.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: theme.colors.background.surface,
              borderColor: theme.colors.border.subtle,
              borderWidth: 1,
              borderRadius: theme.radius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}
          >
            <Text style={{ ...theme.typography.label, color: theme.colors.text.primary }}>{item.subject}</Text>
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing[1] }}>
              {item.message}
            </Text>
            <Text style={{ ...theme.typography.caption, color: statusColor(item.status), marginTop: theme.spacing[1] }}>
              Status: {item.status.toUpperCase()}
            </Text>
            {item.response ? (
              <>
                <Text style={{ ...theme.typography.caption, color: theme.colors.text.muted, marginTop: theme.spacing[2] }}>
                  Response
                </Text>
                <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary }}>
                  {item.response}
                </Text>
              </>
            ) : (
              <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.muted, marginTop: theme.spacing[1] }}>
                No response yet.
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};
