import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { goalApi } from '../lib/goalApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalDetail'>;

export const GoalDetailScreen = ({ route, navigation }: Props) => {
  const { token } = useAuth();
  const { goal } = route.params;

  const onComplete = async () => {
    if (!token || goal.isCompleted) return;
    await goalApi.complete(token, goal.id);
    navigation.goBack();
  };

  const onDelete = async () => {
    if (!token) return;
    await goalApi.remove(token, goal.id);
    navigation.goBack();
  };

  return (
    <Screen>
      <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>{goal.title}</Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.text.secondary, marginTop: theme.spacing[2] }}>
        Saved {goal.savedAmount.toFixed(2)} / {goal.targetAmount.toFixed(2)}
      </Text>
      <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.muted }}>
        Remaining {goal.remainingAmount.toFixed(2)} • Deadline {goal.deadline}
      </Text>
      <Text style={{ ...theme.typography.bodySmall, color: goal.isCompleted ? theme.colors.state.success : theme.colors.text.secondary }}>
        Progress {goal.progressPercent.toFixed(0)}%
      </Text>
      <ActionButton label="Edit Goal" onPress={() => navigation.navigate('GoalEditor', { goal })} />
      {!goal.isCompleted ? <ActionButton label="Mark Complete" onPress={onComplete} variant="secondary" /> : null}
      <ActionButton label="Delete Goal" onPress={onDelete} variant="secondary" />
    </Screen>
  );
};

