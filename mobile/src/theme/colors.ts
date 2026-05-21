export const darkColors = {
  brand: {
    primary: '#56FFE1',
    secondary: '#7AA2FF',
    tertiary: '#2DE38A',
  },
  background: {
    app: '#040711',
    surface: '#0B1423',
    surfaceRaised: '#121F35',
    overlay: 'rgba(4, 7, 17, 0.78)',
  },
  text: {
    primary: '#EAF2FF',
    secondary: '#B6C8E5',
    muted: '#7F91AD',
    inverse: '#04101D',
  },
  border: {
    subtle: '#1E3252',
    strong: '#355B8F',
  },
  state: {
    success: '#54F0A4',
    warning: '#FFD37A',
    danger: '#FF7D95',
    info: '#8BA8FF',
  },
  neutral: {
    50: '#ECF4FF',
    100: '#D7E6FC',
    200: '#B8CDEB',
    300: '#8EA5C7',
    400: '#657E9E',
    500: '#445A78',
    600: '#2C405A',
    700: '#1B2B42',
    800: '#101C30',
    900: '#091325',
    950: '#040711',
  },
} as const;

export const lightColors = {
  brand: {
    primary: '#00B7A8',
    secondary: '#386BFF',
    tertiary: '#00A262',
  },
  background: {
    app: '#EEF4FF',
    surface: '#FFFFFF',
    surfaceRaised: '#E6EEFC',
    overlay: 'rgba(8, 21, 39, 0.14)',
  },
  text: {
    primary: '#0D1A30',
    secondary: '#304E74',
    muted: '#547094',
    inverse: '#FFFFFF',
  },
  border: {
    subtle: '#CEDBF2',
    strong: '#9CB6DF',
  },
  state: {
    success: '#0E8C5B',
    warning: '#A86D05',
    danger: '#C5355A',
    info: '#2F5CE2',
  },
  neutral: {
    50: '#F7FAFF',
    100: '#EEF4FF',
    200: '#DCE7FA',
    300: '#C5D7F2',
    400: '#9FBADF',
    500: '#7A9BC2',
    600: '#5B7BA2',
    700: '#3E5C81',
    800: '#264266',
    900: '#173250',
    950: '#0A1B34',
  },
} as const;

export type ColorToken = typeof darkColors;
