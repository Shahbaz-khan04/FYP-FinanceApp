import {
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts as useManropeFonts,
} from '@expo-google-fonts/manrope';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  useFonts as usePublicSansFonts,
} from '@expo-google-fonts/public-sans';

export const useAppFonts = () => {
  const [manropeLoaded] = useManropeFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const [publicSansLoaded] = usePublicSansFonts({
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
  });

  return manropeLoaded && publicSansLoaded;
};
