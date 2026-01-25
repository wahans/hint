/**
 * Hint Mobile App
 * React Native app for managing wishlists and tracking products
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import type { RootStackParamList } from './src/navigation/types';

// Context providers
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Services
import { initializeServices } from './src/services/init';

// Components
import ErrorBoundary from './src/components/ErrorBoundary';
import LoadingScreen from './src/components/LoadingScreen';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Deep linking configuration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'hint://', 'https://hint.com'],
  config: {
    screens: {
      Main: {
        screens: {
          ListsTab: {
            screens: {
              MyLists: 'lists',
              ListDetail: {
                path: 'list/:listId',
                parse: {
                  listId: (listId: string) => listId,
                },
              },
            },
          },
          FriendsTab: {
            screens: {
              FriendsLists: 'friends',
              FriendListDetail: {
                path: 'friend-list/:listId',
                parse: {
                  listId: (listId: string) => listId,
                },
              },
            },
          },
          LeaderboardTab: {
            screens: {
              Leaderboard: 'leaderboard',
            },
          },
          SettingsTab: {
            screens: {
              Settings: 'settings',
              Notifications: 'settings/notifications',
              NotificationCenter: 'activity',
              Account: 'settings/account',
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          SignUp: 'signup',
        },
      },
    },
  },
};

/**
 * App content with theme-aware status bar
 */
function AppContent() {
  const { theme, isDark } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer
        linking={linking}
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
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '800' },
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

  // Show loading screen until services are initialized
  if (!isInitialized) {
    return <LoadingScreen message="Starting hint..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
