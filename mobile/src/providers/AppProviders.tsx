import { type PropsWithChildren } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../theme';

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
};
