/**
 * Hint Mobile - OneSignal Push Notification Service
 * Note: OneSignal requires a native build and won't work in Expo Go
 */

import { getEnv } from './init';

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
  // TODO: Navigate to product detail screen
  // navigation.navigate('ListDetail', { listId: data.listId, productId: data.productId });
}

/**
 * Handle item claimed notification
 */
function handleItemClaimedNotification(data: any): void {
  console.log('Item claimed notification:', data);
  // TODO: Navigate to list detail screen
  // navigation.navigate('ListDetail', { listId: data.listId });
}

/**
 * Handle back in stock notification
 */
function handleBackInStockNotification(data: any): void {
  console.log('Back in stock notification:', data);
  // TODO: Navigate to product detail screen
  // navigation.navigate('ListDetail', { listId: data.listId, productId: data.productId });
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
