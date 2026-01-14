/**
 * Hint Mobile - Settings Screen
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Switch, Text } from 'react-native-paper';
import type { SettingsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }: SettingsScreenProps<'Settings'>) {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Account Section */}
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title={user?.name || 'User'}
          description={user?.email}
          left={(props) => <List.Icon {...props} icon="account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Account')}
        />
      </List.Section>

      <Divider />

      {/* Notifications Section */}
      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Activity"
          description="View recent notifications"
          left={(props) => <List.Icon {...props} icon="bell-ring" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('NotificationCenter')}
        />
        <List.Item
          title="Notification Settings"
          description="Price drops, claims, reminders"
          left={(props) => <List.Icon {...props} icon="bell-cog" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Notifications')}
        />
      </List.Section>

      <Divider />

      {/* Appearance Section */}
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Dark Mode"
          description={
            themeMode === 'system'
              ? 'Following system'
              : themeMode === 'dark'
              ? 'Always on'
              : 'Always off'
          }
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={isDark}
              onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
            />
          )}
        />
        <List.Item
          title="Use System Theme"
          left={(props) => <List.Icon {...props} icon="cellphone" />}
          right={() => (
            <Switch
              value={themeMode === 'system'}
              onValueChange={(value) => setThemeMode(value ? 'system' : isDark ? 'dark' : 'light')}
            />
          )}
        />
      </List.Section>

      <Divider />

      {/* About Section */}
      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
        <List.Item
          title="Privacy Policy"
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          right={(props) => <List.Icon {...props} icon="open-in-new" />}
          onPress={() => {
            // TODO: Open privacy policy URL
          }}
        />
        <List.Item
          title="Terms of Service"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          right={(props) => <List.Icon {...props} icon="open-in-new" />}
          onPress={() => {
            // TODO: Open terms of service URL
          }}
        />
      </List.Section>

      <Divider />

      {/* Sign Out */}
      <List.Section>
        <List.Item
          title="Sign Out"
          titleStyle={{ color: theme.colors.error }}
          left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
          onPress={handleSignOut}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
