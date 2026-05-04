import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { helpApi } from '../lib/helpApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Field, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpAskQuestion'>;

export const HelpAskQuestionScreen = ({ navigation }: Props) => {
  const { token } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async () => {
    if (!token) return;
    try {
      setError('');
      setSuccess('');
      await helpApi.submitQuestion(token, {
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess('Question submitted successfully');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit question');
    }
  };

  return (
    <Screen>
      <Field label="Subject" value={subject} onChangeText={setSubject} />
      <Text style={{ ...theme.typography.label, color: theme.colors.text.secondary, marginBottom: theme.spacing[1] }}>
        Message
      </Text>
      <TextInput
        multiline
        value={message}
        onChangeText={setMessage}
        placeholder="Describe your issue"
        placeholderTextColor={theme.colors.text.muted}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[3],
          minHeight: 140,
          textAlignVertical: 'top',
          color: theme.colors.text.primary,
          backgroundColor: theme.colors.background.surface,
        }}
      />
      {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
      {success ? <Text style={{ color: theme.colors.state.success, marginTop: theme.spacing[2] }}>{success}</Text> : null}
      <ActionButton label="Submit Question" onPress={onSubmit} />
      <ActionButton label="Go to My Questions" onPress={() => navigation.navigate('HelpMyQuestions')} variant="secondary" />
    </Screen>
  );
};
