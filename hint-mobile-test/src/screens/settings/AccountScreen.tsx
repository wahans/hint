/**
 * Hint Mobile - Account Screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Divider, TextInput, Button, Avatar, Text, Portal, Modal } from 'react-native-paper';
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

  // Password change state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordError('');
    setIsChangingPassword(true);

    try {
      // TODO: Implement password change via Supabase
      // await authService.updatePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError('Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your lists, items, and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion via Supabase
            Alert.alert('Account Deleted', 'Your account has been deleted.');
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

      {/* Security */}
      <List.Section>
        <List.Subheader>Security</List.Subheader>
        <List.Item
          title="Change Password"
          description="Update your password"
          left={(props) => <List.Icon {...props} icon="lock" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => setPasswordModalVisible(true)}
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

      {/* Change Password Modal */}
      <Portal>
        <Modal
          visible={passwordModalVisible}
          onDismiss={() => {
            setPasswordModalVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
          }}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Change Password
          </Text>

          <TextInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            mode="outlined"
            style={styles.modalInput}
          />

          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            mode="outlined"
            style={styles.modalInput}
          />

          <TextInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            mode="outlined"
            style={styles.modalInput}
            error={!!passwordError}
          />

          {passwordError ? (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: 12 }}>
              {passwordError}
            </Text>
          ) : null}

          <View style={styles.modalActions}>
            <Button
              mode="contained"
              onPress={handleChangePassword}
              loading={isChangingPassword}
              disabled={isChangingPassword}
            >
              Change Password
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                setPasswordModalVisible(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
              }}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
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
  modalContainer: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 20,
  },
  modalInput: {
    marginBottom: 12,
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
});
