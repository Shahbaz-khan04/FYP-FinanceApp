import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const tabs: Array<{ key: keyof RootStackParamList; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'Home', label: 'DASHBOARD', icon: 'grid-outline' },
  { key: 'Transactions', label: 'TRANSACTIONS', icon: 'receipt-outline' },
  { key: 'Budgets', label: 'BUDGETS', icon: 'pie-chart-outline' },
  { key: 'Goals', label: 'GOALS', icon: 'radio-button-on-outline' },
  { key: 'Settings', label: 'SETTINGS', icon: 'settings-outline' },
];

export const AppTabBar = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const active = route.name === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.bottomNavItem}
            onPress={() => navigation.navigate(tab.key as never)}
          >
            <Ionicons name={tab.icon} size={14} color={active ? '#14dff8' : '#7f909d'} />
            <Text style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(154, 170, 184, 0.2)',
    backgroundColor: 'rgba(12, 20, 34, 0.9)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bottomNavLabel: {
    color: '#778997',
    fontSize: 9,
    fontWeight: '700',
  },
  bottomNavLabelActive: {
    color: '#c6f9ff',
  },
});
