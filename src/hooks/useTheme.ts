import { useColorScheme } from 'react-native';
import { colors, fonts, spacing } from '../theme';

/**
 * Custom Hook: useTheme
 * Accesses design systems and returns active styling layout tokens.
 * Configured to dynamically adapt to system themes or support state-driven themes in the future.
 */
export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  
  // Future extension: Return dynamic colors based on dark mode settings
  const isDark = systemColorScheme === 'dark';

  return {
    colors,
    fonts,
    spacing,
    isDark,
  };
};

export default useTheme;
