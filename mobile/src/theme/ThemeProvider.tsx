import { createContext, type PropsWithChildren, useContext, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setActiveTheme, theme, type AppTheme } from './theme';

const ThemeContext = createContext<AppTheme>(theme);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const mode = user?.settings.theme === 'light' ? 'light' : 'dark';

  useEffect(() => {
    setActiveTheme(mode);
  }, [mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
