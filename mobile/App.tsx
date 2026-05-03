import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProviders } from './src/providers/AppProviders';
import { theme, useAppFonts } from './src/theme';

export default function App() {
  const fontsLoaded = useAppFonts();

  return (
    <AppProviders>
      {fontsLoaded ? <RootNavigator /> : <View style={{ flex: 1, backgroundColor: theme.colors.background.app }} />}
      <StatusBar style="light" />
    </AppProviders>
  );
}
