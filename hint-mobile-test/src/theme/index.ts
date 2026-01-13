/**
 * Hint Mobile - Theme Configuration
 * React Native Paper theme setup
 */

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';

// Font configuration
const fontConfig = {
  displayLarge: { fontFamily: 'System', fontWeight: '400' as const },
  displayMedium: { fontFamily: 'System', fontWeight: '400' as const },
  displaySmall: { fontFamily: 'System', fontWeight: '400' as const },
  headlineLarge: { fontFamily: 'System', fontWeight: '600' as const },
  headlineMedium: { fontFamily: 'System', fontWeight: '600' as const },
  headlineSmall: { fontFamily: 'System', fontWeight: '600' as const },
  titleLarge: { fontFamily: 'System', fontWeight: '600' as const },
  titleMedium: { fontFamily: 'System', fontWeight: '500' as const },
  titleSmall: { fontFamily: 'System', fontWeight: '500' as const },
  bodyLarge: { fontFamily: 'System', fontWeight: '400' as const },
  bodyMedium: { fontFamily: 'System', fontWeight: '400' as const },
  bodySmall: { fontFamily: 'System', fontWeight: '400' as const },
  labelLarge: { fontFamily: 'System', fontWeight: '500' as const },
  labelMedium: { fontFamily: 'System', fontWeight: '500' as const },
  labelSmall: { fontFamily: 'System', fontWeight: '500' as const },
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[600],
    primaryContainer: colors.primary[100],
    onPrimaryContainer: colors.primary[900],
    secondary: colors.secondary[600],
    secondaryContainer: colors.secondary[100],
    onSecondaryContainer: colors.secondary[900],
    tertiary: colors.primary[500],
    tertiaryContainer: colors.primary[50],
    surface: colors.surface.light,
    surfaceVariant: colors.neutral[100],
    background: colors.background.light,
    error: colors.error[600],
    errorContainer: colors.error[100],
    onErrorContainer: colors.error[900],
    outline: colors.neutral[300],
    outlineVariant: colors.neutral[200],
    shadow: colors.black,
    scrim: colors.black,
    inverseSurface: colors.neutral[900],
    inverseOnSurface: colors.neutral[50],
    inversePrimary: colors.primary[300],
    elevation: {
      level0: 'transparent',
      level1: colors.neutral[50],
      level2: colors.neutral[100],
      level3: colors.neutral[100],
      level4: colors.neutral[200],
      level5: colors.neutral[200],
    },
    // Custom colors
    success: colors.success[600],
    successContainer: colors.success[100],
    warning: colors.warning[600],
    warningContainer: colors.warning[100],
    priceDown: colors.price.drop,
    priceUp: colors.price.increase,
  },
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary[400],
    primaryContainer: colors.primary[800],
    onPrimaryContainer: colors.primary[100],
    secondary: colors.secondary[400],
    secondaryContainer: colors.secondary[800],
    onSecondaryContainer: colors.secondary[100],
    tertiary: colors.primary[300],
    tertiaryContainer: colors.primary[900],
    surface: colors.surface.dark,
    surfaceVariant: colors.neutral[800],
    background: colors.background.dark,
    error: colors.error[400],
    errorContainer: colors.error[900],
    onErrorContainer: colors.error[100],
    outline: colors.neutral[600],
    outlineVariant: colors.neutral[700],
    shadow: colors.black,
    scrim: colors.black,
    inverseSurface: colors.neutral[100],
    inverseOnSurface: colors.neutral[900],
    inversePrimary: colors.primary[700],
    elevation: {
      level0: 'transparent',
      level1: colors.neutral[800],
      level2: colors.neutral[700],
      level3: colors.neutral[700],
      level4: colors.neutral[600],
      level5: colors.neutral[600],
    },
    // Custom colors
    success: colors.success[500],
    successContainer: colors.success[700],
    warning: colors.warning[500],
    warningContainer: colors.warning[700],
    priceDown: colors.price.drop,
    priceUp: colors.price.increase,
  },
};

export type AppTheme = typeof lightTheme;
