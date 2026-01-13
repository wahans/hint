/**
 * Hint Mobile App
 * React Native app for managing wishlists and tracking products
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Context providers
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Services
import { initializeServices } from './src/services/init';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

/**
 * App content with theme-aware status bar
 */
function AppContent() {
  const { theme, isDark } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.onSurface,
            border: theme.colors.outlineVariant,
            notification: theme.colors.error,
          },
        }}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.surface}
        />
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

/**
 * Main App component
 */
export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      const success = await initializeServices();
      if (!success) {
        console.warn('Services initialization failed');
      }
      setIsInitialized(true);
    }

    init();
  }, []);

  // Show nothing until services are initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
