// Background service worker
// Handles context menus and future price checking

chrome.runtime.onInstalled.addListener(() => {
  console.log('hint extension installed');
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'addTohint',
    title: 'Add to hint',
    contexts: ['page', 'link', 'selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addTohint') {
    chrome.action.openPopup();
  }
});

// Future: Price checking alarm
// chrome.alarms.create('priceCheck', { periodInMinutes: 1440 }); // Daily
// 
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'priceCheck') {
//     checkPrices();
//   }
// });

// Future price checking function
async function checkPrices() {
  // This will be implemented later
  // 1. Get all products from Supabase
  // 2. Check current prices
  // 3. Compare with stored prices
  // 4. Send notifications for drops
  console.log('Price check would run here');
}