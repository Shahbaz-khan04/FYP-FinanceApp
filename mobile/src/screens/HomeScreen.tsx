import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();

  return (
    <Screen>
      <Text style={{ ...theme.typography.title2, color: theme.colors.text.primary }}>
        Welcome, {user?.name ?? 'User'}
      </Text>
      <Text
        style={{
          ...theme.typography.body,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing[2],
        }}
      >
        Auth is connected. Next step is transaction tracking.
      </Text>
      <ActionButton label="Profile" onPress={() => navigation.navigate('Profile')} />
      <ActionButton label="Transactions" onPress={() => navigation.navigate('Transactions')} />
      <ActionButton label="Categories" onPress={() => navigation.navigate('Categories')} />
      <ActionButton label="Settings" onPress={() => navigation.navigate('Settings')} variant="secondary" />
      <ActionButton label="Logout" onPress={logout} variant="secondary" />
    </Screen>
  );
};
