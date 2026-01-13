/**
 * Hint Extension - Background Service Worker
 * Handles push notifications, alarms, and background tasks
 */

// ============================================
// NOTIFICATION SETTINGS DEFAULTS
// ============================================

const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  priceDrops: true,
  priceDropThreshold: 10, // percentage
  backInStock: true,
  claims: true,
  friendActivity: true,
  keyDateReminders: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  // Per-list overrides stored as: { [listId]: { enabled: boolean } }
  listOverrides: {}
};

// Smart batching: group notifications within this window (ms)
const BATCH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
let pendingNotifications = [];
let batchTimeout = null;

// ============================================
// INITIALIZATION
// ============================================

// Listen for extension install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Hint] Extension installed/updated:', details.reason);

  // Initialize notification settings if not exists
  const { notificationSettings } = await chrome.storage.local.get('notificationSettings');
  if (!notificationSettings) {
    await chrome.storage.local.set({ notificationSettings: DEFAULT_NOTIFICATION_SETTINGS });
  }

  // Set up periodic price check alarm (every 6 hours)
  chrome.alarms.create('priceCheck', { periodInMinutes: 360 });

  // Set up key date reminder check (daily)
  chrome.alarms.create('keyDateCheck', { periodInMinutes: 1440 });
});

// Listen for alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('[Hint] Alarm triggered:', alarm.name);

  if (alarm.name === 'priceCheck') {
    await checkPricesAndNotify();
  } else if (alarm.name === 'keyDateCheck') {
    await checkKeyDatesAndNotify();
  }
});

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Get current notification settings
 */
async function getNotificationSettings() {
  const { notificationSettings } = await chrome.storage.local.get('notificationSettings');
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...notificationSettings };
}

/**
 * Check if notifications are currently allowed (respects quiet hours)
 */
async function canShowNotification() {
  const settings = await getNotificationSettings();

  if (!settings.enabled) return false;

  if (settings.quietHoursEnabled) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startTime > endTime) {
      if (currentTime >= startTime || currentTime < endTime) {
        return false;
      }
    } else {
      if (currentTime >= startTime && currentTime < endTime) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Show a notification with smart batching
 */
async function queueNotification(notification) {
  const canShow = await canShowNotification();
  if (!canShow) {
    console.log('[Hint] Notification suppressed (quiet hours or disabled)');
    return;
  }

  pendingNotifications.push({
    ...notification,
    timestamp: Date.now()
  });

  // Clear existing batch timeout
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }

  // Set new batch timeout
  batchTimeout = setTimeout(() => {
    processBatchedNotifications();
  }, 3000); // Wait 3 seconds for more notifications before sending
}

/**
 * Process and send batched notifications
 */
async function processBatchedNotifications() {
  if (pendingNotifications.length === 0) return;

  const notifications = [...pendingNotifications];
  pendingNotifications = [];
  batchTimeout = null;

  // Group by type
  const grouped = {};
  notifications.forEach(n => {
    const key = n.type || 'general';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(n);
  });

  // Send grouped notifications
  for (const [type, items] of Object.entries(grouped)) {
    if (items.length === 1) {
      // Single notification - send as-is
      await showNotification(items[0]);
    } else {
      // Multiple notifications of same type - combine
      await showGroupedNotification(type, items);
    }
  }
}

/**
 * Show a single notification
 */
async function showNotification(notification) {
  const notificationId = `hint-${notification.type}-${Date.now()}`;

  const options = {
    type: 'basic',
    iconUrl: notification.iconUrl || 'icons/icon128.png',
    title: notification.title,
    message: notification.message,
    priority: 2,
    requireInteraction: notification.requireInteraction || false
  };

  // Add buttons if specified
  if (notification.buttons && notification.buttons.length > 0) {
    options.buttons = notification.buttons.slice(0, 2); // Max 2 buttons
  }

  // Add image if available (for rich notifications)
  if (notification.imageUrl) {
    options.type = 'image';
    options.imageUrl = notification.imageUrl;
  }

  try {
    await chrome.notifications.create(notificationId, options);

    // Store notification data for click handling
    await chrome.storage.local.set({
      [`notification_${notificationId}`]: {
        type: notification.type,
        data: notification.data,
        url: notification.url,
        listId: notification.listId,
        productId: notification.productId
      }
    });
  } catch (error) {
    console.error('[Hint] Failed to show notification:', error);
  }
}

/**
 * Show a grouped notification for multiple events
 */
async function showGroupedNotification(type, items) {
  const notificationId = `hint-${type}-batch-${Date.now()}`;

  let title, message;

  switch (type) {
    case 'priceDrops':
      title = `${items.length} Price Drops!`;
      message = items.map(i => i.productName).slice(0, 3).join(', ');
      if (items.length > 3) message += ` +${items.length - 3} more`;
      break;
    case 'backInStock':
      title = `${items.length} Items Back in Stock`;
      message = items.map(i => i.productName).slice(0, 3).join(', ');
      break;
    case 'claims':
      title = `${items.length} New Claims`;
      message = 'Items have been claimed from your lists';
      break;
    default:
      title = `${items.length} hint Updates`;
      message = 'You have new activity on your hintlists';
  }

  const options = {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 2,
    buttons: [
      { title: 'View All' }
    ]
  };

  try {
    await chrome.notifications.create(notificationId, options);

    await chrome.storage.local.set({
      [`notification_${notificationId}`]: {
        type: 'batch',
        batchType: type,
        items: items.map(i => ({ productId: i.productId, listId: i.listId }))
      }
    });
  } catch (error) {
    console.error('[Hint] Failed to show grouped notification:', error);
  }
}

// ============================================
// NOTIFICATION CLICK HANDLERS
// ============================================

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  console.log('[Hint] Notification clicked:', notificationId);

  const dataKey = `notification_${notificationId}`;
  const { [dataKey]: notificationData } = await chrome.storage.local.get(dataKey);

  if (notificationData) {
    // Open extension popup or relevant URL
    if (notificationData.url) {
      chrome.tabs.create({ url: notificationData.url });
    } else {
      // Open extension popup
      chrome.action.openPopup();
    }

    // Clean up stored data
    await chrome.storage.local.remove(dataKey);
  }

  // Clear the notification
  chrome.notifications.clear(notificationId);
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log('[Hint] Notification button clicked:', notificationId, buttonIndex);

  const dataKey = `notification_${notificationId}`;
  const { [dataKey]: notificationData } = await chrome.storage.local.get(dataKey);

  if (notificationData) {
    if (buttonIndex === 0) {
      // First button - usually "Buy Now" or "View"
      if (notificationData.url) {
        chrome.tabs.create({ url: notificationData.url });
      } else {
        chrome.action.openPopup();
      }
    } else if (buttonIndex === 1) {
      // Second button - usually "Dismiss" or "View List"
      // Just close the notification
    }

    await chrome.storage.local.remove(dataKey);
  }

  chrome.notifications.clear(notificationId);
});

// Handle notification closed
chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {
  const dataKey = `notification_${notificationId}`;
  await chrome.storage.local.remove(dataKey);
});

// ============================================
// PRICE CHECK LOGIC
// ============================================

/**
 * Check all tracked products for price changes and notify
 */
async function checkPricesAndNotify() {
  console.log('[Hint] Starting price check...');

  const settings = await getNotificationSettings();
  if (!settings.priceDrops && !settings.backInStock) {
    console.log('[Hint] Price notifications disabled');
    return;
  }

  const { session, supabaseUrl, supabaseKey } = await chrome.storage.local.get([
    'session', 'supabaseUrl', 'supabaseKey'
  ]);

  if (!session || !supabaseUrl || !supabaseKey) {
    console.log('[Hint] Not logged in, skipping price check');
    return;
  }

  try {
    // Get user's products with prices
    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?current_price=not.is.null&select=*,lists!inner(user_id,name)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${session.access_token}`
        }
      }
    );

    if (!response.ok) return;

    const products = await response.json();
    const userProducts = products.filter(p => p.lists?.user_id === session.user?.id);

    console.log(`[Hint] Checking ${userProducts.length} products...`);

    // Check each product (this would normally be done by a server-side cron)
    // For now, we'll check products that have URLs
    for (const product of userProducts.slice(0, 10)) { // Limit to 10 to avoid rate limiting
      if (!product.url) continue;

      // Check if list has notifications enabled
      const listOverride = settings.listOverrides[product.list_id];
      if (listOverride && listOverride.enabled === false) continue;

      const previousPrice = parseFloat(product.current_price);
      const targetPrice = product.target_price ? parseFloat(product.target_price) : null;

      // For demo purposes, we'll simulate price checks
      // In production, this would call the actual price extraction API

      // Check for target price alerts
      if (targetPrice && previousPrice <= targetPrice && settings.priceDrops) {
        await queueNotification({
          type: 'priceDrops',
          title: 'Price Alert!',
          message: `${product.name} hit your target price of $${targetPrice.toFixed(2)}!`,
          productName: product.name,
          url: product.url,
          productId: product.id,
          listId: product.list_id,
          buttons: [
            { title: 'Buy Now' },
            { title: 'View List' }
          ]
        });
      }
    }
  } catch (error) {
    console.error('[Hint] Price check error:', error);
  }
}

/**
 * Check for upcoming key dates and send reminders
 */
async function checkKeyDatesAndNotify() {
  console.log('[Hint] Checking key dates...');

  const settings = await getNotificationSettings();
  if (!settings.keyDateReminders) return;

  const { session, supabaseUrl, supabaseKey } = await chrome.storage.local.get([
    'session', 'supabaseUrl', 'supabaseKey'
  ]);

  if (!session || !supabaseUrl || !supabaseKey) return;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/lists?user_id=eq.${session.user?.id}&key_date=not.is.null&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${session.access_token}`
        }
      }
    );

    if (!response.ok) return;

    const lists = await response.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const list of lists) {
      const keyDate = new Date(list.key_date);
      keyDate.setHours(0, 0, 0, 0);

      const daysUntil = Math.ceil((keyDate - today) / (1000 * 60 * 60 * 24));

      // Send reminders at 30, 15, 7, 3, and 1 day(s) before
      const reminderDays = [30, 15, 7, 3, 1];

      if (reminderDays.includes(daysUntil)) {
        await queueNotification({
          type: 'keyDateReminder',
          title: `${list.name} - ${daysUntil} day${daysUntil === 1 ? '' : 's'} away!`,
          message: `The key date for "${list.name}" is coming up on ${keyDate.toLocaleDateString()}`,
          listId: list.id,
          buttons: [
            { title: 'View List' }
          ]
        });
      }
    }
  } catch (error) {
    console.error('[Hint] Key date check error:', error);
  }
}

// ============================================
// MESSAGE HANDLERS (from popup/content scripts)
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Hint] Message received:', message.type);

  switch (message.type) {
    case 'SHOW_NOTIFICATION':
      queueNotification(message.notification);
      sendResponse({ success: true });
      break;

    case 'PRICE_DROP_DETECTED':
      handlePriceDropDetected(message.data);
      sendResponse({ success: true });
      break;

    case 'ITEM_CLAIMED':
      handleItemClaimed(message.data);
      sendResponse({ success: true });
      break;

    case 'BACK_IN_STOCK':
      handleBackInStock(message.data);
      sendResponse({ success: true });
      break;

    case 'GET_NOTIFICATION_SETTINGS':
      getNotificationSettings().then(settings => {
        sendResponse({ settings });
      });
      return true; // Keep channel open for async response

    case 'UPDATE_NOTIFICATION_SETTINGS':
      chrome.storage.local.set({ notificationSettings: message.settings }).then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'TEST_NOTIFICATION':
      showNotification({
        type: 'test',
        title: 'Test Notification',
        message: 'Notifications are working!',
        buttons: [{ title: 'Great!' }]
      });
      sendResponse({ success: true });
      break;
  }
});

/**
 * Handle price drop detected from popup/content script
 */
async function handlePriceDropDetected(data) {
  const settings = await getNotificationSettings();
  if (!settings.priceDrops) return;

  const { product, previousPrice, newPrice, percentDrop } = data;

  // Check threshold
  if (percentDrop < settings.priceDropThreshold) {
    console.log(`[Hint] Price drop ${percentDrop}% below threshold ${settings.priceDropThreshold}%`);
    return;
  }

  await queueNotification({
    type: 'priceDrops',
    title: `Price Drop: ${percentDrop}% off!`,
    message: `${product.name} dropped from $${previousPrice.toFixed(2)} to $${newPrice.toFixed(2)}`,
    productName: product.name,
    imageUrl: product.image_url,
    url: product.url,
    productId: product.id,
    listId: product.list_id,
    buttons: [
      { title: 'Buy Now' },
      { title: 'Dismiss' }
    ]
  });
}

/**
 * Handle item claimed notification
 */
async function handleItemClaimed(data) {
  const settings = await getNotificationSettings();
  if (!settings.claims) return;

  const { product, listName, claimerName } = data;

  await queueNotification({
    type: 'claims',
    title: 'Item Claimed!',
    message: `${claimerName || 'Someone'} claimed "${product.name}" from ${listName}`,
    productName: product.name,
    productId: product.id,
    listId: product.list_id,
    buttons: [
      { title: 'View List' }
    ]
  });
}

/**
 * Handle back in stock notification
 */
async function handleBackInStock(data) {
  const settings = await getNotificationSettings();
  if (!settings.backInStock) return;

  const { product } = data;

  await queueNotification({
    type: 'backInStock',
    title: 'Back in Stock!',
    message: `${product.name} is available again`,
    productName: product.name,
    imageUrl: product.image_url,
    url: product.url,
    productId: product.id,
    listId: product.list_id,
    buttons: [
      { title: 'Buy Now' },
      { title: 'View' }
    ]
  });
}

// ============================================
// STARTUP
// ============================================

console.log('[Hint] Background service worker started');
