export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 18,
  pill: 999,
} as const;

export type RadiusToken = typeof radius;
