import { type PropsWithChildren } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../theme';

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};
