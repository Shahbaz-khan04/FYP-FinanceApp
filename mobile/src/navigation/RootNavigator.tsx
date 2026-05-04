import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { BudgetEditorScreen } from '../screens/BudgetEditorScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { GoalEditorScreen } from '../screens/GoalEditorScreen';
import { GoalDetailScreen } from '../screens/GoalDetailScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ForecastScreen } from '../screens/ForecastScreen';
import { RecurringEditorScreen } from '../screens/RecurringEditorScreen';
import { RecurringScreen } from '../screens/RecurringScreen';
import { theme } from '../theme';
import type { TransactionItem } from '../types/transaction';
import type { BudgetItem } from '../types/budget';
import type { GoalItem } from '../types/goal';
import type { RecurringRule } from '../types/recurring';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  Transactions: undefined;
  Categories: undefined;
  Budgets: undefined;
  BudgetEditor: { month: string; budget?: BudgetItem };
  Goals: undefined;
  GoalEditor: { goal?: GoalItem } | undefined;
  GoalDetail: { goal: GoalItem };
  Reports: undefined;
  Forecast: undefined;
  Recurring: undefined;
  RecurringEditor: { rule?: RecurringRule } | undefined;
  AddTransaction: undefined;
  TransactionDetail: { transaction: TransactionItem };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background.app,
    card: theme.colors.background.surface,
    text: theme.colors.text.primary,
    border: theme.colors.border.subtle,
    primary: theme.colors.brand.primary,
    notification: theme.colors.brand.tertiary,
  },
};

export const RootNavigator = () => {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background.app,
        }}
      >
        <ActivityIndicator color={theme.colors.brand.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background.surface },
          headerTintColor: theme.colors.text.primary,
          contentStyle: { backgroundColor: theme.colors.background.app },
          headerTitleStyle: {
            fontFamily: theme.typography.title2.fontFamily,
            fontSize: 18,
          },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Sign Up' }} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ title: 'Forgot Password' }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Reset Password' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={DashboardScreen} options={{ title: 'Dashboard' }} />
            <Stack.Screen
              name="Transactions"
              component={TransactionsScreen}
              options={{ title: 'Transactions' }}
            />
            <Stack.Screen
              name="Categories"
              component={CategoriesScreen}
              options={{ title: 'Categories' }}
            />
            <Stack.Screen
              name="Budgets"
              component={BudgetsScreen}
              options={{ title: 'Budgets' }}
            />
            <Stack.Screen
              name="BudgetEditor"
              component={BudgetEditorScreen}
              options={{ title: 'Budget' }}
            />
            <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: 'Goals' }} />
            <Stack.Screen
              name="GoalEditor"
              component={GoalEditorScreen}
              options={{ title: 'Goal' }}
            />
            <Stack.Screen
              name="GoalDetail"
              component={GoalDetailScreen}
              options={{ title: 'Goal Detail' }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{ title: 'Reports' }}
            />
            <Stack.Screen
              name="Forecast"
              component={ForecastScreen}
              options={{ title: 'Forecast' }}
            />
            <Stack.Screen
              name="Recurring"
              component={RecurringScreen}
              options={{ title: 'Recurring' }}
            />
            <Stack.Screen
              name="RecurringEditor"
              component={RecurringEditorScreen}
              options={{ title: 'Recurring Rule' }}
            />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{ title: 'Add Transaction' }}
            />
            <Stack.Screen
              name="TransactionDetail"
              component={TransactionDetailScreen}
              options={{ title: 'Edit Transaction' }}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
