/**
 * Hint Mobile - Theme Context
 * Provides theme state and toggle functionality
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../services/init';
import { lightTheme, darkTheme, AppTheme } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: AppTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await storage.getTheme();
        if (savedTheme) {
          setThemeModeState(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTheme();
  }, []);

  // Determine if dark mode is active
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  // Get current theme object
  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  // Set theme mode and persist
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await storage.setTheme(mode);
  };

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDark,
      setThemeMode,
    }),
    [theme, themeMode, isDark]
  );

  // Don't render until we've loaded the saved theme
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
