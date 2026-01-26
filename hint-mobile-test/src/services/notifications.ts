/**
 * Hint Mobile - OneSignal Push Notification Service
 * Note: OneSignal requires a native build and won't work in Expo Go
 */

import { Platform } from 'react-native';
import { getEnv } from './init';
import { getConfig } from '../../shared/config';
import { authService } from '../../shared/services';
import { notificationEvents, type NotificationEventData } from './notificationEvents';

// OneSignal is only available in native builds
let OneSignal: any = null;
try {
  OneSignal = require('react-native-onesignal').OneSignal;
} catch (e) {
  console.log('OneSignal not available (requires native build)');
}

/**
 * Initialize OneSignal push notifications
 */
export function initializeNotifications(): void {
  if (!OneSignal) {
    console.log('OneSignal not available - skipping initialization');
    return;
  }

  const { ONESIGNAL_APP_ID } = getEnv();

  if (!ONESIGNAL_APP_ID) {
    console.warn('OneSignal App ID not configured');
    return;
  }

  try {
    // Initialize OneSignal
    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Request notification permissions
    OneSignal.Notifications.requestPermission(true);

    // Set up notification handlers
    OneSignal.Notifications.addEventListener('click', handleNotificationClick);
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', handleForegroundNotification);
  } catch (error) {
    console.warn('Failed to initialize OneSignal:', error);
  }
}

/**
 * Set user identifier for targeted notifications
 */
export async function setNotificationUserId(userId: string): Promise<void> {
  if (!OneSignal) return;
  try {
    await OneSignal.login(userId);
    console.log('OneSignal user ID set:', userId);
  } catch (error) {
    console.error('Failed to set OneSignal user ID:', error);
  }
}

/**
 * Clear user identifier on logout
 */
export async function clearNotificationUserId(): Promise<void> {
  if (!OneSignal) return;
  try {
    await OneSignal.logout();
    console.log('OneSignal user logged out');
  } catch (error) {
    console.error('Failed to logout OneSignal user:', error);
  }
}

/**
 * Make RPC call to Supabase
 */
async function rpc(functionName: string, params: Record<string, any>): Promise<any> {
  const config = getConfig();
  const token = authService.getAccessToken();

  if (!config) {
    throw new Error('Not configured');
  }

  const headers: Record<string, string> = {
    'apikey': config.supabaseAnonKey,
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/rpc/${functionName}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    throw new Error(`RPC call failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Sync push token with database for backend notifications
 */
export async function syncPushToken(): Promise<void> {
  if (!OneSignal) return;

  try {
    // Get the OneSignal player ID
    const playerId = await OneSignal.User.getOnesignalId();

    if (playerId) {
      // Store in Supabase via RPC
      await rpc('upsert_push_token', {
        p_player_id: playerId,
        p_device_type: Platform.OS,
      });
      console.log('Push token synced:', playerId);
    }
  } catch (error) {
    console.error('Failed to sync push token:', error);
  }
}

/**
 * Deactivate push token (on logout)
 */
export async function deactivatePushToken(): Promise<void> {
  if (!OneSignal) return;

  try {
    const playerId = await OneSignal.User.getOnesignalId();
    if (playerId) {
      await rpc('deactivate_push_token', {
        p_player_id: playerId,
      });
    }
  } catch (error) {
    console.error('Failed to deactivate push token:', error);
  }
}

/**
 * Handle notification click (user tapped on notification)
 */
function handleNotificationClick(event: any): void {
  console.log('Notification clicked:', event);

  const data = event.notification?.additionalData;
  if (!data) return;

  // Handle different notification types
  switch (data.type) {
    case 'price_drop':
      // Navigate to product
      handlePriceDropNotification(data);
      break;
    case 'item_claimed':
      // Navigate to list
      handleItemClaimedNotification(data);
      break;
    case 'back_in_stock':
      // Navigate to product
      handleBackInStockNotification(data);
      break;
    default:
      console.log('Unknown notification type:', data.type);
  }
}

/**
 * Handle foreground notification (notification received while app is open)
 */
function handleForegroundNotification(event: any): void {
  console.log('Foreground notification:', event);
  // Display the notification
  event.notification.display();
}

/**
 * Handle price drop notification
 */
function handlePriceDropNotification(data: any): void {
  console.log('Price drop notification:', data);
  notificationEvents.emit({
    type: 'price_drop',
    listId: data.listId,
    productId: data.productId,
    listName: data.listName,
  });
}

/**
 * Handle item claimed notification
 */
function handleItemClaimedNotification(data: any): void {
  console.log('Item claimed notification:', data);
  notificationEvents.emit({
    type: 'item_claimed',
    listId: data.listId,
    listName: data.listName,
  });
}

/**
 * Handle back in stock notification
 */
function handleBackInStockNotification(data: any): void {
  console.log('Back in stock notification:', data);
  notificationEvents.emit({
    type: 'back_in_stock',
    listId: data.listId,
    productId: data.productId,
    listName: data.listName,
  });
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(settings: {
  priceDrops?: boolean;
  backInStock?: boolean;
  itemsClaimed?: boolean;
  friendActivity?: boolean;
}): Promise<void> {
  if (!OneSignal) return;
  try {
    // Set tags for segmentation
    if (settings.priceDrops !== undefined) {
      await OneSignal.User.addTag('price_drops', settings.priceDrops ? 'true' : 'false');
    }
    if (settings.backInStock !== undefined) {
      await OneSignal.User.addTag('back_in_stock', settings.backInStock ? 'true' : 'false');
    }
    if (settings.itemsClaimed !== undefined) {
      await OneSignal.User.addTag('items_claimed', settings.itemsClaimed ? 'true' : 'false');
    }
    if (settings.friendActivity !== undefined) {
      await OneSignal.User.addTag('friend_activity', settings.friendActivity ? 'true' : 'false');
    }

    console.log('Notification settings updated');
  } catch (error) {
    console.error('Failed to update notification settings:', error);
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  if (!OneSignal) return false;
  try {
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    return hasPermission;
  } catch (error) {
    console.error('Failed to check notification permission:', error);
    return false;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!OneSignal) return false;
  try {
    const granted = await OneSignal.Notifications.requestPermission(true);
    return granted;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}
