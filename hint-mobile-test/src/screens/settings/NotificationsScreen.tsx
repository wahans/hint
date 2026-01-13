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
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  priceDrops: true,
  priceThreshold: 10,
  backInStock: true,
  itemsClaimed: true,
  friendActivity: false,
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
});
