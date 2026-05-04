export const darkColors = {
  brand: {
    primary: '#00E5BC',
    secondary: '#6366F1',
    tertiary: '#FFC04C',
  },
  background: {
    app: '#07110F',
    surface: '#121D1A',
    surfaceRaised: '#1B2824',
    overlay: 'rgba(7, 17, 15, 0.72)',
  },
  text: {
    primary: '#E4EEEA',
    secondary: '#B9C8C2',
    muted: '#8B9994',
    inverse: '#07110F',
  },
  border: {
    subtle: '#22322E',
    strong: '#4A5D57',
  },
  state: {
    success: '#66F2CC',
    warning: '#FFDCA8',
    danger: '#FFA39B',
    info: '#B9B8FF',
  },
  neutral: {
    50: '#EEF4F1',
    100: '#D7E1DD',
    200: '#B7C4BF',
    300: '#94A39E',
    400: '#707975',
    500: '#53605B',
    600: '#3A4540',
    700: '#26312D',
    800: '#18231F',
    900: '#0D1714',
    950: '#07110F',
  },
} as const;

export const lightColors = {
  brand: {
    primary: '#00B894',
    secondary: '#5B5BD6',
    tertiary: '#E5A72E',
  },
  background: {
    app: '#F4F9F7',
    surface: '#FFFFFF',
    surfaceRaised: '#E8F0ED',
    overlay: 'rgba(16, 22, 20, 0.14)',
  },
  text: {
    primary: '#0F1E1A',
    secondary: '#35514A',
    muted: '#5D7770',
    inverse: '#FFFFFF',
  },
  border: {
    subtle: '#D1E0DB',
    strong: '#A9C0B8',
  },
  state: {
    success: '#148866',
    warning: '#B57D0B',
    danger: '#C44B42',
    info: '#4A57D4',
  },
  neutral: {
    50: '#F8FBFA',
    100: '#F0F5F3',
    200: '#E3EDE9',
    300: '#D0DFD9',
    400: '#B9CBC4',
    500: '#94AAA2',
    600: '#6E8780',
    700: '#4C645D',
    800: '#2F433D',
    900: '#1D2F2A',
    950: '#0E1A17',
  },
} as const;

export type ColorToken = typeof darkColors;
