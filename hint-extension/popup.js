// Hint Extension - Modular Entry Point
// Main entry point - imports modules and wires up event listeners

import * as auth from './modules/auth.js';
import * as lists from './modules/lists.js';
import * as products from './modules/products.js';
import * as friends from './modules/friends.js';
import * as claims from './modules/claims.js';
import * as settings from './modules/settings.js';
import * as leaderboard from './modules/leaderboard.js';
import * as navigation from './modules/navigation.js';
import * as ui from './modules/ui.js';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  await auth.loadTheme();
  await auth.loadConfig();
  setupEventListeners();
  ui.initDropdowns();
});

function setupEventListeners() {
  // Config
  document.getElementById('saveConfigBtn').addEventListener('click', auth.saveConfig);
  document.getElementById('showConfigLink').addEventListener('click', (e) => {
    e.preventDefault();
    auth.showConfig();
  });

  // Login
  document.getElementById('loginBtn').addEventListener('click', auth.login);
  document.getElementById('loginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') auth.login();
  });

  // Signup
  document.getElementById('signupBtn').addEventListener('click', auth.signup);
  document.getElementById('signupPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') auth.signup();
  });
  document.getElementById('showSignupBtn').addEventListener('click', auth.showSignup);
  document.getElementById('showLoginLink').addEventListener('click', (e) => {
    e.preventDefault();
    auth.showLogin();
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', auth.logout);

  // Tab navigation
  document.getElementById('addTab').addEventListener('click', () => navigation.switchTab('add'));
  document.getElementById('myListsTab').addEventListener('click', () => navigation.switchTab('myLists'));
  document.getElementById('myClaimsTab').addEventListener('click', () => navigation.switchTab('myClaims'));
  document.getElementById('viewHintlistTab').addEventListener('click', () => navigation.switchTab('viewHintlist'));

  // Header Friends button
  const browseFriendsBtn = document.getElementById('browseFriendsBtn');
  if (browseFriendsBtn) {
    browseFriendsBtn.addEventListener('click', () => {
      navigation.switchTab('add');
      friends.loadBrowseFriendsModal();
    });
  }

  // Footer Settings button
  const footerSettingsBtn = document.getElementById('footerSettingsBtn');
  if (footerSettingsBtn) {
    footerSettingsBtn.addEventListener('click', settings.openSettingsModal);
  }

  // Leaderboard button
  const leaderboardBtn = document.getElementById('leaderboardBtn');
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', leaderboard.openLeaderboardModal);
  }

  // Create list buttons
  const createListBtn = document.getElementById('createListBtn');
  if (createListBtn) {
    createListBtn.addEventListener('click', lists.createNewList);
  }

  const createListFromMyListsBtn = document.getElementById('createListFromMyListsBtn');
  if (createListFromMyListsBtn) {
    createListFromMyListsBtn.addEventListener('click', lists.createNewList);
  }

  // Add product button
  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', products.addProduct);
  }

  // Load hintlist
  const loadHintlistBtn = document.getElementById('loadHintlistBtn');
  if (loadHintlistBtn) {
    loadHintlistBtn.addEventListener('click', claims.loadHintlist);
  }

  const hintlistCodeInput = document.getElementById('hintlistCode');
  if (hintlistCodeInput) {
    hintlistCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') claims.loadHintlist();
    });
  }

  // Refresh buttons with loading state
  const refreshBtn = document.getElementById('refreshListsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      ui.setRefreshLoading(refreshBtn, true);
      await lists.loadUserData();
      ui.setRefreshLoading(refreshBtn, false);
      ui.showToast('Lists refreshed!', 'success', 2000);
    });
  }

  const refreshClaimsBtn = document.getElementById('refreshClaimsBtn');
  if (refreshClaimsBtn) {
    refreshClaimsBtn.addEventListener('click', async () => {
      ui.setRefreshLoading(refreshClaimsBtn, true);
      await claims.loadMyClaims();
      ui.setRefreshLoading(refreshClaimsBtn, false);
    });
  }

  const refreshFriendsBtn = document.getElementById('refreshFriendsBtn');
  if (refreshFriendsBtn) {
    refreshFriendsBtn.addEventListener('click', async () => {
      ui.setRefreshLoading(refreshFriendsBtn, true);
      await friends.loadBrowseFriends();
      ui.setRefreshLoading(refreshFriendsBtn, false);
    });
  }

  // Clear recent friends
  const clearRecentBtn = document.getElementById('clearRecentBtn');
  if (clearRecentBtn) {
    clearRecentBtn.addEventListener('click', async () => {
      await chrome.storage.local.set({ recentFriends: [] });
      await friends.loadBrowseFriends();
    });
  }

  // Friend search
  const friendSearchInput = document.getElementById('friendSearchInput');
  if (friendSearchInput) {
    friendSearchInput.addEventListener('input', (e) => {
      friends.filterFriends(e.target.value);
    });
  }
}
