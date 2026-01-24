// Auth module - Login, signup, logout, config
import * as state from './state.js';
import * as api from './api.js';
import * as ui from './ui.js';
import { loadUserData, autoFillCurrentPage } from './products.js';

// Load theme from storage
export async function loadTheme() {
  const { theme } = await chrome.storage.local.get('theme');
  if (theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Load configuration from storage
export async function loadConfig() {
  const config = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey', 'session']);

  if (config.supabaseUrl && config.supabaseKey) {
    state.setSupabaseUrl(config.supabaseUrl);
    state.setSupabaseKey(config.supabaseKey);

    if (config.session && config.session.user) {
      state.setCurrentUser(config.session.user);
      showApp();
      await loadUserData();
      await autoFillCurrentPage();
    } else if (config.session && config.session.access_token) {
      state.setCurrentUser(config.session);
      showApp();
      await loadUserData();
      await autoFillCurrentPage();
    } else {
      showLogin();
    }
  } else {
    showConfig();
  }
}

// Save Supabase configuration
export async function saveConfig() {
  console.log('saveConfig called');

  const url = document.getElementById('supabaseUrl').value.trim();
  const key = document.getElementById('supabaseKey').value.trim();

  console.log('URL:', url ? 'provided' : 'empty');
  console.log('Key:', key ? 'provided' : 'empty');

  if (!url || !key) {
    ui.showMessage('configMessage', 'Please enter both URL and key', 'error');
    return;
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    ui.showMessage('configMessage', 'Please enter a valid Supabase URL', 'error');
    return;
  }

  try {
    await chrome.storage.local.set({ supabaseUrl: url, supabaseKey: key });
    state.setSupabaseUrl(url);
    state.setSupabaseKey(key);

    console.log('Config saved successfully');
    ui.showMessage('configMessage', 'Configuration saved!', 'success');
    setTimeout(() => showLogin(), 1000);
  } catch (error) {
    console.error('Error saving config:', error);
    ui.showMessage('configMessage', 'Error saving configuration', 'error');
  }
}

// Login user
export async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    ui.showMessage('loginMessage', 'Please enter email and password', 'error');
    return;
  }

  try {
    const response = await fetch(`${state.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': state.supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.error) {
      ui.showMessage('loginMessage', data.error.message || 'Login failed', 'error');
      return;
    }

    await chrome.storage.local.set({ session: data });
    state.setCurrentUser(data.user);
    await ensureUserRecord();

    ui.showMessage('loginMessage', 'Logged in successfully!', 'success');
    setTimeout(() => {
      showApp();
      loadUserData();
      autoFillCurrentPage();
    }, 500);
  } catch (error) {
    ui.showMessage('loginMessage', 'Connection error.', 'error');
  }
}

// Signup user
export async function signup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!name || !email || !password) {
    ui.showMessage('signupMessage', 'Please fill in all fields', 'error');
    return;
  }

  if (password.length < 6) {
    ui.showMessage('signupMessage', 'Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const response = await fetch(`${state.supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': state.supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, data: { name } })
    });

    const data = await response.json();

    if (data.error) {
      ui.showMessage('signupMessage', data.error.message || 'Signup failed', 'error');
      return;
    }

    await chrome.storage.local.set({ session: data });
    state.setCurrentUser(data.user);
    await ensureUserRecord(name);

    ui.showMessage('signupMessage', 'Account created!', 'success');
    setTimeout(() => {
      showApp();
      loadUserData();
      autoFillCurrentPage();
    }, 500);
  } catch (error) {
    ui.showMessage('signupMessage', 'Connection error.', 'error');
  }
}

// Logout user
export async function logout() {
  await chrome.storage.local.remove('session');
  state.setCurrentUser(null);
  state.setCurrentLists([]);
  state.setCurrentProducts([]);
  state.setViewingListId(null);
  showLogin();
}

// Ensure user record exists in database
export async function ensureUserRecord(name = null) {
  const session = await chrome.storage.local.get('session');
  const token = session.session?.access_token;

  if (!token || !state.currentUser) return;

  try {
    await api.supabaseRequest('POST', '/rest/v1/users', {
      id: state.currentUser.id,
      email: state.currentUser.email,
      name: name || state.currentUser.email.split('@')[0]
    }, token);
  } catch (error) {
    // User might already exist - ignore error
  }
}

// Show config section
export function showConfig() {
  ui.hideAllSections();
  document.getElementById('configSection').classList.remove('hidden');
  const browseFriendsBtn = document.getElementById('browseFriendsBtn');
  const friendsSettingsBtn = document.getElementById('friendsSettingsBtn');
  if (browseFriendsBtn) {
    browseFriendsBtn.classList.add('hidden');
  }
  if (friendsSettingsBtn) {
    friendsSettingsBtn.classList.add('hidden');
  }
}

// Show login section
export function showLogin() {
  ui.hideAllSections();
  document.getElementById('loginSection').classList.remove('hidden');
  const browseFriendsBtn = document.getElementById('browseFriendsBtn');
  const friendsSettingsBtn = document.getElementById('friendsSettingsBtn');
  if (browseFriendsBtn) {
    browseFriendsBtn.classList.add('hidden');
  }
  if (friendsSettingsBtn) {
    friendsSettingsBtn.classList.add('hidden');
  }
}

// Show signup section
export function showSignup() {
  ui.hideAllSections();
  document.getElementById('signupSection').classList.remove('hidden');
  const browseFriendsBtn = document.getElementById('browseFriendsBtn');
  const friendsSettingsBtn = document.getElementById('friendsSettingsBtn');
  if (browseFriendsBtn) {
    browseFriendsBtn.classList.add('hidden');
  }
  if (friendsSettingsBtn) {
    friendsSettingsBtn.classList.add('hidden');
  }
}

// Show main app section
export function showApp() {
  ui.hideAllSections();
  document.getElementById('appSection').classList.remove('hidden');
  const browseFriendsBtn = document.getElementById('browseFriendsBtn');
  const leaderboardBtn = document.getElementById('leaderboardBtn');

  if (browseFriendsBtn) {
    browseFriendsBtn.classList.remove('hidden');
  }
  if (leaderboardBtn) {
    leaderboardBtn.classList.remove('hidden');
  }

  // Get user's name and email
  const fullName = state.currentUser?.user_metadata?.name ||
                   state.currentUser?.name ||
                   state.currentUser?.email?.split('@')[0] ||
                   'user';

  // Extract first name - split by space OR dot (preserve original capitalization)
  const userName = fullName.split(/[\s.]+/)[0];
  const userEmail = state.currentUser?.email || state.currentUser?.user?.email || '';

  // Display as: name - email
  document.getElementById('userInfo').textContent = `${userName} • ${userEmail}`;
}
