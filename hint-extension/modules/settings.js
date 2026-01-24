// Settings module - Settings modal, preferences, account management
import * as state from './state.js';
import * as api from './api.js';
import * as ui from './ui.js';
import { showApp } from './auth.js';

// Open settings modal
export async function openSettingsModal() {
  const modalContent = document.getElementById('modalContent');

  const userName = state.currentUser?.user_metadata?.name || state.currentUser?.name || '';
  const userEmail = state.currentUser?.email || '';

  modalContent.innerHTML = `
    <div class="modal-header">⚙️ Settings</div>
    <div class="modal-body" style="max-height: 400px; overflow-y: auto;">

      <!-- Account Section -->
      <div class="settings-section">
        <h3 class="settings-section-title" data-section="account">
          <span id="account-arrow">▶</span> Account
        </h3>
        <div id="account-section" class="settings-section-content hidden">
          <div class="settings-item">
            <label class="settings-label">Display Name</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="settingsName" class="modal-input" value="${userName}" style="flex: 1; margin: 0;">
              <button id="saveNameBtn" class="btn-small">Save</button>
            </div>
          </div>

          <div class="settings-item">
            <label class="settings-label">Email</label>
            <input type="text" class="modal-input" value="${userEmail}" disabled style="background: var(--bg-tertiary); cursor: not-allowed;">
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Email cannot be changed</div>
          </div>

          <div class="settings-item" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <label class="settings-label">Change Password</label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <input type="password" id="currentPassword" class="modal-input" placeholder="Current password" style="margin: 0;">
              <input type="password" id="newPassword" class="modal-input" placeholder="New password" style="margin: 0;">
              <input type="password" id="confirmNewPassword" class="modal-input" placeholder="Confirm new password" style="margin: 0;">
              <button id="changePasswordBtn" class="btn-small">Change Password</button>
            </div>
          </div>

          <div id="accountMessage" style="margin-top: 12px;"></div>
        </div>
      </div>

      <!-- Appearance Section -->
      <div class="settings-section">
        <h3 class="settings-section-title" data-section="appearance">
          <span id="appearance-arrow">▶</span> Appearance
        </h3>
        <div id="appearance-section" class="settings-section-content hidden">
          <div class="settings-item">
            <label class="settings-label">Theme</label>
            <div style="display: flex; gap: 8px;">
              <button id="lightModeBtn" class="btn-small theme-btn active" data-theme="light">
                ☀️ Light
              </button>
              <button id="darkModeBtn" class="btn-small theme-btn" data-theme="dark">
                🌙 Dark
              </button>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
              Choose your preferred theme
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications Section -->
      <div class="settings-section">
        <h3 class="settings-section-title" data-section="notifications">
          <span id="notifications-arrow">▶</span> Notifications
        </h3>
        <div id="notifications-section" class="settings-section-content hidden">

          <!-- PUSH NOTIFICATIONS -->
          <div style="font-weight: 600; font-size: 12px; color: var(--green-primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Push Notifications</div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Enable Push Notifications</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Show browser notifications for important updates</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="pushNotificationsToggle" checked>
                </td>
              </tr>
            </table>
          </div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Price Drops</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Notify when prices drop on tracked items</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="pushPriceDropsToggle" checked>
                </td>
              </tr>
            </table>
          </div>

          <div class="settings-item">
            <label class="settings-label" style="font-size: 13px;">Price Drop Threshold</label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="range" id="priceDropThreshold" min="5" max="50" value="10" style="flex: 1;">
              <span id="thresholdValue" style="font-weight: 600; min-width: 40px;">10%</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Only notify for drops greater than this %</div>
          </div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Back in Stock</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Notify when out-of-stock items return</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="pushBackInStockToggle" checked>
                </td>
              </tr>
            </table>
          </div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Item Claims</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Notify when someone claims from your lists</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="pushClaimsToggle" checked>
                </td>
              </tr>
            </table>
          </div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Friend Activity</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Notify when friends add items or share lists</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="pushFriendActivityToggle" checked>
                </td>
              </tr>
            </table>
          </div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Key Date Reminders</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Remind me before important dates</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="pushKeyDateRemindersToggle" checked>
                </td>
              </tr>
            </table>
          </div>

          <div class="settings-item">
            <button id="testNotificationBtn" class="btn-small secondary" style="width: 100%;">
              🔔 Test Notification
            </button>
          </div>

          <!-- EMAIL NOTIFICATIONS -->
          <div style="font-weight: 600; font-size: 12px; color: var(--green-primary); margin: 20px 0 12px 0; padding-top: 16px; border-top: 1px solid var(--border-color); text-transform: uppercase; letter-spacing: 0.5px;">Email Notifications</div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Email Notifications</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Receive email notifications from hint</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="emailNotificationsToggle" checked>
                </td>
              </tr>
            </table>
          </div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Friend Requests</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Get notified when someone sends you a friend request</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="friendRequestToggle" checked>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Data & Export Section -->
      <div class="settings-section">
        <h3 class="settings-section-title" data-section="data">
          <span id="data-arrow">▶</span> Data & Export
        </h3>
        <div id="data-section" class="settings-section-content hidden">
          <div class="settings-item">
            <label class="settings-label">Export Your Data</label>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
              Download all your hintlists and products as a CSV file
            </div>
            <button id="exportDataBtn" class="btn-small" style="width: 100%;">
              📥 Export to CSV
            </button>
          </div>

          <div class="settings-item">
            <label class="settings-label">Storage Info</label>
            <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: var(--text-secondary);">Hintlists:</span>
                <span style="font-weight: 600;" id="statsLists">-</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: var(--text-secondary);">Products:</span>
                <span style="font-weight: 600;" id="statsProducts">-</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Friends:</span>
                <span style="font-weight: 600;" id="statsFriends">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preferences Section -->
      <div class="settings-section">
        <h3 class="settings-section-title" data-section="preferences">
          <span id="preferences-arrow">▶</span> Preferences
        </h3>
        <div id="preferences-section" class="settings-section-content hidden">
          <div class="settings-item">
            <label class="settings-label">Currency</label>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
              Choose your preferred currency for price display
            </div>
            <select id="currencySelect" class="modal-input" style="margin: 0;">
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="CAD">CAD - Canadian Dollar ($)</option>
              <option value="AUD">AUD - Australian Dollar ($)</option>
              <option value="JPY">JPY - Japanese Yen (¥)</option>
            </select>
          </div>

          <div class="settings-item">
            <label class="settings-label">Default List Visibility</label>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
              New hintlists will be created as
            </div>
            <select id="defaultVisibilitySelect" class="modal-input" style="margin: 0;">
              <option value="private">Private (only you can see)</option>
              <option value="public">Public (shareable with access code)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Privacy & Security Section -->
      <div class="settings-section">
        <h3 class="settings-section-title" data-section="privacy">
          <span id="privacy-arrow">▶</span> Privacy & Security
        </h3>
        <div id="privacy-section" class="settings-section-content hidden">
          <div class="settings-item">
            <label class="settings-label">Who Can Send Friend Requests</label>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
              Control who can add you as a friend
            </div>
            <select id="friendRequestPrivacySelect" class="modal-input" style="margin: 0;">
              <option value="anyone">Anyone</option>
              <option value="friends_of_friends">Friends of Friends</option>
              <option value="no_one">No One</option>
            </select>
          </div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Profile Visibility</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Allow others to find you by email</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="profileVisibilityToggle" checked>
                </td>
              </tr>
            </table>
          </div>

          <div class="settings-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">Show in Leaderboard</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Display your name on public leaderboards</div>
                </td>
                <td style="padding: 0 0 0 16px; vertical-align: top; width: 20px;">
                  <input type="checkbox" id="leaderboardVisibilityToggle" checked>
                </td>
              </tr>
            </table>
          </div>

          <div class="settings-item" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <button id="deleteAccountBtn" class="btn-small danger" style="width: 100%;">
              🗑️ Delete Account
            </button>
            <div style="font-size: 11px; color: var(--error-text); margin-top: 8px; text-align: center;">
              This action cannot be undone
            </div>
          </div>
        </div>
      </div>

      <!-- About Section -->
      <div class="settings-section">
        <h3 class="settings-section-title" data-section="about">
          <span id="about-arrow">▶</span> About
        </h3>
        <div id="about-section" class="settings-section-content hidden">
          <div class="settings-item">
            <div style="text-align: center; padding: 16px 0;">
              <div style="font-family: 'Leckerli One', cursive; font-size: 32px; color: var(--green-primary); margin-bottom: 8px;">*hint</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Version 1.0.0</div>
              <div style="font-size: 11px; color: var(--text-tertiary);">Built with ❤️ by hint team</div>
            </div>
          </div>

          <div class="settings-item">
            <button class="btn-small secondary" style="width: 100%; text-align: left;" onclick="window.open('https://github.com/wahans/hint', '_blank')">
              📖 Terms of Service
            </button>
          </div>

          <div class="settings-item">
            <button class="btn-small secondary" style="width: 100%; text-align: left;" onclick="window.open('https://github.com/wahans/hint', '_blank')">
              🔒 Privacy Policy
            </button>
          </div>

          <div class="settings-item">
            <button class="btn-small secondary" style="width: 100%; text-align: left;" onclick="window.open('https://github.com/wahans/hint', '_blank')">
              📜 Open Source Licenses
            </button>
          </div>
        </div>
      </div>

      <!-- Help & Support Section -->
      <div class="settings-section">
        <h3 class="settings-section-title" data-section="help">
          <span id="help-arrow">▶</span> Help & Support
        </h3>
        <div id="help-section" class="settings-section-content hidden">
          <div class="settings-item">
            <button class="btn-small secondary" style="width: 100%; text-align: left;" onclick="window.open('https://github.com/wahans/hint/issues', '_blank')">
              🐛 Report a Bug
            </button>
          </div>

          <div class="settings-item">
            <button class="btn-small secondary" style="width: 100%; text-align: left;" onclick="window.open('https://github.com/wahans/hint/discussions', '_blank')">
              💡 Request a Feature
            </button>
          </div>

          <div class="settings-item">
            <button class="btn-small secondary" style="width: 100%; text-align: left;" onclick="window.open('mailto:support@hint.com', '_blank')">
              📧 Contact Support
            </button>
          </div>

          <div class="settings-item" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <div style="font-size: 12px; color: var(--text-secondary); text-align: center;">
              <div style="margin-bottom: 4px;">hint Extension</div>
              <div style="font-weight: 600; color: var(--green-primary);">Version 1.0.0</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Section -->
      <div class="settings-section">
        <h3 class="settings-section-title" data-section="actions">
          <span id="actions-arrow">▶</span> Quick Actions
        </h3>
        <div id="actions-section" class="settings-section-content hidden">
          <div class="settings-item">
            <button id="clearRecentSettingsBtn" class="secondary btn-small" style="width: 100%;">
              🗑️ Clear Recently Viewed Friends
            </button>
          </div>

          <div class="settings-item">
            <button id="signOutFromSettingsBtn" class="secondary btn-small" style="width: 100%;">
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>

      <div id="settingsMessage" style="margin-top: 16px;"></div>
    </div>

    <button id="closeSettingsBtn" class="secondary">Close</button>
  `;

  document.getElementById('modalOverlay').classList.add('show');

  // Add event listeners
  document.getElementById('closeSettingsBtn').addEventListener('click', ui.hideModal);
  document.getElementById('saveNameBtn').addEventListener('click', saveDisplayName);
  document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
  document.getElementById('clearRecentSettingsBtn').addEventListener('click', clearRecentFriends);

  // Import logout dynamically to avoid circular dependency
  document.getElementById('signOutFromSettingsBtn').addEventListener('click', async () => {
    const { logout } = await import('./auth.js');
    logout();
  });

  document.getElementById('exportDataBtn').addEventListener('click', exportAllData);
  document.getElementById('deleteAccountBtn').addEventListener('click', deleteAccount);

  // Preference selects
  document.getElementById('currencySelect').addEventListener('change', saveCurrencyPreference);
  document.getElementById('defaultVisibilitySelect').addEventListener('change', saveDefaultVisibility);

  // Privacy settings
  document.getElementById('friendRequestPrivacySelect').addEventListener('change', savePrivacySettings);
  document.getElementById('profileVisibilityToggle').addEventListener('change', savePrivacySettings);
  document.getElementById('leaderboardVisibilityToggle').addEventListener('change', savePrivacySettings);

  // Add click listeners to all section titles
  document.querySelectorAll('.settings-section-title').forEach(title => {
    title.addEventListener('click', function() {
      const sectionName = this.getAttribute('data-section');
      toggleSettingsSection(sectionName);
    });
  });

  // Theme button listeners
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const theme = this.getAttribute('data-theme');

      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      document.documentElement.setAttribute('data-theme', theme);
      await chrome.storage.local.set({ theme });

      showSettingsMessage(`${theme === 'dark' ? '🌙' : '☀️'} ${theme.charAt(0).toUpperCase() + theme.slice(1)} mode activated!`, 'success');
    });
  });

  // Load current notification preferences
  loadNotificationPreferences();
  loadPushNotificationSettings();
  loadUserStats();
  loadPreferences();
  loadPrivacySettings();
  loadThemePreference();

  // Add listeners for email notification toggles
  document.getElementById('emailNotificationsToggle').addEventListener('change', saveNotificationPreferences);
  document.getElementById('friendRequestToggle').addEventListener('change', saveNotificationPreferences);

  // Add listeners for push notification toggles
  document.getElementById('pushNotificationsToggle').addEventListener('change', savePushNotificationSettings);
  document.getElementById('pushPriceDropsToggle').addEventListener('change', savePushNotificationSettings);
  document.getElementById('pushBackInStockToggle').addEventListener('change', savePushNotificationSettings);
  document.getElementById('pushClaimsToggle').addEventListener('change', savePushNotificationSettings);
  document.getElementById('pushFriendActivityToggle').addEventListener('change', savePushNotificationSettings);
  document.getElementById('pushKeyDateRemindersToggle').addEventListener('change', savePushNotificationSettings);

  // Price drop threshold slider
  const thresholdSlider = document.getElementById('priceDropThreshold');
  const thresholdValue = document.getElementById('thresholdValue');
  thresholdSlider.addEventListener('input', () => {
    thresholdValue.textContent = thresholdSlider.value + '%';
  });
  thresholdSlider.addEventListener('change', savePushNotificationSettings);

  // Test notification button
  document.getElementById('testNotificationBtn').addEventListener('click', testPushNotification);
}

export function toggleSettingsSection(sectionName) {
  const section = document.getElementById(`${sectionName}-section`);
  const arrow = document.getElementById(`${sectionName}-arrow`);

  if (section && arrow) {
    if (section.classList.contains('hidden')) {
      section.classList.remove('hidden');
      arrow.textContent = '▼';
    } else {
      section.classList.add('hidden');
      arrow.textContent = '▶';
    }
  }
}

export async function saveDisplayName() {
  const newName = document.getElementById('settingsName').value.trim();

  if (!newName) {
    showAccountMessage('Please enter a name', 'error');
    return;
  }

  try {
    await api.supabaseRequest('PATCH', `/rest/v1/users?id=eq.${state.currentUser.id}`, {
      name: newName
    });

    if (state.currentUser.user_metadata) {
      state.currentUser.user_metadata.name = newName;
    } else {
      state.currentUser.name = newName;
    }

    showApp();
    showAccountMessage('Name saved!', 'success');
  } catch (error) {
    console.error('Error updating name:', error);
    showAccountMessage('Error updating name', 'error');
  }
}

export async function changePassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    showAccountMessage('Please fill in all password fields', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showAccountMessage('New password must be at least 6 characters', 'error');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showAccountMessage('New passwords do not match', 'error');
    return;
  }

  try {
    showAccountMessage('Changing password...', 'info');

    const session = await chrome.storage.local.get('session');
    const token = session.session?.access_token;

    const response = await fetch(`${state.supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': state.supabaseKey,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        password: newPassword
      })
    });

    if (response.ok) {
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmNewPassword').value = '';

      showAccountMessage('Password changed successfully!', 'success');
    } else {
      const error = await response.json();
      showAccountMessage(error.message || 'Error changing password', 'error');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    showAccountMessage('Error changing password. Please try again.', 'error');
  }
}

export function showAccountMessage(text, type) {
  const el = document.getElementById('accountMessage');
  if (el) {
    el.className = type === 'error' ? 'error-message' : 'success-message';
    el.textContent = text;

    setTimeout(() => {
      el.textContent = '';
      el.className = '';
    }, 3000);
  }
}

export async function loadNotificationPreferences() {
  try {
    const prefs = await chrome.storage.local.get([
      'emailNotifications',
      'friendRequestNotifications'
    ]);

    const emailToggle = document.getElementById('emailNotificationsToggle');
    const friendToggle = document.getElementById('friendRequestToggle');

    if (emailToggle) emailToggle.checked = prefs.emailNotifications !== false;
    if (friendToggle) friendToggle.checked = prefs.friendRequestNotifications !== false;
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

export async function saveNotificationPreferences() {
  try {
    const emailNotifications = document.getElementById('emailNotificationsToggle')?.checked ?? true;
    const friendRequestNotifications = document.getElementById('friendRequestToggle')?.checked ?? true;

    await chrome.storage.local.set({
      emailNotifications,
      friendRequestNotifications
    });

    await api.supabaseRequest('PATCH', `/rest/v1/users?id=eq.${state.currentUser.id}`, {
      email_notifications_enabled: emailNotifications,
      friend_request_notifications: friendRequestNotifications
    });

    showSettingsMessage('Preferences saved', 'success');
  } catch (error) {
    console.error('Error saving preferences:', error);
    showSettingsMessage('Error saving preferences', 'error');
  }
}

export async function loadPushNotificationSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_NOTIFICATION_SETTINGS' });
    const settings = response?.settings || {};

    const pushToggle = document.getElementById('pushNotificationsToggle');
    const priceDropsToggle = document.getElementById('pushPriceDropsToggle');
    const backInStockToggle = document.getElementById('pushBackInStockToggle');
    const claimsToggle = document.getElementById('pushClaimsToggle');
    const friendActivityToggle = document.getElementById('pushFriendActivityToggle');
    const keyDateRemindersToggle = document.getElementById('pushKeyDateRemindersToggle');
    const thresholdSlider = document.getElementById('priceDropThreshold');
    const thresholdValue = document.getElementById('thresholdValue');

    if (pushToggle) pushToggle.checked = settings.enabled !== false;
    if (priceDropsToggle) priceDropsToggle.checked = settings.priceDrops !== false;
    if (backInStockToggle) backInStockToggle.checked = settings.backInStock !== false;
    if (claimsToggle) claimsToggle.checked = settings.claims !== false;
    if (friendActivityToggle) friendActivityToggle.checked = settings.friendActivity !== false;
    if (keyDateRemindersToggle) keyDateRemindersToggle.checked = settings.keyDateReminders !== false;

    if (thresholdSlider && thresholdValue) {
      const threshold = settings.priceDropThreshold || 10;
      thresholdSlider.value = threshold;
      thresholdValue.textContent = threshold + '%';
    }

    updatePushNotificationUIState(settings.enabled !== false);
  } catch (error) {
    console.error('Error loading push notification settings:', error);
  }
}

export async function savePushNotificationSettings() {
  try {
    const settings = {
      enabled: document.getElementById('pushNotificationsToggle')?.checked ?? true,
      priceDrops: document.getElementById('pushPriceDropsToggle')?.checked ?? true,
      priceDropThreshold: parseInt(document.getElementById('priceDropThreshold')?.value || '10'),
      backInStock: document.getElementById('pushBackInStockToggle')?.checked ?? true,
      claims: document.getElementById('pushClaimsToggle')?.checked ?? true,
      friendActivity: document.getElementById('pushFriendActivityToggle')?.checked ?? true,
      keyDateReminders: document.getElementById('pushKeyDateRemindersToggle')?.checked ?? true
    };

    await chrome.runtime.sendMessage({
      type: 'UPDATE_NOTIFICATION_SETTINGS',
      settings
    });

    updatePushNotificationUIState(settings.enabled);
    showSettingsMessage('Notification settings saved', 'success');
  } catch (error) {
    console.error('Error saving push notification settings:', error);
    showSettingsMessage('Error saving settings', 'error');
  }
}

export function updatePushNotificationUIState(enabled) {
  const childToggles = [
    'pushPriceDropsToggle',
    'pushBackInStockToggle',
    'pushClaimsToggle',
    'pushFriendActivityToggle',
    'pushKeyDateRemindersToggle',
    'priceDropThreshold'
  ];

  childToggles.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = !enabled;
      el.style.opacity = enabled ? '1' : '0.5';
    }
  });

  const testBtn = document.getElementById('testNotificationBtn');
  if (testBtn) {
    testBtn.disabled = !enabled;
    testBtn.style.opacity = enabled ? '1' : '0.5';
  }
}

export async function testPushNotification() {
  try {
    const btn = document.getElementById('testNotificationBtn');
    if (btn) {
      btn.textContent = '🔔 Sending...';
      btn.disabled = true;
    }

    await chrome.runtime.sendMessage({ type: 'TEST_NOTIFICATION' });
    showSettingsMessage('Test notification sent!', 'success');

    setTimeout(() => {
      if (btn) {
        btn.textContent = '🔔 Test Notification';
        btn.disabled = false;
      }
    }, 2000);
  } catch (error) {
    console.error('Error sending test notification:', error);
    showSettingsMessage('Error sending notification', 'error');

    const btn = document.getElementById('testNotificationBtn');
    if (btn) {
      btn.textContent = '🔔 Test Notification';
      btn.disabled = false;
    }
  }
}

export function showSettingsMessage(text, type) {
  const el = document.getElementById('settingsMessage');
  if (el) {
    el.className = type === 'error' ? 'error-message' : 'success-message';
    el.textContent = text;

    setTimeout(() => {
      el.textContent = '';
      el.className = '';
    }, 3000);
  }
}

export async function exportAllData() {
  try {
    showSettingsMessage('Preparing export...', 'info');

    const lists = state.currentLists || [];
    const products = state.currentProducts || [];

    let csv = 'List Name,Product Name,URL,Current Price,Claimed,Created At\n';

    lists.forEach(list => {
      const listProducts = products.filter(p => p.list_id === list.id);

      if (listProducts.length === 0) {
        csv += `"${list.name}",,,,,${list.created_at}\n`;
      } else {
        listProducts.forEach(product => {
          csv += `"${list.name}","${product.name}","${product.url || ''}","${product.current_price || ''}","${product.claimed_by ? 'Yes' : 'No'}","${product.created_at}"\n`;
        });
      }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hint-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showSettingsMessage('Export complete!', 'success');
  } catch (error) {
    console.error('Error exporting data:', error);
    showSettingsMessage('Error exporting data', 'error');
  }
}

export async function loadUserStats() {
  try {
    const lists = state.currentLists || [];
    const products = state.currentProducts || [];

    const friends = await api.supabaseRPC('get_friends', {});

    const statsLists = document.getElementById('statsLists');
    const statsProducts = document.getElementById('statsProducts');
    const statsFriends = document.getElementById('statsFriends');

    if (statsLists) statsLists.textContent = lists.length;
    if (statsProducts) statsProducts.textContent = products.length;
    if (statsFriends) statsFriends.textContent = friends?.length || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

export async function loadPreferences() {
  try {
    const prefs = await chrome.storage.local.get(['currency', 'defaultVisibility']);

    if (prefs.currency) {
      const currencySelect = document.getElementById('currencySelect');
      if (currencySelect) currencySelect.value = prefs.currency;
    }

    if (prefs.defaultVisibility) {
      const visibilitySelect = document.getElementById('defaultVisibilitySelect');
      if (visibilitySelect) visibilitySelect.value = prefs.defaultVisibility;
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

export async function saveCurrencyPreference() {
  try {
    const currency = document.getElementById('currencySelect').value;
    await chrome.storage.local.set({ currency });
    showSettingsMessage('Currency preference saved', 'success');
  } catch (error) {
    console.error('Error saving currency:', error);
    showSettingsMessage('Error saving currency', 'error');
  }
}

export async function saveDefaultVisibility() {
  try {
    const defaultVisibility = document.getElementById('defaultVisibilitySelect').value;
    await chrome.storage.local.set({ defaultVisibility });
    showSettingsMessage('Default visibility saved', 'success');
  } catch (error) {
    console.error('Error saving visibility:', error);
    showSettingsMessage('Error saving visibility', 'error');
  }
}

export async function loadPrivacySettings() {
  try {
    const prefs = await chrome.storage.local.get(['friendRequestPrivacy', 'profileVisibility', 'leaderboardVisibility']);

    if (prefs.friendRequestPrivacy) {
      const privacySelect = document.getElementById('friendRequestPrivacySelect');
      if (privacySelect) privacySelect.value = prefs.friendRequestPrivacy;
    }

    const profileToggle = document.getElementById('profileVisibilityToggle');
    const leaderboardToggle = document.getElementById('leaderboardVisibilityToggle');

    if (profileToggle) profileToggle.checked = prefs.profileVisibility !== false;
    if (leaderboardToggle) leaderboardToggle.checked = prefs.leaderboardVisibility !== false;
  } catch (error) {
    console.error('Error loading privacy settings:', error);
  }
}

export async function loadThemePreference() {
  try {
    const { theme } = await chrome.storage.local.get('theme');

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-theme') === (theme || 'light')) {
        btn.classList.add('active');
      }
    });
  } catch (error) {
    console.error('Error loading theme preference:', error);
  }
}

export async function savePrivacySettings() {
  try {
    const friendRequestPrivacy = document.getElementById('friendRequestPrivacySelect').value;
    const profileVisibility = document.getElementById('profileVisibilityToggle').checked;
    const leaderboardVisibility = document.getElementById('leaderboardVisibilityToggle').checked;

    await chrome.storage.local.set({
      friendRequestPrivacy,
      profileVisibility,
      leaderboardVisibility
    });

    showSettingsMessage('Privacy settings saved', 'success');
  } catch (error) {
    console.error('Error saving privacy settings:', error);
    showSettingsMessage('Error saving privacy settings', 'error');
  }
}

export async function deleteAccount() {
  const confirmation = prompt('This will permanently delete your account and all data. Type DELETE to confirm:');

  if (confirmation !== 'DELETE') {
    showSettingsMessage('Account deletion cancelled', 'info');
    return;
  }

  const finalConfirmation = confirm('Are you absolutely sure? This cannot be undone.');

  if (!finalConfirmation) {
    showSettingsMessage('Account deletion cancelled', 'info');
    return;
  }

  try {
    showSettingsMessage('Deleting account...', 'info');

    await api.supabaseRequest('DELETE', `/rest/v1/users?id=eq.${state.currentUser.id}`);
    await chrome.storage.local.clear();

    alert('Your account has been deleted. Thank you for using hint!');
    window.location.reload();
  } catch (error) {
    console.error('Error deleting account:', error);
    showSettingsMessage('Error deleting account. Please contact support.', 'error');
  }
}

export async function clearRecentFriends() {
  if (confirm('Clear recently viewed friends?')) {
    try {
      await chrome.storage.local.set({ recentFriends: [] });
      showSettingsMessage('Recently viewed friends cleared', 'success');
    } catch (error) {
      console.error('Error clearing recent friends:', error);
      showSettingsMessage('Error clearing recent friends', 'error');
    }
  }
}
