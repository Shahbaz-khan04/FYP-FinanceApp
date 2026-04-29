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
        tabBarInactiveTintColor: colors.brandSecondary,
        tabBarStyle: {
          position: 'absolute',
          left: spacing.md,
          right: spacing.md,
          bottom: spacing.lg,
          borderTopWidth: 0,
          backgroundColor: colors.neutral,
          borderRadius: radius.xl,
          height: 72,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
          ...shadows.card,
        },
        tabBarLabelStyle: {
          fontSize: typography.size.xs,
          fontWeight: typography.weight.semibold,
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
          borderRadius: radius.md,
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
        }}
      />
      <Tab.Screen
        name="ScanReceipt"
        component={ScanReceiptScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
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
