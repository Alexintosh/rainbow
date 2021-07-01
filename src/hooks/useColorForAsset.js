import { useMemo } from 'react';
import { lightModeThemeColors } from '../styles/colors';
import useImageMetadata from './useImageMetadata';
import { ETH_ADDRESS } from '@rainbow-me/references';
import {
  getTokenMetadata,
  getUrlForTrustIconFallback,
  isETH,
  pseudoRandomArrayItemFromString,
} from '@rainbow-me/utils';

export default function useColorForAsset(
  asset = {},
  fallbackColor,
  forceLightMode = false
) {
  const { isDarkMode: isDarkModeTheme, colors } = useTheme();
  const { address, color } = asset;
  const token = getTokenMetadata(address);
  // If ETH then override to appleBlue
  // because the grey color makes buttons look disabled!
  const tokenListColor =
    address === ETH_ADDRESS ? colors.appleBlue : token?.color;

  const { color: imageColor } = useImageMetadata(
    getUrlForTrustIconFallback(address)
  );

  const isDarkMode = forceLightMode || isDarkModeTheme;

  const colorDerivedFromAddress = useMemo(
    () =>
      isETH(address)
        ? isDarkMode
          ? colors.brighten(lightModeThemeColors.dark)
          : colors.dark
        : pseudoRandomArrayItemFromString(address, colors.avatarColor),
    [address, colors, isDarkMode]
  );

  return useMemo(() => {
    let color2Return;
    if (color) {
      color2Return = color;
    } else if (tokenListColor) {
      color2Return = tokenListColor;
    } else if (imageColor) {
      color2Return = imageColor;
    } else if (fallbackColor) {
      color2Return = fallbackColor;
    } else {
      color2Return = colorDerivedFromAddress;
    }
    try {
      return isDarkMode && colors.isColorDark(color2Return)
        ? colors.brighten(color2Return)
        : color2Return;
    } catch (e) {
      return color2Return;
    }
  }, [
    color,
    colorDerivedFromAddress,
    colors,
    fallbackColor,
    imageColor,
    isDarkMode,
    tokenListColor,
  ]);
}
