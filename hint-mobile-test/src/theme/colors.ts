/**
 * Hint Mobile - Color Palette
 * Matches the extension's green design system
 */

export const colors = {
  // Primary palette (green - matches hint branding #228855)
  primary: {
    50: '#f0f9f4',
    100: '#d1f0df',
    200: '#a3e1bf',
    300: '#6dcc99',
    400: '#40b574',
    500: '#228855',  // Main brand color
    600: '#1a6b42',
    700: '#165637',
    800: '#12442b',
    900: '#0e3522',
  },

  // Secondary palette (teal)
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  // Success (green - same as primary for consistency)
  success: {
    50: '#f0f9f4',
    100: '#d1f0df',
    400: '#40b574',
    500: '#228855',
    600: '#1a6b42',
    700: '#165637',
    900: '#0e3522',
  },

  // Warning (amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    900: '#78350f',
  },

  // Error (red)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    900: '#7f1d1d',
  },

  // Neutral (gray)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Special colors
  white: '#ffffff',
  black: '#000000',
  background: {
    light: '#f0f9f4',  // Light green background to match extension
    dark: '#171717',
  },
  surface: {
    light: '#ffffff',
    dark: '#262626',
  },
  text: {
    primary: {
      light: '#171717',
      dark: '#fafafa',
    },
    secondary: {
      light: '#404040',  // Improved contrast (was #525252)
      dark: '#d4d4d4',   // Improved contrast (was #a3a3a3)
    },
  },

  // Price colors
  price: {
    drop: '#228855',  // Green for price drops (good!)
    increase: '#ef4444',  // Red for price increases
    unchanged: '#737373',
  },

  // Leaderboard medal colors
  medal: {
    gold: {
      background: '#FFC107',  // Amber-500 for better contrast
      text: '#1a1a1a',  // Dark text for accessibility
    },
    silver: {
      background: '#9E9E9E',  // Gray-500
      text: '#1a1a1a',  // Dark text for accessibility
    },
    bronze: {
      background: '#A1887F',  // Brown-300
      text: '#1a1a1a',  // Dark text for accessibility
    },
  },

  // Semantic surface colors
  surfaceLight: '#f5f5f5',  // For light backgrounds in modals
};
