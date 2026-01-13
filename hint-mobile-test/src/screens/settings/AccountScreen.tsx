/**
 * Hint Mobile - Account Screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Divider, TextInput, Button, Avatar, Text, Dialog, Portal } from 'react-native-paper';
import type { SettingsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function AccountScreen({ navigation }: SettingsScreenProps<'Account'>) {
  const { theme } = useTheme();
  const { user, signOut, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      // TODO: Implement profile update API call
      await refreshUser();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Avatar.Text
          size={80}
          label={(user?.name || 'U').charAt(0).toUpperCase()}
          style={{ backgroundColor: theme.colors.primaryContainer }}
          labelStyle={{ color: theme.colors.onPrimaryContainer }}
        />
        <Text variant="headlineSmall" style={styles.displayName}>
          {user?.name || 'User'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {user?.email}
        </Text>
      </View>

      <Divider />

      {/* Edit Profile */}
      <List.Section>
        <List.Subheader>Profile</List.Subheader>

        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.editButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setDisplayName(user?.name || '');
                  setIsEditing(false);
                }}
                style={styles.editButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                loading={isSaving}
                disabled={isSaving || !displayName.trim()}
                style={styles.editButton}
              >
                Save
              </Button>
            </View>
          </View>
        ) : (
          <List.Item
            title="Display Name"
            description={user?.name || 'Not set'}
            left={(props) => <List.Icon {...props} icon="account" />}
            right={(props) => <List.Icon {...props} icon="pencil" />}
            onPress={() => setIsEditing(true)}
          />
        )}

        <List.Item
          title="Email"
          description={user?.email}
          left={(props) => <List.Icon {...props} icon="email" />}
        />
      </List.Section>

      <Divider />

      {/* Stats */}
      <List.Section>
        <List.Subheader>Statistics</List.Subheader>
        <List.Item
          title="Lists Created"
          description="5"
          left={(props) => <List.Icon {...props} icon="format-list-bulleted" />}
        />
        <List.Item
          title="Products Tracked"
          description="23"
          left={(props) => <List.Icon {...props} icon="gift" />}
        />
        <List.Item
          title="Items Claimed"
          description="12"
          left={(props) => <List.Icon {...props} icon="check-circle" />}
        />
      </List.Section>

      <Divider />

      {/* Danger Zone */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.error }}>Danger Zone</List.Subheader>
        <List.Item
          title="Delete Account"
          description="Permanently delete your account and all data"
          titleStyle={{ color: theme.colors.error }}
          left={(props) => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
          onPress={handleDeleteAccount}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  displayName: {
    marginTop: 16,
    marginBottom: 4,
  },
  editForm: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    minWidth: 100,
  },
});
