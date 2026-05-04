import { darkColors, lightColors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const makeTheme = (mode: 'dark' | 'light') => ({
  colors: mode === 'dark' ? darkColors : lightColors,
  spacing,
  radius,
  shadows,
  typography,
} as const);

export let theme = makeTheme('dark');

export const setActiveTheme = (mode: 'dark' | 'light') => {
  theme = makeTheme(mode);
};

export type AppTheme = typeof theme;
