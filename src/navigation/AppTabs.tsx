import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors, radius, shadows, spacing, typography } from '../theme';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ScanReceiptScreen } from '../screens/ScanReceiptScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';

export type RootTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Budgets: undefined;
  Reports: undefined;
  Help: undefined;
  AddTransaction: undefined;
  ScanReceipt: undefined;
  TransactionDetail: { transactionId: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const iconByRoute: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Transactions: 'swap-horizontal-outline',
  Budgets: 'wallet-outline',
  Reports: 'bar-chart-outline',
  Help: 'help-circle-outline',
  AddTransaction: 'add-circle-outline',
  ScanReceipt: 'receipt-outline',
  TransactionDetail: 'document-text-outline',
};

const iconFocusedByRoute: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Transactions: 'swap-horizontal',
  Budgets: 'wallet',
  Reports: 'bar-chart',
  Help: 'help-circle',
  AddTransaction: 'add-circle',
  ScanReceipt: 'receipt',
  TransactionDetail: 'document-text',
};

export function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: '#A4AAA4',
        tabBarStyle: {
          position: 'absolute',
          left: spacing.lg,
          right: spacing.lg,
          bottom: spacing.md,
          borderTopWidth: 0,
          backgroundColor: colors.neutral,
          borderRadius: radius.lg,
          height: 70,
          paddingBottom: spacing.xs,
          paddingTop: spacing.xs,
          borderWidth: 1,
          borderColor: 'rgba(27, 67, 50, 0.08)',
          ...shadows.card,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: typography.weight.semibold,
          textTransform: 'uppercase',
          marginBottom: spacing.xxs,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? iconFocusedByRoute[route.name as keyof RootTabParamList] : iconByRoute[route.name as keyof RootTabParamList]}
            size={size}
            color={color}
          />
        ),
        tabBarItemStyle: {
          marginHorizontal: 2,
          borderRadius: radius.sm,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Help" component={HelpScreen} />
      <Tab.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="ScanReceipt"
        component={ScanReceiptScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}
