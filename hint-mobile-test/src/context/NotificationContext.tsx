/**
 * Hint Mobile - Notification Context
 * Provides notification state and handlers throughout the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  initializeNotifications,
  setNotificationUserId,
  clearNotificationUserId,
  syncPushToken,
  deactivatePushToken,
  areNotificationsEnabled,
  requestNotificationPermission,
  updateNotificationSettings,
} from '../services/notifications';
import { useAuth } from './AuthContext';
import { storage } from '../services/init';

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

interface NotificationContextValue {
  settings: NotificationSettings;
  hasPermission: boolean;
  updateSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [hasPermission, setHasPermission] = useState(false);

  // Initialize notifications
  useEffect(() => {
    initializeNotifications();
    checkPermission();
    loadSettings();
  }, []);

  // Update OneSignal user ID when auth state changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setNotificationUserId(user.id);
      // Sync push token with database for backend notifications
      syncPushToken();
    } else {
      // Deactivate token and logout
      deactivatePushToken();
      clearNotificationUserId();
    }
  }, [isAuthenticated, user?.id]);

  const checkPermission = async () => {
    const enabled = await areNotificationsEnabled();
    setHasPermission(enabled);
  };

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

  const updateSettingsHandler = async (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      // Save to local storage
      await storage.set('notificationSettings', newSettings);

      // Update OneSignal tags
      await updateNotificationSettings({
        priceDrops: newSettings.priceDrops,
        backInStock: newSettings.backInStock,
        itemsClaimed: newSettings.itemsClaimed,
        friendActivity: newSettings.friendActivity,
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  const requestPermissionHandler = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    return granted;
  };

  return (
    <NotificationContext.Provider
      value={{
        settings,
        hasPermission,
        updateSettings: updateSettingsHandler,
        requestPermission: requestPermissionHandler,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
