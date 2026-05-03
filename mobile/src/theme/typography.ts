export const fontFamily = {
  headline: 'Manrope_700Bold',
  headlineMedium: 'Manrope_600SemiBold',
  body: 'PublicSans_400Regular',
  bodyMedium: 'PublicSans_500Medium',
  label: 'PublicSans_600SemiBold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamily.headline,
    fontSize: 44,
    lineHeight: 52,
  },
  title1: {
    fontFamily: fontFamily.headline,
    fontSize: 32,
    lineHeight: 40,
  },
  title2: {
    fontFamily: fontFamily.headlineMedium,
    fontSize: 24,
    lineHeight: 32,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: fontFamily.label,
    fontSize: 14,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export type TypographyToken = typeof typography;
