export const colors = {
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

export type ColorToken = typeof colors;
