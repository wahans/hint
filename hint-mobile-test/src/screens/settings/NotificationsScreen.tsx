/**
 * Hint Mobile - Notifications Settings Screen
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Switch, Text, Button, SegmentedButtons } from 'react-native-paper';
import type { SettingsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { storage } from '../../services/init';

interface NotificationSettings {
  enabled: boolean;
  priceDrops: boolean;
  priceThreshold: number;
  backInStock: boolean;
  itemsClaimed: boolean;
  friendActivity: boolean;
  dueDateReminders: boolean;
  reminderDays60: boolean;
  reminderDays30: boolean;
  reminderDays15: boolean;
  friendRequests: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  priceDrops: true,
  priceThreshold: 10,
  backInStock: true,
  itemsClaimed: true,
  friendActivity: false,
  dueDateReminders: true,
  reminderDays60: true,
  reminderDays30: true,
  reminderDays15: true,
  friendRequests: true,
};

export default function NotificationsScreen({ navigation }: SettingsScreenProps<'Notifications'>) {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await storage.get<NotificationSettings>('notificationSettings');
      if (saved) {
        setSettings(saved);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      await storage.set('notificationSettings', settings);
      setHasChanges(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        {/* Master Toggle */}
        <List.Section>
          <List.Item
            title="Push Notifications"
            description="Receive notifications on this device"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={settings.enabled}
                onValueChange={(value) => updateSetting('enabled', value)}
              />
            )}
          />
        </List.Section>

        <Divider />

        {/* Notification Types */}
        <List.Section>
          <List.Subheader>Notification Types</List.Subheader>

          <List.Item
            title="Price Drops"
            description="When tracked products go on sale"
            left={(props) => <List.Icon {...props} icon="arrow-down" />}
            right={() => (
              <Switch
                value={settings.priceDrops}
                onValueChange={(value) => updateSetting('priceDrops', value)}
                disabled={!settings.enabled}
              />
            )}
          />

          {settings.priceDrops && settings.enabled && (
            <View style={styles.sliderContainer}>
              <Text variant="bodyMedium" style={styles.sliderLabel}>
                Notify when price drops by at least:
              </Text>
              <SegmentedButtons
                value={String(settings.priceThreshold)}
                onValueChange={(value) => updateSetting('priceThreshold', Number(value))}
                buttons={[
                  { value: '5', label: '5%' },
                  { value: '10', label: '10%' },
                  { value: '20', label: '20%' },
                  { value: '50', label: '50%' },
                ]}
                style={styles.segmented}
              />
            </View>
          )}

          <List.Item
            title="Back in Stock"
            description="When out-of-stock items become available"
            left={(props) => <List.Icon {...props} icon="package-variant" />}
            right={() => (
              <Switch
                value={settings.backInStock}
                onValueChange={(value) => updateSetting('backInStock', value)}
                disabled={!settings.enabled}
              />
            )}
          />

          <List.Item
            title="Items Claimed"
            description="When friends claim items from your lists"
            left={(props) => <List.Icon {...props} icon="gift" />}
            right={() => (
              <Switch
                value={settings.itemsClaimed}
                onValueChange={(value) => updateSetting('itemsClaimed', value)}
                disabled={!settings.enabled}
              />
            )}
          />

          <List.Item
            title="Friend Activity"
            description="When friends update their wishlists"
            left={(props) => <List.Icon {...props} icon="account-group" />}
            right={() => (
              <Switch
                value={settings.friendActivity}
                onValueChange={(value) => updateSetting('friendActivity', value)}
                disabled={!settings.enabled}
              />
            )}
          />

          <List.Item
            title="Friend Requests"
            description="When someone sends you a friend request"
            left={(props) => <List.Icon {...props} icon="account-plus" />}
            right={() => (
              <Switch
                value={settings.friendRequests}
                onValueChange={(value) => updateSetting('friendRequests', value)}
                disabled={!settings.enabled}
              />
            )}
          />
        </List.Section>

        <Divider />

        {/* Due Date Reminders */}
        <List.Section>
          <List.Subheader>Due Date Reminders</List.Subheader>

          <List.Item
            title="Key Date Reminders"
            description="Get reminded before list due dates"
            left={(props) => <List.Icon {...props} icon="calendar-clock" />}
            right={() => (
              <Switch
                value={settings.dueDateReminders}
                onValueChange={(value) => updateSetting('dueDateReminders', value)}
                disabled={!settings.enabled}
              />
            )}
          />

          {settings.dueDateReminders && settings.enabled && (
            <View style={styles.reminderOptions}>
              <Text variant="bodyMedium" style={styles.reminderLabel}>
                Remind me:
              </Text>

              <View style={styles.reminderRow}>
                <Switch
                  value={settings.reminderDays60}
                  onValueChange={(value) => updateSetting('reminderDays60', value)}
                />
                <Text variant="bodyMedium" style={styles.reminderText}>
                  60 days before
                </Text>
              </View>

              <View style={styles.reminderRow}>
                <Switch
                  value={settings.reminderDays30}
                  onValueChange={(value) => updateSetting('reminderDays30', value)}
                />
                <Text variant="bodyMedium" style={styles.reminderText}>
                  30 days before
                </Text>
              </View>

              <View style={styles.reminderRow}>
                <Switch
                  value={settings.reminderDays15}
                  onValueChange={(value) => updateSetting('reminderDays15', value)}
                />
                <Text variant="bodyMedium" style={styles.reminderText}>
                  15 days before
                </Text>
              </View>
            </View>
          )}
        </List.Section>
      </ScrollView>

      {hasChanges && (
        <View style={styles.saveButton}>
          <Button mode="contained" onPress={saveSettings}>
            Save Changes
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sliderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 56,
    marginRight: 16,
  },
  sliderLabel: {
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 8,
  },
  saveButton: {
    padding: 16,
    paddingBottom: 32,
  },
  reminderOptions: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 56,
    marginRight: 16,
  },
  reminderLabel: {
    marginBottom: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderText: {
    marginLeft: 12,
  },
});
