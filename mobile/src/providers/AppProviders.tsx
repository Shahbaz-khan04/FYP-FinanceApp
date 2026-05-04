import { type PropsWithChildren } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../theme';

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
