import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { goalApi } from '../lib/goalApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Field, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalEditor'>;

export const GoalEditorScreen = ({ route, navigation }: Props) => {
  const { token } = useAuth();
  const existing = route.params?.goal;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [targetAmount, setTargetAmount] = useState(existing ? String(existing.targetAmount) : '');
  const [savedAmount, setSavedAmount] = useState(existing ? String(existing.savedAmount) : '0');
  const [deadline, setDeadline] = useState(existing?.deadline ?? new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const onSave = async () => {
    if (!token) return;
    try {
      setError('');
      const payload = {
        title: title.trim(),
        targetAmount: Number(targetAmount),
        savedAmount: Number(savedAmount),
        deadline,
      };
      if (existing) {
        await goalApi.update(token, existing.id, payload);
      } else {
        await goalApi.create(token, payload);
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    }
  };

  return (
    <Screen>
      <Field label="Goal title" value={title} onChangeText={setTitle} />
      <Field label="Target amount" value={targetAmount} onChangeText={setTargetAmount} />
      <Field label="Current saved amount" value={savedAmount} onChangeText={setSavedAmount} />
      <Field label="Deadline (YYYY-MM-DD)" value={deadline} onChangeText={setDeadline} />
      {error ? <Text style={{ color: theme.colors.state.danger }}>{error}</Text> : null}
      <ActionButton label={existing ? 'Save Changes' : 'Create Goal'} onPress={onSave} />
    </Screen>
  );
};

