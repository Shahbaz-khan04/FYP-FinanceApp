import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const iconNameMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  circle: 'circle-outline',
  wallet: 'wallet-outline',
  briefcase: 'briefcase-outline',
  chart: 'chart-line',
  'trending-up': 'trending-up',
  gift: 'gift-outline',
  utensils: 'silverware-fork-knife',
  car: 'car-outline',
  home: 'home-outline',
  receipt: 'receipt-text-outline',
  'shopping-bag': 'shopping-outline',
  heart: 'heart-outline',
  film: 'movie-open-outline',
  building: 'office-building-outline',
};

export const CategoryIcon = ({
  icon,
  color,
  size = 16,
}: {
  icon: string;
  color?: string;
  size?: number;
}) => {
  const name = iconNameMap[icon] ?? 'shape-outline';
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color ?? theme.colors.text.primary}
    />
  );
};

