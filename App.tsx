import 'react-native-gesture-handler';

import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { TransactionsProvider } from './src/context/TransactionsContext';
import { AppTabs } from './src/navigation/AppTabs';
import { colors } from './src/theme';

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    text: colors.textPrimary,
    primary: colors.brandPrimary,
    notification: colors.warning,
  },
};

export default function App() {
  return (
    <TransactionsProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style="dark" />
        <AppTabs />
      </NavigationContainer>
    </TransactionsProvider>
  );
}
