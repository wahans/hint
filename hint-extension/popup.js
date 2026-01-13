// Hint Extension - Complete Working Version with Friends
// Copy this ENTIRE file and replace your popup.js

let supabaseUrl = '';
let supabaseKey = '';
let currentUser = null;
let currentLists = [];
let currentProducts = [];
let viewingListId = null;
let expandedLists = new Set(); // Track which lists are expanded

// ============================================
// UI HELPER FUNCTIONS - Phase 5 Micro-interactions
// ============================================

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-hide
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Skeleton loading for lists
function showListsSkeleton(container, count = 3) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'list-item';
    skeleton.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div class="skeleton skeleton-text lg" style="width: 150px;"></div>
        <div style="display: flex; gap: 6px;">
          <div class="skeleton" style="width: 50px; height: 20px; border-radius: 10px;"></div>
          <div class="skeleton" style="width: 60px; height: 20px; border-radius: 10px;"></div>
        </div>
      </div>
      <div style="display: flex; gap: 6px;">
        <div class="skeleton" style="width: 36px; height: 32px;"></div>
        <div class="skeleton" style="width: 36px; height: 32px;"></div>
        <div class="skeleton" style="width: 36px; height: 32px;"></div>
      </div>
    `;
    container.appendChild(skeleton);
  }
}

// Skeleton loading for products
function showProductsSkeleton(container, count = 3) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'product-item';
    skeleton.innerHTML = `
      <div class="skeleton skeleton-thumbnail"></div>
      <div class="product-details" style="flex: 1;">
        <div class="skeleton skeleton-text lg" style="margin-bottom: 8px;"></div>
        <div class="skeleton skeleton-text sm"></div>
      </div>
    `;
    container.appendChild(skeleton);
  }
}

// Button loading state
function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add('loading');
    button.dataset.originalText = button.textContent;
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
    button.disabled = false;
  }
}

// Shake animation for errors
function shakeElement(element) {
  element.classList.add('shake');
  setTimeout(() => element.classList.remove('shake'), 500);
}

// Stagger animation for list items
function animateListItems(container, selector = '.product-item') {
  const items = container.querySelectorAll(selector);
  items.forEach((item, index) => {
    item.style.opacity = '0';
    item.classList.add('animate-in');
    setTimeout(() => {
      item.style.opacity = '';
    }, index * 50 + 300);
  });
}

// Create product preview dots for collapsed lists
function createProductPreview(products, maxDots = 5) {
  const preview = document.createElement('div');
  preview.className = 'list-products-preview';

  const displayCount = Math.min(products.length, maxDots);
  for (let i = 0; i < displayCount; i++) {
    const dot = document.createElement('span');
    dot.className = 'preview-dot';
    if (products[i].claimed_by) {
      dot.classList.add('claimed');
    }
    preview.appendChild(dot);
  }

  if (products.length > maxDots) {
    const more = document.createElement('span');
    more.className = 'preview-more';
    more.textContent = `+${products.length - maxDots} more`;
    preview.appendChild(more);
  }

  return preview;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadTheme();
  await loadConfig();
  setupEventListeners();
});

async function loadTheme() {
  const { theme } = await chrome.storage.local.get('theme');
  if (theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

async function loadConfig() {
  const config = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey', 'session']);
  
  if (config.supabaseUrl && config.supabaseKey) {
    supabaseUrl = config.supabaseUrl;
    supabaseKey = config.supabaseKey;
    
    if (config.session && config.session.user) {
      currentUser = config.session.user;
      showApp();
      await loadUserData();
      await autoFillCurrentPage();
    } else if (config.session && config.session.access_token) {
      currentUser = config.session;
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

function setupEventListeners() {
  document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
  document.getElementById('showConfigLink').addEventListener('click', (e) => {
    e.preventDefault();
    showConfig();
  });
  
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('loginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      login();
    }
  });
  document.getElementById('signupBtn').addEventListener('click', signup);
  document.getElementById('signupPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      signup();
    }
  });
  document.getElementById('showSignupBtn').addEventListener('click', showSignup);
  document.getElementById('showLoginLink').addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  document.getElementById('addTab').addEventListener('click', () => switchTab('add'));
  document.getElementById('myListsTab').addEventListener('click', () => switchTab('myLists'));
  document.getElementById('myClaimsTab').addEventListener('click', () => switchTab('myClaims'));
  document.getElementById('viewHintlistTab').addEventListener('click', () => switchTab('viewHintlist'));
  
  // Header Friends buttons
  const browseFriendsBtn = document.getElementById('browseFriendsBtn');
  if (browseFriendsBtn) {
    browseFriendsBtn.addEventListener('click', () => {
      switchTab('add'); // Switch to first tab
      loadBrowseFriendsModal();
    });
  }
  
  // Footer Settings button
  const footerSettingsBtn = document.getElementById('footerSettingsBtn');
  if (footerSettingsBtn) {
    footerSettingsBtn.addEventListener('click', openSettingsModal);
  }
  
  // Leaderboard button
  const leaderboardBtn = document.getElementById('leaderboardBtn');
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', openLeaderboardModal);
  }
  
  // Actions - with safety checks
  const createListBtn = document.getElementById('createListBtn');
  if (createListBtn) {
    createListBtn.addEventListener('click', createNewList);
  }
  
  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', addProduct);
  }
  
  const loadHintlistBtn = document.getElementById('loadHintlistBtn');
  if (loadHintlistBtn) {
    loadHintlistBtn.addEventListener('click', loadHintlist);
  }
  
  const hintlistCodeInput = document.getElementById('hintlistCode');
  if (hintlistCodeInput) {
    hintlistCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadHintlist();
      }
    });
  }
  
  const refreshBtn = document.getElementById('refreshListsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      showMessage('addMessage', 'Refreshing...', 'info');
      await loadUserData();
      showMessage('addMessage', 'Lists refreshed!', 'success');
    });
  }
  
  const createListFromMyListsBtn = document.getElementById('createListFromMyListsBtn');
  if (createListFromMyListsBtn) {
    createListFromMyListsBtn.addEventListener('click', createNewList);
  }
  
  const refreshClaimsBtn = document.getElementById('refreshClaimsBtn');
  if (refreshClaimsBtn) {
    refreshClaimsBtn.addEventListener('click', async () => {
      await loadMyClaims();
    });
  }
  
  const refreshFriendsBtn = document.getElementById('refreshFriendsBtn');
  if (refreshFriendsBtn) {
    refreshFriendsBtn.addEventListener('click', async () => {
      await loadBrowseFriends();
    });
  }
  
  const clearRecentBtn = document.getElementById('clearRecentBtn');
  if (clearRecentBtn) {
    clearRecentBtn.addEventListener('click', async () => {
      await chrome.storage.local.set({ recentFriends: [] });
      await loadBrowseFriends();
    });
  }
  
  const friendSearchInput = document.getElementById('friendSearchInput');
  if (friendSearchInput) {
    friendSearchInput.addEventListener('input', (e) => {
      filterFriends(e.target.value);
    });
  }
}

async function saveConfig() {
  console.log('saveConfig called');
  
  const url = document.getElementById('supabaseUrl').value.trim();
  const key = document.getElementById('supabaseKey').value.trim();
  
  console.log('URL:', url ? 'provided' : 'empty');
  console.log('Key:', key ? 'provided' : 'empty');
  
  if (!url || !key) {
    showMessage('configMessage', 'Please enter both URL and key', 'error');
    return;
  }
  
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    showMessage('configMessage', 'Please enter a valid Supabase URL', 'error');
    return;
  }
  
  try {
    await chrome.storage.local.set({ supabaseUrl: url, supabaseKey: key });
    supabaseUrl = url;
    supabaseKey = key;
    
    console.log('✅ Config saved successfully');
    showMessage('configMessage', 'Configuration saved!', 'success');
    setTimeout(() => showLogin(), 1000);
  } catch (error) {
    console.error('❌ Error saving config:', error);
    showMessage('configMessage', 'Error saving configuration', 'error');
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showMessage('loginMessage', 'Please enter email and password', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.error) {
      showMessage('loginMessage', data.error.message || 'Login failed', 'error');
      return;
    }
    
    await chrome.storage.local.set({ session: data });
    currentUser = data.user;
    await ensureUserRecord();
    
    showMessage('loginMessage', 'Logged in successfully!', 'success');
    setTimeout(() => {
      showApp();
      loadUserData();
      autoFillCurrentPage();
    }, 500);
  } catch (error) {
    showMessage('loginMessage', 'Connection error.', 'error');
  }
}

async function signup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  
  if (!name || !email || !password) {
    showMessage('signupMessage', 'Please fill in all fields', 'error');
    return;
  }
  
  if (password.length < 6) {
    showMessage('signupMessage', 'Password must be at least 6 characters', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, data: { name } })
    });
    
    const data = await response.json();
    
    if (data.error) {
      showMessage('signupMessage', data.error.message || 'Signup failed', 'error');
      return;
    }
    
    await chrome.storage.local.set({ session: data });
    currentUser = data.user;
    await ensureUserRecord(name);
    
    showMessage('signupMessage', 'Account created!', 'success');
    setTimeout(() => {
      showApp();
      loadUserData();
      autoFillCurrentPage();
    }, 500);
  } catch (error) {
    showMessage('signupMessage', 'Connection error.', 'error');
  }
}

async function logout() {
  await chrome.storage.local.remove('session');
  currentUser = null;
  currentLists = [];
  currentProducts = [];
  viewingListId = null;
  showLogin();
}

async function ensureUserRecord(name = null) {
  const session = await chrome.storage.local.get('session');
  const token = session.session?.access_token;
  
  if (!token || !currentUser) return;
  
  try {
    await supabaseRequest('POST', '/rest/v1/users', {
      id: currentUser.id,
      email: currentUser.email,
      name: name || currentUser.email.split('@')[0]
    }, token);
  } catch (error) {
    // User might already exist
  }
}

async function supabaseRequest(method, endpoint, body = null, token = null) {
  const session = await chrome.storage.local.get('session');
  const accessToken = token || session.session?.access_token;
  
  const headers = {
    'apikey': supabaseKey,
    'Content-Type': 'application/json'
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const options = { method, headers };
  
  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${supabaseUrl}${endpoint}`, options);
  const responseText = await response.text();
  
  // Handle 401 Unauthorized (expired token)
  if (response.status === 401) {
    // Try to refresh the token
    const refreshed = await refreshSession();
    
    if (refreshed) {
      // Retry the request with new token
      return supabaseRequest(method, endpoint, body);
    } else {
      // Refresh failed, logout
      await logout();
      throw new Error('Session expired. Please login again.');
    }
  }
  
  if (responseText) {
    return JSON.parse(responseText);
  }
  
  return null;
}

async function refreshSession() {
  try {
    const session = await chrome.storage.local.get('session');
    const refreshToken = session.session?.refresh_token;
    
    if (!refreshToken) {
      return false;
    }
    
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 
        'apikey': supabaseKey, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    const data = await response.json();
    
    if (data.error || !data.access_token) {
      return false;
    }
    
    // Save new session
    await chrome.storage.local.set({ session: data });
    currentUser = data.user;
    
    return true;
  } catch (error) {
    return false;
  }
}

async function autoFillCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) return;
    
    const url = tab.url;
    const title = tab.title || '';
    
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return;
    }
    
    document.getElementById('productUrl').value = url;
    
    if (title && !document.getElementById('productName').value) {
      document.getElementById('productName').value = title;
    }
    
    // Try to extract price from the page using content script
    try {
      const priceData = await chrome.tabs.sendMessage(tab.id, { action: 'extractPrice' });
      if (priceData && priceData.price) {
        // Store the extracted price for when we add the product
        window.extractedPrice = priceData.price;
        window.extractedInStock = priceData.inStock;
        
        // Show price preview
        const pricePreview = document.getElementById('pricePreview');
        if (pricePreview) {
          pricePreview.textContent = `Detected price: $${priceData.price}`;
          pricePreview.style.display = 'block';
        }
      }
    } catch (priceError) {
      // Content script not available or failed - that's ok
      console.log('Price extraction not available:', priceError.message);
      window.extractedPrice = null;
      window.extractedInStock = null;
    }
  } catch (error) {
    // Ignore errors on restricted pages
  }
}

async function loadUserData() {
  const container = document.getElementById('myListsContainer');

  // Show skeleton loading
  showListsSkeleton(container, 3);

  try {
    // Only get lists owned by the current user
    currentLists = await supabaseRequest('GET', `/rest/v1/lists?user_id=eq.${currentUser.id}&select=*&order=created_at.desc`);

    const productRequests = currentLists.map(list =>
      supabaseRequest('GET', `/rest/v1/products?list_id=eq.${list.id}&select=*`)
    );

    const allProducts = await Promise.all(productRequests);
    currentProducts = allProducts.flat();

    updateListsDropdown();
    displayMyLists();
  } catch (error) {
    showMessage('addMessage', 'Error loading data', 'error');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">😕</div><div>Error loading lists</div></div>';
  }
}

function updateListsDropdown() {
  const select = document.getElementById('listSelect');
  select.innerHTML = '<option value="">Select a list...</option>';
  
  currentLists.forEach(list => {
    const option = document.createElement('option');
    option.value = list.id;
    option.textContent = list.name;
    select.appendChild(option);
  });
}

function displayMyLists() {
  const container = document.getElementById('myListsContainer');
  container.innerHTML = '';

  if (currentLists.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">No lists yet</div>
        <div style="font-size: 13px;">Create your first hintlist to get started!</div>
      </div>
    `;
    return;
  }

  currentLists.forEach((list, listIndex) => {
    const products = currentProducts.filter(p => p.list_id === list.id);
    const listDiv = document.createElement('div');
    listDiv.className = 'list-item collapsible';
    listDiv.style.animationDelay = `${listIndex * 50}ms`;

    // Check if already expanded
    if (expandedLists.has(list.id)) {
      listDiv.classList.add('expanded');
    }
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'list-header';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'list-name';
    nameDiv.textContent = list.name;
    headerDiv.appendChild(nameDiv);
    
    const badgesDiv = document.createElement('div');
    badgesDiv.className = 'list-badges';
    
    const publicBadge = document.createElement('span');
    publicBadge.className = `badge ${list.is_public ? 'public' : 'private'}`;
    publicBadge.textContent = list.is_public ? 'Public' : 'Private';
    badgesDiv.appendChild(publicBadge);
    
    const countBadge = document.createElement('span');
    countBadge.className = 'badge count';
    countBadge.textContent = `${products.length} items`;
    badgesDiv.appendChild(countBadge);
    
    // Claimed count badge (without revealing who)
    const claimedCount = products.filter(p => p.claimed_by).length;
    if (claimedCount > 0) {
      const claimedBadge = document.createElement('span');
      claimedBadge.className = 'badge claimed';
      claimedBadge.textContent = `${claimedCount} claimed`;
      claimedBadge.title = `${claimedCount} of ${products.length} items have been claimed by others`;
      badgesDiv.appendChild(claimedBadge);
    }
    
    // Key date badge (if set)
    if (list.key_date) {
      const keyDate = new Date(list.key_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      keyDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((keyDate - today) / (1000 * 60 * 60 * 24));
      
      const dateBadge = document.createElement('span');
      dateBadge.className = 'badge';
      
    }
    
    headerDiv.appendChild(badgesDiv);
    listDiv.appendChild(headerDiv);
    
    // Key date on separate line below header (if set)
    if (list.key_date) {
      const keyDate = new Date(list.key_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      keyDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((keyDate - today) / (1000 * 60 * 60 * 24));
      
      const dateLineDiv = document.createElement('div');
      dateLineDiv.style.marginBottom = '8px';
      dateLineDiv.style.fontSize = '13px';
      dateLineDiv.style.fontWeight = '600';
      
      // Color based on urgency
      if (daysUntil <= 15) {
        dateLineDiv.style.color = 'var(--error-text)'; // red
      } else if (daysUntil <= 30) {
        dateLineDiv.style.color = 'var(--warning-text)'; // yellow  
      } else {
        dateLineDiv.style.color = 'var(--green-primary)'; // green
      }
      
      // Format date as m/d/yy (no leading zeros)
      const month = keyDate.getMonth() + 1;
      const day = keyDate.getDate();
      const year = keyDate.getFullYear().toString().slice(-2);
      const formattedDate = `${month}/${day}/${year}`;
      
      dateLineDiv.textContent = `📅 ${formattedDate} (${daysUntil}d)`;
      listDiv.appendChild(dateLineDiv);
    }
    
    // List actions - REORGANIZED for clarity
    const actionsDiv = document.createElement('div');
    actionsDiv.style.marginTop = '8px';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '6px';
    actionsDiv.style.flexWrap = 'wrap';
    actionsDiv.style.alignItems = 'center';
    
    // PRIMARY ACTIONS (most used, always visible)
    
    // Expand/Collapse button
    const expandBtn = document.createElement('button');
    expandBtn.className = 'btn-icon secondary';
    expandBtn.textContent = expandedLists.has(list.id) ? '▼' : '▶';
    expandBtn.setAttribute('data-tooltip', expandedLists.has(list.id) ? 'Hide items' : 'Show items');
    expandBtn.id = `expand-${list.id}`;
    // Note: Event listener added after products container is created
    actionsDiv.appendChild(expandBtn);

    // Share button (for public lists - combines invite functionality)
    if (list.is_public) {
      const shareBtn = document.createElement('button');
      shareBtn.className = 'btn-icon';
      shareBtn.textContent = '📤';
      shareBtn.setAttribute('data-tooltip', 'Share list');
      shareBtn.addEventListener('click', () => openInviteModal(list));
      actionsDiv.appendChild(shareBtn);
    }

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn-icon secondary';
    exportBtn.textContent = '📥';
    exportBtn.setAttribute('data-tooltip', 'Export to Excel');
    exportBtn.addEventListener('click', () => exportListToExcel(list, products));
    actionsDiv.appendChild(exportBtn);
    
    // SECONDARY ACTIONS DROPDOWN (⋮ More menu)
    const moreBtn = document.createElement('button');
    moreBtn.className = 'btn-icon secondary';
    moreBtn.textContent = '⋮';
    moreBtn.setAttribute('data-tooltip', 'More options');
    moreBtn.style.position = 'relative';
    
    const dropdownId = `dropdown-${list.id}`;
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close all other dropdowns first
      document.querySelectorAll('.actions-dropdown').forEach(d => {
        if (d.id !== dropdownId) d.remove();
      });
      
      const existing = document.getElementById(dropdownId);
      if (existing) {
        existing.remove();
        return;
      }
      
      const dropdown = document.createElement('div');
      dropdown.id = dropdownId;
      dropdown.className = 'actions-dropdown';

      // Build dropdown HTML based on list settings
      const notificationLevel = list.notification_level || 'none';
      const notifyIcon = notificationLevel === 'none' ? '🔕' : notificationLevel === 'who_only' ? '👤' : notificationLevel === 'what_only' ? '🎁' : '🔔';

      let dropdownHTML = `
        <button class="dropdown-item" data-action="toggle">${list.is_public ? '🔒 Make Private' : '🌍 Make Public'}</button>
        <button class="dropdown-item" data-action="rename">✏️ Rename</button>
        <button class="dropdown-item" data-action="date">📅 ${list.key_date ? 'Edit Date' : 'Set Date'}</button>`;

      // Add notification options for public lists
      if (list.is_public) {
        dropdownHTML += `
        <div class="dropdown-divider"></div>
        <div style="padding: 6px 16px; font-size: 11px; color: var(--text-secondary); font-weight: 600;">NOTIFICATIONS</div>
        <button class="dropdown-item" data-action="notify-none" style="${notificationLevel === 'none' ? 'background: var(--green-light);' : ''}">🔕 None</button>
        <button class="dropdown-item" data-action="notify-who" style="${notificationLevel === 'who_only' ? 'background: var(--green-light);' : ''}">👤 Who claimed</button>
        <button class="dropdown-item" data-action="notify-what" style="${notificationLevel === 'what_only' ? 'background: var(--green-light);' : ''}">🎁 What was claimed</button>
        <button class="dropdown-item" data-action="notify-both" style="${notificationLevel === 'both' ? 'background: var(--green-light);' : ''}">🔔 Both</button>`;
      }

      dropdownHTML += `
        <div class="dropdown-divider"></div>
        <button class="dropdown-item danger" data-action="delete">🗑️ Delete List</button>
      `;
      dropdown.innerHTML = dropdownHTML;
      
      // Smart positioning - check if dropdown will overflow bottom
      const rect = moreBtn.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate height
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      dropdown.style.position = 'fixed';
      dropdown.style.zIndex = '10000';
      
      // Position above if not enough space below
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        dropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`;
        dropdown.style.left = `${rect.left}px`;
      } else {
        dropdown.style.top = `${rect.bottom + 4}px`;
        dropdown.style.left = `${rect.left}px`;
      }
      
      document.body.appendChild(dropdown);
      
      // Add click handlers
      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          dropdown.remove();
          
          const action = item.dataset.action;
          switch(action) {
            case 'toggle':
              await toggleListPublic(list.id, !list.is_public);
              break;
            case 'rename':
              renameList(list.id, list.name);
              break;
            case 'date':
              setKeyDate(list.id, list.name, list.key_date);
              break;
            case 'delete':
              deleteList(list.id, list.name);
              break;
            case 'notify-none':
              await toggleListNotifications(list.id, 'none');
              break;
            case 'notify-who':
              await toggleListNotifications(list.id, 'who_only');
              break;
            case 'notify-what':
              await toggleListNotifications(list.id, 'what_only');
              break;
            case 'notify-both':
              await toggleListNotifications(list.id, 'both');
              break;
          }
        });
      });
      
      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', function closeDropdown() {
          dropdown.remove();
          document.removeEventListener('click', closeDropdown);
        });
      }, 10);
    });
    
    actionsDiv.appendChild(moreBtn);

    listDiv.appendChild(actionsDiv);

    // Add product preview dots (visible when collapsed)
    if (products.length > 0) {
      const preview = createProductPreview(products, 5);
      listDiv.appendChild(preview);
    }

    // Products container (collapsible)
    const productsContainer = document.createElement('div');
    productsContainer.id = `products-${list.id}`;
    productsContainer.className = 'list-products';
    productsContainer.style.marginTop = '12px';
    
    // Products
    products.forEach(product => {
      const productDiv = document.createElement('div');
      productDiv.className = 'product-item';
      
      // Thumbnail
      const thumbnailDiv = document.createElement('div');
      thumbnailDiv.className = 'product-thumbnail';
      if (product.image_url) {
        const img = document.createElement('img');
        img.src = product.image_url;
        img.alt = product.name;
        img.onerror = () => {
          thumbnailDiv.innerHTML = '<div class="product-thumbnail-placeholder">📦</div>';
        };
        thumbnailDiv.appendChild(img);
      } else {
        thumbnailDiv.innerHTML = '<div class="product-thumbnail-placeholder">📦</div>';
      }
      productDiv.appendChild(thumbnailDiv);
      
      // Product details container
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'product-details';
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'product-name';
      nameDiv.textContent = product.name;
      detailsDiv.appendChild(nameDiv);
      
      // Price with trend indicator
      if (product.current_price) {
        const priceContainer = document.createElement('div');
        priceContainer.style.display = 'flex';
        priceContainer.style.alignItems = 'center';
        priceContainer.style.gap = '8px';
        priceContainer.style.marginBottom = '4px';
        priceContainer.style.flexWrap = 'wrap';

        const currentPrice = parseFloat(product.current_price);
        const targetPrice = product.target_price ? parseFloat(product.target_price) : null;
        const hasAlert = targetPrice && targetPrice > 0;
        const isPriceDrop = hasAlert && currentPrice <= targetPrice;

        const priceDiv = document.createElement('span');
        priceDiv.className = 'product-meta product-price-display';
        priceDiv.style.fontWeight = '600';
        priceDiv.style.fontSize = '14px';
        priceDiv.style.color = isPriceDrop ? 'var(--success-text)' : 'var(--green-primary)';
        priceDiv.textContent = `$${product.current_price}`;
        priceContainer.appendChild(priceDiv);

        // Price drop alert badge
        if (isPriceDrop) {
          const dropBadge = document.createElement('span');
          dropBadge.style.cssText = `
            display: inline-flex; align-items: center; gap: 4px;
            padding: 2px 8px; font-size: 10px; font-weight: 600;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white; border-radius: 10px;
            animation: pricePulse 2s ease-in-out infinite;
          `;
          dropBadge.textContent = '🎉 PRICE DROP!';
          dropBadge.title = `Target: $${targetPrice.toFixed(2)} - Now: $${currentPrice.toFixed(2)}`;
          priceContainer.appendChild(dropBadge);
        } else if (hasAlert) {
          // Show alert indicator (not yet triggered)
          const alertBadge = document.createElement('span');
          alertBadge.style.cssText = `
            display: inline-flex; align-items: center; gap: 3px;
            padding: 2px 6px; font-size: 10px;
            background: var(--bg-tertiary); color: var(--text-secondary);
            border-radius: 10px; border: 1px solid var(--border-color);
          `;
          alertBadge.textContent = `🔔 $${targetPrice.toFixed(2)}`;
          alertBadge.title = `Alert when price drops to $${targetPrice.toFixed(2)}`;
          priceContainer.appendChild(alertBadge);
        }

        // Price history button (opens chart modal)
        const historyBtn = document.createElement('button');
        historyBtn.className = 'btn-tiny';
        historyBtn.style.padding = '2px 6px';
        historyBtn.style.fontSize = '10px';
        historyBtn.style.background = 'var(--bg-tertiary)';
        historyBtn.style.color = 'var(--text-secondary)';
        historyBtn.style.border = '1px solid var(--border-color)';
        historyBtn.textContent = '📈';
        historyBtn.title = 'View price history';
        historyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showPriceHistory(product);
        });
        priceContainer.appendChild(historyBtn);

        detailsDiv.appendChild(priceContainer);
      }
      
      // Stock status indicator
      if (product.in_stock === false) {
        const stockDiv = document.createElement('div');
        stockDiv.style.display = 'inline-block';
        stockDiv.style.padding = '2px 8px';
        stockDiv.style.fontSize = '10px';
        stockDiv.style.fontWeight = '600';
        stockDiv.style.borderRadius = '4px';
        stockDiv.style.marginBottom = '4px';
        stockDiv.style.background = 'var(--error-bg)';
        stockDiv.style.color = 'var(--error-text)';
        stockDiv.textContent = '⚠️ Out of Stock';
        detailsDiv.appendChild(stockDiv);
      }
      
      if (product.url) {
        const urlDiv = document.createElement('div');
        urlDiv.className = 'product-url';
        urlDiv.textContent = product.url;
        detailsDiv.appendChild(urlDiv);
      }
      
      const productActionsDiv = document.createElement('div');
      productActionsDiv.className = 'product-actions';
      
      if (product.url) {
        const visitBtn = document.createElement('button');
        visitBtn.className = 'btn-icon';
        visitBtn.textContent = '🔗';
        visitBtn.setAttribute('data-tooltip', 'Visit page');
        visitBtn.addEventListener('click', () => window.open(product.url, '_blank'));
        productActionsDiv.appendChild(visitBtn);

        // Refresh Price button
        const refreshPriceBtn = document.createElement('button');
        refreshPriceBtn.className = 'btn-icon secondary';
        refreshPriceBtn.textContent = '💰';
        refreshPriceBtn.setAttribute('data-tooltip', 'Refresh price');
        refreshPriceBtn.addEventListener('click', () => refreshProductPrice(product, refreshPriceBtn));
        productActionsDiv.appendChild(refreshPriceBtn);
      }

      // Set price alert button
      if (product.current_price) {
        const alertBtn = document.createElement('button');
        const hasAlert = product.target_price && parseFloat(product.target_price) > 0;
        alertBtn.className = `btn-icon ${hasAlert ? '' : 'secondary'}`;
        alertBtn.textContent = '🔔';
        alertBtn.setAttribute('data-tooltip', hasAlert ? `Alert: $${parseFloat(product.target_price).toFixed(2)}` : 'Set alert');
        alertBtn.addEventListener('click', () => editProduct(product));
        productActionsDiv.appendChild(alertBtn);
      }

      const editProductBtn = document.createElement('button');
      editProductBtn.className = 'btn-icon secondary';
      editProductBtn.textContent = '✏️';
      editProductBtn.setAttribute('data-tooltip', 'Edit');
      editProductBtn.addEventListener('click', () => editProduct(product));
      productActionsDiv.appendChild(editProductBtn);

      const deleteProductBtn = document.createElement('button');
      deleteProductBtn.className = 'btn-icon danger';
      deleteProductBtn.textContent = '🗑️';
      deleteProductBtn.setAttribute('data-tooltip', 'Delete');
      deleteProductBtn.addEventListener('click', () => deleteProduct(product.id, product.name));
      productActionsDiv.appendChild(deleteProductBtn);
      
      detailsDiv.appendChild(productActionsDiv);
      productDiv.appendChild(detailsDiv);
      productsContainer.appendChild(productDiv);
    });
    
    listDiv.appendChild(productsContainer);

    // Expand/collapse toggle with smooth animation
    expandBtn.addEventListener('click', () => {
      const isExpanded = listDiv.classList.contains('expanded');

      if (!isExpanded) {
        // Expand
        listDiv.classList.add('expanded');
        expandBtn.textContent = '▼';
        expandBtn.setAttribute('data-tooltip', 'Hide items');
        expandedLists.add(list.id);

        // Animate products in
        setTimeout(() => animateListItems(productsContainer), 100);
      } else {
        // Collapse
        listDiv.classList.remove('expanded');
        expandBtn.textContent = '▶';
        expandBtn.setAttribute('data-tooltip', 'Show items');
        expandedLists.delete(list.id);
      }
    });

    // Also allow clicking on list header to expand/collapse
    const headerDiv = listDiv.querySelector('.list-header');
    headerDiv.style.cursor = 'pointer';
    headerDiv.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.actions-dropdown')) return;
      expandBtn.click();
    });

    container.appendChild(listDiv);
  });

  // Animate list cards on initial load
  const listCards = container.querySelectorAll('.list-item');
  listCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(8px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 50);
  });
}

async function createNewList() {
  showCustomModal(
    'Create New List',
    '<input type="text" id="newListName" class="modal-input" placeholder="List name (e.g., Birthday Hintlist)" autofocus>',
    async () => {
      const name = document.getElementById('newListName').value.trim();
      
      if (!name) {
        showMessage('addMessage', 'Please enter a list name', 'error');
        return;
      }
      
      try {
        const response = await supabaseRequest('POST', '/rest/v1/lists', {
          name: name,
          user_id: currentUser.id
        });
        
        // Award points for creating a list
        awardPoints('create_list', 2, `Created list: ${name}`);
        
        showMessage('addMessage', 'List created! +2 pts 🏆', 'success');
        await loadUserData();
        hideModal();
      } catch (error) {
        showMessage('addMessage', 'Error creating list', 'error');
      }
    }
  );
}

async function addProduct() {
  const name = document.getElementById('productName').value.trim();
  const url = document.getElementById('productUrl').value.trim();
  const listId = document.getElementById('listSelect').value;
  
  if (!name) {
    showMessage('addMessage', 'Please enter a product name', 'error');
    return;
  }
  
  if (!listId) {
    showMessage('addMessage', 'Please select a list', 'error');
    return;
  }
  
  try {
    showMessage('addMessage', 'Adding product...', 'info');
    
    // Extract image from URL if provided
    let imageUrl = null;
    if (url) {
      try {
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoYnF5eHRqbWJvcmRjanRxeW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzY0MDksImV4cCI6MjA4MjYxMjQwOX0.GiTCNNNcMVuGdd45AJbXFB6eS0a5enXoUW7nfkZPD3k';
        
        const imageResponse = await fetch(`${supabaseUrl}/functions/v1/extract-product-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ url })
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData.success && imageData.image_url) {
            imageUrl = imageData.image_url;
            console.log('Extracted image:', imageUrl);
          }
        }
      } catch (imgError) {
        console.warn('Failed to extract image, continuing without it:', imgError);
        // Continue adding product even if image extraction fails
      }
    }
    
    // Get extracted price from client-side detection
    const extractedPrice = window.extractedPrice || null;
    const extractedInStock = window.extractedInStock !== false; // Default to true
    
    // Add product with image URL and price
    await supabaseRequest('POST', '/rest/v1/products', {
      name: name,
      url: url || null,
      image_url: imageUrl,
      current_price: extractedPrice,
      in_stock: extractedInStock,
      list_id: listId
    });
    
    // Clear extracted price after using
    window.extractedPrice = null;
    window.extractedInStock = null;
    
    // Hide price preview
    const pricePreview = document.getElementById('pricePreview');
    if (pricePreview) {
      pricePreview.style.display = 'none';
    }
    
    document.getElementById('productName').value = '';
    document.getElementById('productUrl').value = '';
    
    // Award points for adding item
    awardPoints('add_item', 1, `Added: ${name}`, null, listId);
    
    let successMsg = 'Product added! +1 pt 🏆';
    if (imageUrl && extractedPrice) {
      successMsg = `Product added with image & price ($${extractedPrice})! +1 pt 🏆`;
    } else if (imageUrl) {
      successMsg = 'Product added with image! +1 pt 🏆';
    } else if (extractedPrice) {
      successMsg = `Product added with price ($${extractedPrice})! +1 pt 🏆`;
    }
    
    showMessage('addMessage', successMsg, 'success');
    await loadUserData();
  } catch (error) {
    showMessage('addMessage', 'Error adding product', 'error');
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;
  
  try {
    await supabaseRequest('DELETE', `/rest/v1/products?id=eq.${id}`);
    showMessage('addMessage', 'Product deleted', 'success');
    await loadUserData();
  } catch (error) {
    showMessage('addMessage', 'Error deleting product', 'error');
  }
}

// Refresh price for a product by opening its URL and extracting the price
async function refreshProductPrice(product, button) {
  if (!product.url) {
    showMessage('addMessage', 'No URL for this product', 'error');
    return;
  }
  
  const originalText = button.textContent;
  button.textContent = '⏳';
  button.disabled = true;
  
  try {
    // Open the product URL in a new tab (MUST stay in background or popup closes)
    const tab = await chrome.tabs.create({ 
      url: product.url, 
      active: false
    });
    
    // Wait for the page to load
    await new Promise(resolve => {
      const listener = (tabId, info) => {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      
      // Timeout after 20 seconds
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 20000);
    });
    
    // Give the page time to fully render (React sites need longer)
    // Don't activate the tab - that closes the popup!
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to extract the price using the content script
    let priceData = null;
    
    // First try: content script message
    try {
      priceData = await chrome.tabs.sendMessage(tab.id, { action: 'extractPrice' });
      console.log('Content script result:', priceData);
    } catch (e) {
      console.log('Content script not available:', e.message);
    }
    
    // Second try: direct script injection if content script failed
    if (!priceData || !priceData.price) {
      try {
        console.log('Trying direct script injection...');
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractPriceFromPage
        });
        if (results && results[0] && results[0].result) {
          priceData = results[0].result;
          console.log('Direct injection result:', priceData);
        }
      } catch (e) {
        console.log('Direct injection failed:', e.message);
      }
    }
    
    // Close the tab
    try {
      await chrome.tabs.remove(tab.id);
    } catch (e) {
      console.log('Could not close tab:', e.message);
    }
    
    if (priceData && priceData.price) {
      // Update the product in the database
      await supabaseRequest('PATCH', `/rest/v1/products?id=eq.${product.id}`, {
        current_price: priceData.price,
        in_stock: priceData.inStock !== false
      });
      
      // Update the product in local state (so it doesn't move when we refresh)
      const productIndex = currentProducts.findIndex(p => p.id === product.id);
      if (productIndex !== -1) {
        currentProducts[productIndex].current_price = priceData.price;
        currentProducts[productIndex].in_stock = priceData.inStock !== false;
      }
      
      // Update just the price display in the DOM without reloading
      const productDiv = button.closest('.product-item');
      if (productDiv) {
        // Look for existing price display
        let priceSpan = productDiv.querySelector('.product-price-display');
        
        if (priceSpan) {
          // Update existing price
          priceSpan.textContent = `$${priceData.price}`;
        } else {
          // Price element doesn't exist, create it
          const detailsDiv = productDiv.querySelector('.product-details');
          const nameDiv = detailsDiv?.querySelector('.product-name');
          
          if (nameDiv) {
            const priceContainer = document.createElement('div');
            priceContainer.style.display = 'flex';
            priceContainer.style.alignItems = 'center';
            priceContainer.style.gap = '8px';
            priceContainer.style.marginBottom = '4px';
            
            const priceEl = document.createElement('span');
            priceEl.className = 'product-meta product-price-display';
            priceEl.style.fontWeight = '600';
            priceEl.style.fontSize = '14px';
            priceEl.style.color = 'var(--green-primary)';
            priceEl.textContent = `$${priceData.price}`;
            priceContainer.appendChild(priceEl);
            
            // Also add the history button
            const historyBtn = document.createElement('button');
            historyBtn.className = 'btn-tiny';
            historyBtn.style.padding = '2px 6px';
            historyBtn.style.fontSize = '10px';
            historyBtn.style.background = 'var(--bg-tertiary)';
            historyBtn.style.color = 'var(--text-secondary)';
            historyBtn.style.border = '1px solid var(--border-color)';
            historyBtn.textContent = '📈 History';
            historyBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              showPriceHistory(product);
            });
            priceContainer.appendChild(historyBtn);
            
            // Insert after name
            nameDiv.after(priceContainer);
          }
        }
      }
      
      button.textContent = '✓';
      button.style.background = 'var(--green-primary)';
      button.style.color = 'white';

      // Check for price changes and send notifications
      const previousPrice = product.current_price ? parseFloat(product.current_price) : null;
      const newPrice = priceData.price;
      const targetPrice = product.target_price ? parseFloat(product.target_price) : null;

      // Check if price dropped
      if (previousPrice && newPrice < previousPrice) {
        const percentDrop = Math.round(((previousPrice - newPrice) / previousPrice) * 100);

        // Send to background script for push notification
        try {
          chrome.runtime.sendMessage({
            type: 'PRICE_DROP_DETECTED',
            data: {
              product: product,
              previousPrice: previousPrice,
              newPrice: newPrice,
              percentDrop: percentDrop
            }
          });
        } catch (e) {
          console.log('Could not send notification:', e);
        }
      }

      // Check if back in stock
      if (product.in_stock === false && priceData.inStock !== false) {
        try {
          chrome.runtime.sendMessage({
            type: 'BACK_IN_STOCK',
            data: { product: product }
          });
        } catch (e) {
          console.log('Could not send back in stock notification:', e);
        }
      }

      // Check for target price alert trigger
      if (targetPrice && targetPrice > 0 && newPrice <= targetPrice) {
        // Price dropped to or below target - show special notification!
        showPriceDropAlert(product, newPrice, targetPrice);
        showMessage('addMessage', `🎉 PRICE DROP! $${newPrice} (target: $${targetPrice.toFixed(2)})`, 'success');
      } else {
        showMessage('addMessage', `Price updated: $${newPrice}`, 'success');
      }
    } else {
      button.textContent = '✗';
      button.style.background = 'var(--error-bg)';
      button.style.color = 'var(--error-text)';
      showMessage('addMessage', 'Could not extract price from page', 'error');
    }
  } catch (error) {
    console.error('Error refreshing price:', error);
    button.textContent = '✗';
    showMessage('addMessage', 'Error refreshing price', 'error');
  }
  
  // Reset button after 3 seconds
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
    button.style.background = '';
    button.style.color = '';
  }, 3000);
}

// Price extraction function that can be injected into pages
function extractPriceFromPage() {
  const url = window.location.href;
  let price = null;
  let inStock = true;
  
  // Parse a single price from text, extracting just the dollar amount
  function parseSinglePrice(text) {
    if (!text) return null;
    // Match a price pattern like $XX.XX or $X,XXX.XX
    const match = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (match) {
      const p = parseFloat(match[1].replace(/,/g, ''));
      if (p && p > 0 && p < 100000) {
        return Math.round(p * 100) / 100;
      }
    }
    return null;
  }
  
  // Check if an element or its parent has strikethrough styling (original/old price)
  function isStrikethrough(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.textDecoration.includes('line-through') || 
        style.textDecorationLine.includes('line-through')) {
      return true;
    }
    // Check parent too
    if (el.parentElement) {
      const parentStyle = window.getComputedStyle(el.parentElement);
      if (parentStyle.textDecoration.includes('line-through') || 
          parentStyle.textDecorationLine.includes('line-through')) {
        return true;
      }
    }
    // Check for common "was price" class names
    const className = (el.className + ' ' + (el.parentElement?.className || '')).toLowerCase();
    if (className.includes('was') || className.includes('original') || 
        className.includes('old') || className.includes('strike') ||
        className.includes('list-price') || className.includes('rrp')) {
      return true;
    }
    return false;
  }
  
  // Amazon - very specific selectors for current/sale price
  if (url.includes('amazon.com')) {
    // Try the main price display first (not in a strikethrough)
    const priceSelectors = [
      '.a-price:not(.a-text-price) .a-offscreen', // Current price (not crossed out)
      '.apexPriceToPay .a-offscreen',
      '#corePrice_feature_div .a-price:not(.a-text-price) .a-offscreen',
      '.priceToPay .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '#priceblock_ourprice'
    ];
    
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el && !isStrikethrough(el)) {
        price = parseSinglePrice(el.textContent);
        if (price) break;
      }
    }
    inStock = !document.body.innerText.includes('Currently unavailable');
  }
  // Target
  else if (url.includes('target.com')) {
    // Target uses React and has various price display patterns
    
    // Method 1: Try JSON-LD schema first
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = data['@graph'] || (Array.isArray(data) ? data : [data]);
        for (const item of items) {
          if (item['@type'] === 'Product' && item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
            for (const offer of offers) {
              if (offer.price) {
                price = parseFloat(offer.price);
                if (price) break;
              }
            }
          }
          if (price) break;
        }
      } catch (e) {}
    }
    
    // Method 2: Look for price in various Target layouts
    if (!price) {
      const priceSelectors = [
        '[data-test="product-price"] span[data-test="current-price"]',
        '[data-test="product-price"] > span:first-child',
        'span[data-test="current-price"]',
        '[data-test="product-price"]',
        '[class*="CurrentPrice"]',
        '[class*="styles__CurrentPriceFontSize"]',
        '[class*="SalePrice"]',
        'div[data-test="product-price"] span',
        '[data-test="big-price"]'
      ];
      
      for (const sel of priceSelectors) {
        try {
          const el = document.querySelector(sel);
          if (el) {
            const text = el.textContent.trim();
            if (text.toLowerCase().includes('was') || 
                text.toLowerCase().includes('reg') ||
                text.toLowerCase().includes('original')) {
              continue;
            }
            const match = text.match(/\$\s*(\d+(?:\.\d{2})?)/);
            if (match) {
              const p = parseFloat(match[1]);
              if (p && p > 0 && p < 10000) {
                price = p;
                break;
              }
            }
          }
        } catch (e) {}
      }
    }
    
    // Method 3: Scan ALL elements for standalone price text like "$25.00"
    if (!price) {
      const allPrices = [];
      const allElements = document.querySelectorAll('span, div, p');
      for (const el of allElements) {
        // Only check direct text content, not nested
        if (el.children.length === 0 || el.childNodes.length === 1) {
          const text = el.textContent.trim();
          // Match standalone price like "$25.00" or "$25"
          if (/^\$\d+(\.\d{2})?$/.test(text)) {
            const style = window.getComputedStyle(el);
            const parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
            const isStruck = style.textDecoration.includes('line-through') || 
                            (parentStyle && parentStyle.textDecoration.includes('line-through'));
            if (!isStruck) {
              const p = parseFloat(text.replace('$', ''));
              if (p && p > 0) allPrices.push(p);
            }
          }
        }
      }
      if (allPrices.length > 0) {
        price = Math.min(...allPrices);
      }
    }
    
    inStock = !document.body.innerText.includes('Out of stock') && 
              !document.body.innerText.includes('Sold out');
  }
  // Walmart - handle multi-option pages
  else if (url.includes('walmart.com')) {
    // Try multiple Walmart price selectors in order of reliability
    const priceSelectors = [
      // New Walmart layout - current price in the buy box
      '[data-testid="price-wrap"] [itemprop="price"]',
      '.price-group [itemprop="price"]',
      '[itemprop="price"]',
      // Price shown prominently
      '[data-automation-id="product-price"] .f2',
      '.price-characteristic',
      // Inline offer price 
      '.inline-flex [itemprop="price"]',
      '.prod-PriceSection .price-main .visuallyhidden'
    ];
    
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        // Check content attribute first (most reliable for Walmart)
        const content = el.getAttribute('content');
        if (content) {
          const p = parseFloat(content);
          if (p && p > 0) { price = p; break; }
        }
        // Otherwise parse text
        if (!isStrikethrough(el)) {
          const p = parseSinglePrice(el.textContent);
          if (p) { price = p; break; }
        }
      }
    }
    
    // Fallback: look for price in JSON-LD schema
    if (!price) {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data.offers?.price) {
            price = parseFloat(data.offers.price);
            break;
          } else if (data['@graph']) {
            for (const item of data['@graph']) {
              if (item.offers?.price) {
                price = parseFloat(item.offers.price);
                break;
              }
            }
          }
        } catch (e) {}
      }
    }
    
    inStock = !document.body.innerText.includes('Out of stock');
  }
  // Best Buy
  else if (url.includes('bestbuy.com')) {
    const selectors = [
      '.priceView-customer-price span:first-child',
      '[data-testid="customer-price"] span:first-child'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && !isStrikethrough(el)) {
        price = parseSinglePrice(el.textContent);
        if (price) break;
      }
    }
    inStock = !document.body.innerText.includes('Sold Out');
  }
  // eBay
  else if (url.includes('ebay.com')) {
    const el = document.querySelector('[itemprop="price"]');
    if (el) {
      const content = el.getAttribute('content');
      price = content ? parseFloat(content) : parseSinglePrice(el.textContent);
    }
  }
  // Etsy
  else if (url.includes('etsy.com')) {
    const selectors = ['[data-buy-box-region="price"] p', '.wt-text-title-03'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && !isStrikethrough(el)) {
        price = parseSinglePrice(el.textContent);
        if (price) break;
      }
    }
  }
  // Hanes - sale price is in the main product area only
  else if (url.includes('hanes.com')) {
    // First try JSON-LD schema - but be careful to get the MAIN product, not recommendations
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        // Handle array of schemas - but only look at the FIRST Product (main product)
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Product' && item.offers) {
            // Check if this is the main product by looking at URL match
            const productUrl = item.url || item['@id'] || '';
            const currentPath = window.location.pathname;
            
            // Only use this product if URL matches or it's the first product found
            if (!price && (productUrl.includes(currentPath) || !productUrl || items.indexOf(item) === 0)) {
              const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
              // Get the sale/current price (usually the first offer or lowest)
              if (offers[0]?.price) {
                price = parseFloat(offers[0].price);
                break;
              }
            }
          }
        }
        if (price) break;
      } catch (e) {}
    }
    
    // Fallback: Look in the main product detail area only (not recommendations)
    if (!price) {
      // Try to find the main product container - be very specific
      const mainProduct = document.querySelector('.product-detail, .pdp-main, #product-content, [data-component="product-detail"]') 
                         || document.querySelector('main') 
                         || document.body;
      
      // Look for sale price specifically within main product area
      // But EXCLUDE anything inside recommendation/carousel sections
      const priceSelectors = [
        '.product-price .sales .value',
        '.price-sales .value', 
        '.sales-price',
        '.price .sale',
        '.product-price .value'
      ];
      
      for (const sel of priceSelectors) {
        const els = mainProduct.querySelectorAll(sel);
        for (const el of els) {
          // Skip if inside a recommendation/carousel/complete-the-look section
          if (el.closest('.recommendations, .complete-the-look, .carousel, .product-carousel, .slick-slider, .slick-track, [class*="recommend"], [class*="upsell"], [class*="cross-sell"], [class*="related"], [class*="also-like"]')) {
            continue;
          }
          if (!isStrikethrough(el)) {
            const content = el.getAttribute('content');
            if (content) {
              const p = parseFloat(content);
              if (p && p > 0) { price = p; break; }
            }
            const p = parseSinglePrice(el.textContent);
            if (p) { price = p; break; }
          }
        }
        if (price) break;
      }
    }
  }
  // Patagonia
  else if (url.includes('patagonia.com')) {
    const salePrice = document.querySelector('.price--sale, .sales-price');
    if (salePrice) {
      price = parseSinglePrice(salePrice.textContent);
    }
    if (!price) {
      const priceEl = document.querySelector('.price');
      if (priceEl && !isStrikethrough(priceEl)) {
        price = parseSinglePrice(priceEl.textContent);
      }
    }
  }
  // Williams Sonoma
  else if (url.includes('williams-sonoma.com')) {
    const salePrice = document.querySelector('.product-price .sale-price, .price-sale');
    if (salePrice) {
      price = parseSinglePrice(salePrice.textContent);
    }
    if (!price) {
      const priceEl = document.querySelector('.product-price');
      if (priceEl && !isStrikethrough(priceEl)) {
        price = parseSinglePrice(priceEl.textContent);
      }
    }
  }
  // Generic fallback
  else {
    // 1. Try schema.org price first (most reliable)
    const schemaPrice = document.querySelector('[itemprop="price"]');
    if (schemaPrice) {
      const content = schemaPrice.getAttribute('content');
      if (content) {
        price = parseFloat(content);
      } else if (!isStrikethrough(schemaPrice)) {
        price = parseSinglePrice(schemaPrice.textContent);
      }
    }
    
    // 2. Look for sale/current price classes
    if (!price) {
      const saleSelectors = ['.sale-price', '.current-price', '.price--sale', '.price-sale', '.special-price'];
      for (const sel of saleSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
    }
    
    // 3. Generic price class, but skip strikethrough
    if (!price) {
      const priceEls = document.querySelectorAll('.price, .product-price, [class*="price"]');
      for (const el of priceEls) {
        if (!isStrikethrough(el)) {
          const p = parseSinglePrice(el.textContent);
          if (p) { price = p; break; }
        }
      }
    }
  }
  
  return { price, inStock };
}

// Show price history chart modal
// Store current price history data for filtering
let currentPriceHistoryData = [];
let currentPriceHistoryProduct = null;

async function showPriceHistory(product) {
  currentPriceHistoryProduct = product;
  const modalContent = document.getElementById('modalContent');

  // Truncate product name if too long
  const displayName = product.name.length > 40 ? product.name.substring(0, 40) + '...' : product.name;

  modalContent.innerHTML = `
    <div class="modal-header">📈 Price History</div>
    <div class="modal-body" style="padding: 0;">
      <!-- Product header -->
      <div style="padding: 16px; border-bottom: 1px solid var(--border-color);">
        <h3 style="margin: 0 0 4px 0; color: var(--text-primary); font-size: 14px;" title="${product.name}">${displayName}</h3>
        <div style="display: flex; align-items: baseline; gap: 8px;">
          <span style="font-size: 28px; font-weight: 700; color: var(--green-primary);">$${product.current_price || 'N/A'}</span>
          <span id="priceVsLowest" style="font-size: 12px; padding: 2px 8px; border-radius: 10px;"></span>
        </div>
      </div>

      <!-- Time range tabs -->
      <div style="display: flex; border-bottom: 1px solid var(--border-color); background: var(--bg-tertiary);">
        <button class="price-range-tab active" data-days="7" style="flex: 1; padding: 8px; border: none; background: transparent; cursor: pointer; font-size: 11px; color: var(--text-secondary); border-bottom: 2px solid transparent; font-weight: 500;">7D</button>
        <button class="price-range-tab" data-days="30" style="flex: 1; padding: 8px; border: none; background: transparent; cursor: pointer; font-size: 11px; color: var(--text-secondary); border-bottom: 2px solid transparent; font-weight: 500;">30D</button>
        <button class="price-range-tab" data-days="90" style="flex: 1; padding: 8px; border: none; background: transparent; cursor: pointer; font-size: 11px; color: var(--text-secondary); border-bottom: 2px solid transparent; font-weight: 500;">90D</button>
        <button class="price-range-tab" data-days="all" style="flex: 1; padding: 8px; border: none; background: transparent; cursor: pointer; font-size: 11px; color: var(--text-secondary); border-bottom: 2px solid transparent; font-weight: 500;">ALL</button>
      </div>

      <!-- Chart container -->
      <div id="priceChartContainer" style="height: 160px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; position: relative; padding: 12px;">
        <span class="loading">Loading price history...</span>
      </div>

      <!-- Hover tooltip (hidden by default) -->
      <div id="priceTooltip" style="display: none; position: absolute; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 12px; box-shadow: 0 4px 12px var(--shadow-medium); z-index: 100; pointer-events: none;">
        <div id="tooltipDate" style="font-size: 10px; color: var(--text-secondary);"></div>
        <div id="tooltipPrice" style="font-size: 14px; font-weight: 600; color: var(--green-primary);"></div>
      </div>

      <!-- Stats row -->
      <div id="priceStats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1px; background: var(--border-color); border-top: 1px solid var(--border-color);">
        <div style="text-align: center; padding: 12px 8px; background: var(--bg-secondary);">
          <div style="font-size: 10px; color: var(--text-secondary); margin-bottom: 2px;">LOW</div>
          <div id="lowestPrice" style="font-size: 14px; font-weight: 600; color: var(--green-primary);">--</div>
        </div>
        <div style="text-align: center; padding: 12px 8px; background: var(--bg-secondary);">
          <div style="font-size: 10px; color: var(--text-secondary); margin-bottom: 2px;">HIGH</div>
          <div id="highestPrice" style="font-size: 14px; font-weight: 600; color: var(--error-text);">--</div>
        </div>
        <div style="text-align: center; padding: 12px 8px; background: var(--bg-secondary);">
          <div style="font-size: 10px; color: var(--text-secondary); margin-bottom: 2px;">AVG</div>
          <div id="avgPrice" style="font-size: 14px; font-weight: 600; color: var(--text-primary);">--</div>
        </div>
        <div style="text-align: center; padding: 12px 8px; background: var(--bg-secondary);">
          <div style="font-size: 10px; color: var(--text-secondary); margin-bottom: 2px;">CHANGE</div>
          <div id="priceChange" style="font-size: 14px; font-weight: 600;">--</div>
        </div>
      </div>

      <!-- Recent prices list -->
      <div style="padding: 12px 16px;">
        <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">RECENT PRICES</div>
        <div id="priceHistoryList" style="max-height: 120px; overflow-y: auto;"></div>
      </div>
    </div>
    <button id="closePriceHistoryBtn" class="secondary" style="margin: 16px;">Close</button>
  `;

  document.getElementById('modalOverlay').classList.add('show');
  document.getElementById('closePriceHistoryBtn').addEventListener('click', hideModal);

  // Set up time range tabs
  document.querySelectorAll('.price-range-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.price-range-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--text-secondary)';
        t.style.borderBottomColor = 'transparent';
      });
      tab.classList.add('active');
      tab.style.color = 'var(--green-primary)';
      tab.style.borderBottomColor = 'var(--green-primary)';
      filterPriceHistory(tab.dataset.days);
    });
  });

  // Style active tab
  const activeTab = document.querySelector('.price-range-tab.active');
  if (activeTab) {
    activeTab.style.color = 'var(--green-primary)';
    activeTab.style.borderBottomColor = 'var(--green-primary)';
  }

  // Fetch all price history (we'll filter client-side)
  try {
    const history = await supabaseRequest('GET', `/rest/v1/price_history?product_id=eq.${product.id}&order=checked_at.desc&limit=365`);
    currentPriceHistoryData = history || [];

    if (currentPriceHistoryData.length > 0) {
      filterPriceHistory('7'); // Default to 7 days
    } else {
      document.getElementById('priceChartContainer').innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
          <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
          <div>No price history yet</div>
          <div style="font-size: 12px; margin-top: 4px;">Prices are checked daily</div>
        </div>
      `;
      document.getElementById('priceHistoryList').innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 12px; font-size: 12px;">No data</div>';
    }
  } catch (error) {
    console.error('Error loading price history:', error);
    document.getElementById('priceChartContainer').innerHTML = `
      <div style="text-align: center; color: var(--error-text); padding: 20px;">
        Error loading price history
      </div>
    `;
  }
}

function filterPriceHistory(days) {
  let filteredHistory = [...currentPriceHistoryData];

  if (days !== 'all') {
    const daysNum = parseInt(days);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysNum);
    filteredHistory = filteredHistory.filter(h => new Date(h.checked_at) >= cutoff);
  }

  if (filteredHistory.length === 0) {
    document.getElementById('priceChartContainer').innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
        <div>No data for this period</div>
        <div style="font-size: 12px; margin-top: 4px;">Try a longer time range</div>
      </div>
    `;
    document.getElementById('lowestPrice').textContent = '--';
    document.getElementById('highestPrice').textContent = '--';
    document.getElementById('avgPrice').textContent = '--';
    document.getElementById('priceChange').textContent = '--';
    document.getElementById('priceHistoryList').innerHTML = '';
    return;
  }

  // Calculate stats
  const prices = filteredHistory.map(h => parseFloat(h.price));
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);

  // Calculate change (oldest to newest in filtered range)
  const oldestPrice = prices[prices.length - 1];
  const newestPrice = prices[0];
  const changePercent = ((newestPrice - oldestPrice) / oldestPrice * 100).toFixed(1);
  const changeColor = changePercent < 0 ? 'var(--green-primary)' : changePercent > 0 ? 'var(--error-text)' : 'var(--text-secondary)';
  const changeSign = changePercent > 0 ? '+' : '';

  document.getElementById('lowestPrice').textContent = `$${lowest.toFixed(2)}`;
  document.getElementById('highestPrice').textContent = `$${highest.toFixed(2)}`;
  document.getElementById('avgPrice').textContent = `$${avg}`;
  document.getElementById('priceChange').innerHTML = `<span style="color: ${changeColor}">${changeSign}${changePercent}%</span>`;

  // Check if current price is the lowest
  const currentPrice = parseFloat(currentPriceHistoryProduct.current_price);
  const priceVsLowestEl = document.getElementById('priceVsLowest');
  if (currentPrice <= lowest) {
    priceVsLowestEl.textContent = '🎉 Lowest price!';
    priceVsLowestEl.style.background = 'var(--success-bg)';
    priceVsLowestEl.style.color = 'var(--success-text)';
  } else {
    const aboveLowest = ((currentPrice - lowest) / lowest * 100).toFixed(0);
    priceVsLowestEl.textContent = `${aboveLowest}% above low`;
    priceVsLowestEl.style.background = 'var(--bg-tertiary)';
    priceVsLowestEl.style.color = 'var(--text-secondary)';
  }

  // Draw chart (reverse to chronological order)
  drawPriceChart(filteredHistory.slice().reverse());

  // Show history list (most recent first)
  const listHtml = filteredHistory.slice(0, 10).map(h => {
    const date = new Date(h.checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const price = parseFloat(h.price).toFixed(2);
    const isLowest = parseFloat(h.price) === lowest;
    const isHighest = parseFloat(h.price) === highest;
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-light);">
        <span style="color: var(--text-secondary); font-size: 12px;">${date}</span>
        <span style="font-weight: 600; font-size: 13px; color: ${isLowest ? 'var(--green-primary)' : isHighest ? 'var(--error-text)' : 'var(--text-primary)'};">
          $${price} ${isLowest ? '↓' : isHighest ? '↑' : ''}
        </span>
      </div>
    `;
  }).join('');

  document.getElementById('priceHistoryList').innerHTML = listHtml || '<div style="color: var(--text-secondary); text-align: center; padding: 12px; font-size: 12px;">No data</div>';
}

// Draw an interactive SVG line chart for price history
function drawPriceChart(history) {
  const container = document.getElementById('priceChartContainer');

  if (!history || history.length < 2) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
        <div>Need more data points for chart</div>
        <div style="font-size: 12px; margin-top: 4px;">${history?.length || 0} price check(s) so far</div>
      </div>
    `;
    return;
  }

  const prices = history.map(h => parseFloat(h.price));
  const dates = history.map(h => new Date(h.checked_at));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const width = 320;
  const height = 140;
  const paddingX = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  // Generate SVG path points
  const pointsData = prices.map((price, i) => {
    const x = paddingX + (i / (prices.length - 1)) * (width - 2 * paddingX);
    const y = paddingTop + (1 - (price - minPrice) / priceRange) * (height - paddingTop - paddingBottom);
    return { x, y, price, date: dates[i] };
  });

  const pathPoints = pointsData.map(p => `${p.x},${p.y}`);
  const pathD = `M ${pathPoints[0]} L ${pathPoints.join(' L ')} L ${width - paddingX},${height - paddingBottom} L ${paddingX},${height - paddingBottom} Z`;
  const lineD = `M ${pathPoints.join(' L ')}`;

  // Determine trend
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const trendColor = lastPrice < firstPrice ? '#22c55e' : lastPrice > firstPrice ? '#ef4444' : '#6b7280';
  const trendBg = lastPrice < firstPrice ? 'rgba(34, 197, 94, 0.1)' : lastPrice > firstPrice ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)';
  const trendIcon = lastPrice < firstPrice ? '↓' : lastPrice > firstPrice ? '↑' : '→';
  const changeAmt = Math.abs(lastPrice - firstPrice).toFixed(2);

  // Create circle elements with data attributes for hover
  const circles = pointsData.map((p, i) => {
    const isMin = p.price === minPrice;
    const isMax = p.price === maxPrice;
    const fillColor = isMin ? '#22c55e' : isMax ? '#ef4444' : 'var(--green-primary)';
    const radius = isMin || isMax ? 5 : 3;
    return `<circle
      class="price-point"
      cx="${p.x}"
      cy="${p.y}"
      r="${radius}"
      fill="${fillColor}"
      data-price="${p.price.toFixed(2)}"
      data-date="${p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}"
      style="cursor: pointer; transition: r 0.15s ease;"
    />`;
  }).join('');

  // X-axis labels (first, middle, last dates)
  const firstDate = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const lastDate = dates[dates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const svg = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="overflow: visible;">
      <defs>
        <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color: var(--green-primary); stop-opacity: 0.25"/>
          <stop offset="100%" style="stop-color: var(--green-primary); stop-opacity: 0.02"/>
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <line x1="${paddingX}" y1="${paddingTop}" x2="${width - paddingX}" y2="${paddingTop}" stroke="var(--border-light)" stroke-dasharray="4"/>
      <line x1="${paddingX}" y1="${(height - paddingBottom + paddingTop) / 2}" x2="${width - paddingX}" y2="${(height - paddingBottom + paddingTop) / 2}" stroke="var(--border-light)" stroke-dasharray="4"/>

      <!-- Area fill -->
      <path d="${pathD}" fill="url(#priceGradient)" />

      <!-- Line -->
      <path d="${lineD}" fill="none" stroke="var(--green-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Data points -->
      ${circles}

      <!-- Y-axis labels -->
      <text x="${paddingX - 2}" y="${paddingTop + 4}" font-size="9" fill="var(--text-tertiary)" text-anchor="end">$${maxPrice.toFixed(0)}</text>
      <text x="${paddingX - 2}" y="${height - paddingBottom}" font-size="9" fill="var(--text-tertiary)" text-anchor="end">$${minPrice.toFixed(0)}</text>

      <!-- X-axis labels -->
      <text x="${paddingX}" y="${height - 8}" font-size="9" fill="var(--text-tertiary)">${firstDate}</text>
      <text x="${width - paddingX}" y="${height - 8}" font-size="9" fill="var(--text-tertiary)" text-anchor="end">${lastDate}</text>
    </svg>

    <!-- Trend badge -->
    <div style="position: absolute; top: 8px; right: 8px; font-size: 11px; color: ${trendColor}; font-weight: 600; background: ${trendBg}; padding: 4px 8px; border-radius: 12px;">
      ${trendIcon} $${changeAmt}
    </div>
  `;

  container.style.position = 'relative';
  container.innerHTML = svg;

  // Add hover interactions
  container.querySelectorAll('.price-point').forEach(circle => {
    circle.addEventListener('mouseenter', (e) => {
      circle.setAttribute('r', '6');
      const tooltip = document.getElementById('priceTooltip');
      const rect = container.getBoundingClientRect();
      const cx = parseFloat(circle.getAttribute('cx'));
      const cy = parseFloat(circle.getAttribute('cy'));

      // Position tooltip
      tooltip.style.display = 'block';
      tooltip.style.left = `${cx}px`;
      tooltip.style.top = `${cy - 45}px`;
      document.getElementById('tooltipDate').textContent = circle.dataset.date;
      document.getElementById('tooltipPrice').textContent = `$${circle.dataset.price}`;
    });

    circle.addEventListener('mouseleave', (e) => {
      const isMin = parseFloat(circle.dataset.price) === minPrice;
      const isMax = parseFloat(circle.dataset.price) === maxPrice;
      circle.setAttribute('r', isMin || isMax ? '5' : '3');
      document.getElementById('priceTooltip').style.display = 'none';
    });
  });
}

async function editProduct(product) {
  const currentPrice = product.current_price ? parseFloat(product.current_price) : null;
  const hasTargetPrice = product.target_price && parseFloat(product.target_price) > 0;
  const targetPrice = hasTargetPrice ? parseFloat(product.target_price) : '';

  showCustomModal(
    'Edit Product',
    `
      <input type="text" id="editProductName" class="modal-input" placeholder="Product name" value="${product.name}" autofocus>
      <input type="text" id="editProductUrl" class="modal-input" placeholder="Product URL" value="${product.url || ''}">

      <!-- Price Alert Section -->
      <div style="margin-top: 16px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; border: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">🔔</span>
            <span style="font-weight: 600; font-size: 14px;">Price Alert</span>
          </div>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="checkbox" id="priceAlertEnabled" ${hasTargetPrice ? 'checked' : ''} style="width: auto; margin: 0;">
            <span style="font-size: 12px; color: var(--text-secondary);">Enable</span>
          </label>
        </div>

        <div id="priceAlertSettings" style="${hasTargetPrice ? '' : 'opacity: 0.5; pointer-events: none;'}">
          ${currentPrice ? `<div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Current price: <strong style="color: var(--green-primary);">$${currentPrice.toFixed(2)}</strong></div>` : ''}

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px; color: var(--text-secondary);">Alert when price drops to:</span>
            <div style="position: relative; flex: 1;">
              <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);">$</span>
              <input type="number" id="targetPrice" class="modal-input" placeholder="0.00" value="${targetPrice}" step="0.01" min="0" style="padding-left: 24px; margin: 0;">
            </div>
          </div>

          ${currentPrice ? `
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button type="button" class="btn-tiny secondary" onclick="document.getElementById('targetPrice').value = ${(currentPrice * 0.9).toFixed(2)}">10% off</button>
            <button type="button" class="btn-tiny secondary" onclick="document.getElementById('targetPrice').value = ${(currentPrice * 0.8).toFixed(2)}">20% off</button>
            <button type="button" class="btn-tiny secondary" onclick="document.getElementById('targetPrice').value = ${(currentPrice * 0.75).toFixed(2)}">25% off</button>
          </div>
          ` : ''}
        </div>
      </div>
    `,
    async () => {
      const newName = document.getElementById('editProductName').value.trim();
      const newUrl = document.getElementById('editProductUrl').value.trim();
      const alertEnabled = document.getElementById('priceAlertEnabled').checked;
      const newTargetPrice = alertEnabled ? parseFloat(document.getElementById('targetPrice').value) || null : null;

      if (!newName) {
        showMessage('addMessage', 'Please enter a product name', 'error');
        return;
      }

      try {
        await supabaseRequest('PATCH', `/rest/v1/products?id=eq.${product.id}`, {
          name: newName,
          url: newUrl || null,
          target_price: newTargetPrice
        });

        const alertMsg = newTargetPrice ? ` Alert set for $${newTargetPrice.toFixed(2)}` : '';
        showMessage('addMessage', `Product updated!${alertMsg}`, 'success');
        await loadUserData();
        hideModal();
      } catch (error) {
        showMessage('addMessage', 'Error updating product', 'error');
      }
    }
  );

  // Add toggle listener after modal is shown
  setTimeout(() => {
    const checkbox = document.getElementById('priceAlertEnabled');
    const settings = document.getElementById('priceAlertSettings');
    if (checkbox && settings) {
      checkbox.addEventListener('change', () => {
        settings.style.opacity = checkbox.checked ? '1' : '0.5';
        settings.style.pointerEvents = checkbox.checked ? 'auto' : 'none';
        if (checkbox.checked) {
          document.getElementById('targetPrice').focus();
        }
      });
    }
  }, 100);
}

async function deleteList(id, name) {
  if (!confirm(`Delete list "${name}" and all its products?`)) return;
  
  try {
    await supabaseRequest('DELETE', `/rest/v1/lists?id=eq.${id}`);
    showMessage('addMessage', 'List deleted', 'success');
    await loadUserData();
  } catch (error) {
    showMessage('addMessage', 'Error deleting list', 'error');
  }
}

async function refreshProductImages(listId, products) {
  const productsWithUrls = products.filter(p => p.url && !p.image_url);
  
  if (productsWithUrls.length === 0) {
    showMessage('addMessage', 'All products already have images or no URLs!', 'info');
    return;
  }
  
  if (!confirm(`Extract images for ${productsWithUrls.length} products? This may take a minute.`)) {
    return;
  }
  
  showMessage('addMessage', `Extracting images for ${productsWithUrls.length} products...`, 'info');
  
  let successCount = 0;
  let failCount = 0;
  
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoYnF5eHRqbWJvcmRjanRxeW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzY0MDksImV4cCI6MjA4MjYxMjQwOX0.GiTCNNNcMVuGdd45AJbXFB6eS0a5enXoUW7nfkZPD3k';
  
  for (const product of productsWithUrls) {
    try {
      const imageResponse = await fetch(`${supabaseUrl}/functions/v1/extract-product-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ url: product.url })
      });
      
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        if (imageData.success && imageData.image_url) {
          // Update product with extracted image
          await supabaseRequest('PATCH', `/rest/v1/products?id=eq.${product.id}`, {
            image_url: imageData.image_url
          });
          successCount++;
          console.log(`✓ Extracted image for: ${product.name}`);
        } else {
          failCount++;
          console.log(`✗ No image found for: ${product.name}`);
        }
      } else {
        failCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      failCount++;
      console.error(`Error extracting image for ${product.name}:`, error);
    }
  }
  
  showMessage('addMessage', `Images extracted! ✓ ${successCount} successful, ✗ ${failCount} failed`, 'success');
  await loadUserData();
  displayMyLists();
}

async function renameList(id, currentName) {
  showCustomModal(
    'Rename List',
    `<input type="text" id="renameListInput" class="modal-input" value="${currentName}" autofocus>`,
    async () => {
      const newName = document.getElementById('renameListInput').value.trim();
      
      if (!newName) {
        showMessage('addMessage', 'Please enter a list name', 'error');
        return;
      }
      
      try {
        await supabaseRequest('PATCH', `/rest/v1/lists?id=eq.${id}`, { name: newName });
        showMessage('addMessage', 'List renamed!', 'success');
        await loadUserData();
        hideModal();
      } catch (error) {
        showMessage('addMessage', 'Error renaming list', 'error');
      }
    }
  );
}

async function setKeyDate(id, listName, currentDate) {
  const dateValue = currentDate || '';
  const modalContent = `
    <p style="margin-bottom: 16px;">Set a key date for <strong>"${listName}"</strong> to receive reminder emails:</p>
    <div style="margin-bottom: 16px;">
      <label class="settings-label">Date</label>
      <input type="date" id="keyDateInput" class="modal-input" value="${dateValue}" autofocus>
      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
        You'll receive reminders 60, 30, and 15 days before this date
      </div>
    </div>
    ${currentDate ? '<button id="clearDateBtn" class="secondary btn-small" style="width: 100%; margin-top: 8px;">Clear Date</button>' : ''}
  `;
  
  showCustomModal(
    '📅 Set Key Date',
    modalContent,
    async () => {
      const newDate = document.getElementById('keyDateInput').value;
      
      if (!newDate) {
        showMessage('addMessage', 'Please select a date', 'error');
        return;
      }
      
      // Validate date is in the future
      const selectedDate = new Date(newDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        showMessage('addMessage', 'Please select a future date', 'error');
        return;
      }
      
      try {
        await supabaseRequest('PATCH', `/rest/v1/lists?id=eq.${id}`, { key_date: newDate });
        showMessage('addMessage', 'Key date set! You\'ll receive reminders.', 'success');
        await loadUserData();
        displayMyLists();
        hideModal();
      } catch (error) {
        showMessage('addMessage', 'Error setting date', 'error');
      }
    }
  );
  
  // Add clear button listener if it exists
  setTimeout(() => {
    const clearBtn = document.getElementById('clearDateBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        try {
          await supabaseRequest('PATCH', `/rest/v1/lists?id=eq.${id}`, { key_date: null });
          showMessage('addMessage', 'Key date cleared', 'success');
          await loadUserData();
          displayMyLists();
          hideModal();
        } catch (error) {
          showMessage('addMessage', 'Error clearing date', 'error');
        }
      });
    }
  }, 100);
}

async function toggleListPublic(id, makePublic) {
  try {
    await supabaseRequest('PATCH', `/rest/v1/lists?id=eq.${id}`, {
      is_public: makePublic
    });
    
    showMessage('addMessage', makePublic ? 'List is now public!' : 'List is now private', 'success');
    await loadUserData();
    updateListsDropdown();
    displayMyLists();
  } catch (error) {
    showMessage('addMessage', 'Error updating list', 'error');
  }
}

async function toggleListNotifications(id, level) {
  try {
    await supabaseRequest('PATCH', `/rest/v1/lists?id=eq.${id}`, {
      notification_level: level
    });
    
    const messages = {
      'none': 'Notifications disabled for this list',
      'who_only': 'Will notify you who claimed (but not what)',
      'what_only': 'Will notify you what was claimed (but not who)',
      'both': 'Will notify you who claimed what'
    };
    
    showMessage('addMessage', messages[level] || 'Notification preferences updated', 'success');
    await loadUserData();
    displayMyLists();
  } catch (error) {
    showMessage('addMessage', 'Error updating notifications', 'error');
  }
}

async function loadHintlist() {
  const code = document.getElementById('hintlistCode').value.trim();
  
  if (!code) {
    showMessage('hintlistMessage', 'Please enter a hintlist code', 'error');
    return;
  }
  
  try {
    // First, join the hintlist using the access code (grants access)
    const result = await supabaseRPC('join_hintlist_by_code', { code: code });
    
    if (!result.success) {
      showMessage('hintlistMessage', result.error || 'Invalid access code', 'error');
      return;
    }
    
    // Now load the list and products
    const lists = await supabaseRequest('GET', `/rest/v1/lists?id=eq.${result.list_id}&select=*`);
    
    if (lists.length === 0) {
      showMessage('hintlistMessage', 'Hintlist not found', 'error');
      return;
    }
    
    const products = await supabaseRequest('GET', `/rest/v1/products?list_id=eq.${lists[0].id}&select=*`);
    displayHintlist(lists[0], products);
    showMessage('hintlistMessage', 'Hintlist loaded! You can now claim items.', 'success');
  } catch (error) {
    showMessage('hintlistMessage', 'Error loading hintlist', 'error');
  }
}

function displayHintlist(list, products) {
  const container = document.getElementById('hintlistContainer');
  container.innerHTML = '';
  
  const available = products.filter(p => !p.claimed_by || p.claimed_by === currentUser.id);
  
  const hintlistDiv = document.createElement('div');
  hintlistDiv.className = 'list-item';
  hintlistDiv.innerHTML = `
    <div class="list-header">
      <div class="list-name">${list.name}</div>
      <div class="list-badges">
        <span class="badge count">${available.length} available</span>
      </div>
    </div>
  `;
  
  // Add export button for hintlists
  const exportHintlistBtn = document.createElement('button');
  exportHintlistBtn.className = 'btn-small';
  exportHintlistBtn.textContent = '📥 Export to Excel';
  exportHintlistBtn.style.marginTop = '8px';
  exportHintlistBtn.addEventListener('click', () => exportListToExcel(list, products));
  hintlistDiv.appendChild(exportHintlistBtn);
  
  if (available.length === 0) {
    hintlistDiv.innerHTML += '<p style="margin-top: 8px; color: var(--text-secondary); font-size: 13px;">All items claimed!</p>';
  }
  
  available.forEach(product => {
    const isMine = product.claimed_by === currentUser.id;
    
    const productDiv = document.createElement('div');
    productDiv.className = `product-item ${isMine ? 'claimed' : ''}`;
    
    // Thumbnail
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'product-thumbnail';
    if (product.image_url) {
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = product.name;
      img.onerror = () => {
        thumbnailDiv.innerHTML = '<div class="product-thumbnail-placeholder">📦</div>';
      };
      thumbnailDiv.appendChild(img);
    } else {
      thumbnailDiv.innerHTML = '<div class="product-thumbnail-placeholder">📦</div>';
    }
    productDiv.appendChild(thumbnailDiv);
    
    // Product details
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'product-details';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'product-name';
    nameDiv.textContent = product.name;
    detailsDiv.appendChild(nameDiv);
    
    if (isMine) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'product-meta';
      metaDiv.textContent = '✓ You claimed this';
      detailsDiv.appendChild(metaDiv);
    }
    
    if (product.url) {
      const urlDiv = document.createElement('div');
      urlDiv.className = 'product-url';
      urlDiv.textContent = product.url;
      detailsDiv.appendChild(urlDiv);
    }
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'product-actions';
    
    if (product.url) {
      const visitBtn = document.createElement('button');
      visitBtn.className = 'btn-small';
      visitBtn.textContent = 'Visit';
      visitBtn.addEventListener('click', () => window.open(product.url, '_blank'));
      actionsDiv.appendChild(visitBtn);
    }
    
    if (isMine) {
      const unclaimBtn = document.createElement('button');
      unclaimBtn.className = 'btn-small danger';
      unclaimBtn.textContent = 'Unclaim';
      unclaimBtn.addEventListener('click', async () => {
        if (!confirm('Unclaim this item?')) return;
        try {
          const result = await supabaseRPC('unclaim_product', { product_id: product.id });
          if (result.success) {
            showMessage('hintlistMessage', 'Item unclaimed', 'success');
            setTimeout(() => loadHintlist(), 500);
          } else {
            showMessage('hintlistMessage', result.error || 'Error unclaiming', 'error');
          }
        } catch (error) {
          showMessage('hintlistMessage', 'Error unclaiming', 'error');
        }
      });
      actionsDiv.appendChild(unclaimBtn);
    } else {
      const claimBtn = document.createElement('button');
      claimBtn.className = 'btn-small';
      claimBtn.textContent = "I'll buy this!";
      claimBtn.addEventListener('click', async () => {
        if (!confirm('Claim this item?')) return;
        try {
          const result = await supabaseRPC('claim_product', { product_id: product.id });
          if (result.success) {
            showMessage('hintlistMessage', 'Item claimed!', 'success');
            setTimeout(() => loadHintlist(), 500);
          } else {
            showMessage('hintlistMessage', result.error || 'Error claiming', 'error');
          }
        } catch (error) {
          showMessage('hintlistMessage', 'Error claiming', 'error');
        }
      });
      actionsDiv.appendChild(claimBtn);
    }
    
    detailsDiv.appendChild(actionsDiv);
    productDiv.appendChild(detailsDiv);
    hintlistDiv.appendChild(productDiv);
  });
  
  container.appendChild(hintlistDiv);
}

// Friends Modal Functions
function openFriendsModal() {
  document.getElementById('friendsModal').classList.add('show');
  loadFriends();
}

function closeFriendsModal() {
  document.getElementById('friendsModal').classList.remove('show');
}

// Invite Modal Functions
function openInviteModal(list) {
  const shareableUrl = `https://wahans.github.io/hint/?code=${list.access_code}`;
  const userName = currentUser?.user_metadata?.name || currentUser?.name || 'Your friend';
  
  const emailSubject = encodeURIComponent(`🎁 ${userName} shared a hintlist with you!`);
  const emailBody = encodeURIComponent(`Hi!

I created a hintlist on hint and wanted to share it with you: "${list.name}"

You can view my hintlist here:
${shareableUrl}

No signup required - just click the link!

- ${userName}`);

  const smsBody = encodeURIComponent(`Hey! I shared my "${list.name}" hintlist with you on hint. Check it out: ${shareableUrl}`);
  
  const modalContent = `
    <div class="modal-header">✉️ Invite Friends</div>
    <div class="modal-body">
      <p style="margin-bottom: 16px;">Share <strong>"${list.name}"</strong> with friends and family!</p>
      
      <div class="settings-item">
        <label class="settings-label">Shareable Link</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="inviteUrlInput" class="modal-input" value="${shareableUrl}" readonly style="flex: 1; margin: 0;">
          <button id="copyInviteLinkBtn" class="btn-small">Copy</button>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
          Anyone with this link can view your hintlist
        </div>
      </div>
      
      <div class="settings-item">
        <label class="settings-label">Send via Email</label>
        <div style="display: flex; gap: 8px;">
          <input type="email" id="inviteEmailInput" class="modal-input" placeholder="friend@example.com" style="flex: 1; margin: 0;">
          <button id="sendEmailInviteBtn" class="btn-small">Send</button>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
          We'll send them a beautiful email with your hintlist
        </div>
      </div>
      
      <div class="settings-item">
        <label class="settings-label">Quick Share</label>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="emailClientBtn" class="btn-small secondary" style="flex: 1;">
            📧 Email
          </button>
          <button id="smsBtn" class="btn-small secondary" style="flex: 1;">
            💬 SMS
          </button>
          <button id="qrCodeBtn" class="btn-small secondary" style="flex: 1;">
            📱 QR Code
          </button>
        </div>
      </div>
      
      <div id="inviteMessage" style="margin-top: 16px;"></div>
    </div>
    
    <div class="modal-buttons">
      <button id="closeInviteBtn" class="secondary">Close</button>
    </div>
  `;
  
  // Set modal content directly
  document.getElementById('modalContent').innerHTML = modalContent;
  document.getElementById('modalOverlay').classList.add('show');
  
  // Add event listeners
  document.getElementById('closeInviteBtn').addEventListener('click', hideModal);
  
  document.getElementById('copyInviteLinkBtn').addEventListener('click', () => {
    const input = document.getElementById('inviteUrlInput');
    input.select();
    navigator.clipboard.writeText(shareableUrl);
    showInviteMessage('Link copied to clipboard!', 'success');
  });
  
  document.getElementById('sendEmailInviteBtn').addEventListener('click', () => {
    sendEmailInvite(list, shareableUrl);
  });
  
  document.getElementById('emailClientBtn').addEventListener('click', () => {
    window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
    showInviteMessage('Opening email client...', 'success');
  });
  
  document.getElementById('smsBtn').addEventListener('click', () => {
    window.open(`sms:?body=${smsBody}`);
    showInviteMessage('Opening SMS...', 'success');
  });
  
  document.getElementById('qrCodeBtn').addEventListener('click', () => {
    generateQRCode(shareableUrl, list.name, list.access_code);
  });
}

function showInviteMessage(text, type) {
  const el = document.getElementById('inviteMessage');
  if (el) {
    el.className = type === 'error' ? 'error-message' : 'success-message';
    el.textContent = text;
    
    setTimeout(() => {
      el.textContent = '';
      el.className = '';
    }, 3000);
  }
}

async function sendEmailInvite(list, shareableUrl) {
  const emailInput = document.getElementById('inviteEmailInput');
  const email = emailInput.value.trim();
  
  if (!email) {
    showInviteMessage('Please enter an email address', 'error');
    return;
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showInviteMessage('Please enter a valid email address', 'error');
    return;
  }
  
  showInviteMessage('Sending invitation...', 'info');
  
  try {
    // Get user's name from database (not from currentUser which doesn't have it)
    let userName = 'Your friend';
    try {
      const userRecord = await supabaseRequest('GET', `/rest/v1/users?id=eq.${currentUser.id}&select=name`);
      if (userRecord && userRecord.length > 0 && userRecord[0].name) {
        userName = userRecord[0].name;
      }
    } catch (nameError) {
      console.warn('Could not fetch user name from database:', nameError);
    }
    
    console.log('=== SENDING INVITE ===');
    console.log('currentUser.id:', currentUser.id);
    console.log('Fetched userName from DB:', userName);
    console.log('URL:', `${supabaseUrl}/functions/v1/send-email-invite`);
    console.log('To:', email);
    console.log('From:', userName);
    console.log('List:', list.name);
    console.log('Shareable URL:', shareableUrl);
    
    // ANON KEY - Updated automatically
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoYnF5eHRqbWJvcmRjanRxeW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzY0MDksImV4cCI6MjA4MjYxMjQwOX0.GiTCNNNcMVuGdd45AJbXFB6eS0a5enXoUW7nfkZPD3k';
    
    // Call Edge Function to send invitation email
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to_email: email,
        from_name: userName,
        list_name: list.name,
        shareable_url: shareableUrl
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    let responseData;
    try {
      responseData = await response.json();
      console.log('Response data:', responseData);
    } catch (jsonError) {
      console.error('Failed to parse response as JSON:', jsonError);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`);
    }
    
    if (response.ok) {
      showInviteMessage('Invitation sent! ✓', 'success');
      emailInput.value = '';
      
      // Track invitation in database
      await trackInvitation(email, list.id);
    } else {
      const errorMsg = responseData.error || responseData.message || 'Unknown error';
      console.error('Edge Function error:', errorMsg);
      showInviteMessage(`Error: ${errorMsg}`, 'error');
    }
  } catch (error) {
    console.error('=== ERROR SENDING INVITE ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Show helpful error message
    if (error.message.includes('Failed to fetch')) {
      showInviteMessage('Error: Cannot reach server. Check Edge Function is deployed.', 'error');
    } else if (error.message.includes('NetworkError')) {
      showInviteMessage('Error: Network error. Check your connection.', 'error');
    } else {
      showInviteMessage(`Error: ${error.message}`, 'error');
    }
  }
}

async function trackInvitation(email, listId) {
  try {
    await supabaseRequest('POST', '/rest/v1/invitations', {
      invited_email: email,
      list_id: listId,
      inviter_id: currentUser.id,
      invited_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error tracking invitation:', error);
  }
}

function generateQRCode(url, listName, accessCode) {
  // Use QR Server API - more reliable and works in extensions
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&color=228855&bgcolor=ffffff`;
  
  // Show QR code in modal - compact version to fit in extension
  const qrContent = `
    <div class="modal-header" style="padding: 12px 16px; font-size: 16px;">📱 QR Code</div>
    <div class="modal-body" style="text-align: center; padding: 12px 16px;">
      <p style="margin-bottom: 12px; font-size: 13px;">Scan to view <strong>"${listName}"</strong></p>
      <div style="display: flex; justify-content: center; margin: 12px 0;">
        <img src="${qrImageUrl}" alt="QR Code" style="width: 180px; height: 180px; border-radius: 6px; border: 3px solid #228855;" />
      </div>
      <div style="margin: 12px 0; padding: 10px; background: var(--bg-tertiary); border-radius: 6px;">
        <p style="font-size: 11px; color: var(--text-secondary); margin: 0 0 4px;">Or share this code:</p>
        <div style="font-size: 20px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: var(--green-primary);">${accessCode}</div>
      </div>
      <p style="font-size: 11px; color: var(--text-secondary); margin: 8px 0;">
        Enter code at <strong>wahans.github.io/hint</strong>
      </p>
      <a href="${qrImageUrl}" download="hint-qr-${listName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png" class="btn-small" style="display: inline-block; margin-top: 8px; text-decoration: none; font-size: 12px; padding: 6px 12px;">💾 Download</a>
    </div>
    <div class="modal-buttons" style="padding: 12px 16px;">
      <button id="closeQRBtn" class="secondary">Close</button>
    </div>
  `;
  
  // Set modal content directly
  document.getElementById('modalContent').innerHTML = qrContent;
  document.getElementById('modalOverlay').classList.add('show');
  
  document.getElementById('closeQRBtn').addEventListener('click', hideModal);
}

// Settings Modal Functions
async function openSettingsModal() {
  const modalContent = document.getElementById('modalContent');
  
  // Get current user info
  const userName = currentUser?.user_metadata?.name || currentUser?.name || '';
  const userEmail = currentUser?.email || '';
  
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
            <button id="clearRecentBtn" class="secondary btn-small" style="width: 100%;">
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
  document.getElementById('closeSettingsBtn').addEventListener('click', hideModal);
  document.getElementById('saveNameBtn').addEventListener('click', saveDisplayName);
  document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
  document.getElementById('clearRecentBtn').addEventListener('click', clearRecentFriends);
  document.getElementById('signOutFromSettingsBtn').addEventListener('click', logout);
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
  
  // Theme button listeners - FUNCTIONAL DARK MODE!
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const theme = this.getAttribute('data-theme');
      
      // Update active button
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Apply theme
      document.documentElement.setAttribute('data-theme', theme);
      
      // Save preference
      await chrome.storage.local.set({ theme });
      
      showSettingsMessage(`${theme === 'dark' ? '🌙' : '☀️'} ${theme.charAt(0).toUpperCase() + theme.slice(1)} mode activated!`, 'success');
    });
  });
  
  // Load current notification preferences
  loadNotificationPreferences();

  // Load push notification settings
  loadPushNotificationSettings();

  // Load stats
  loadUserStats();

  // Load currency and visibility preferences
  loadPreferences();

  // Load privacy settings
  loadPrivacySettings();

  // Load theme preference
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

function toggleSettingsSection(sectionName) {
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

async function saveDisplayName() {
  const newName = document.getElementById('settingsName').value.trim();
  
  if (!newName) {
    showAccountMessage('Please enter a name', 'error');
    return;
  }
  
  try {
    // Update in Supabase users table
    await supabaseRequest('PATCH', `/rest/v1/users?id=eq.${currentUser.id}`, {
      name: newName
    });
    
    // Update local user object
    if (currentUser.user_metadata) {
      currentUser.user_metadata.name = newName;
    } else {
      currentUser.name = newName;
    }
    
    // Update display in header
    showApp();
    
    showAccountMessage('Name saved!', 'success');
  } catch (error) {
    console.error('Error updating name:', error);
    showAccountMessage('Error updating name', 'error');
  }
}

async function changePassword() {
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
    
    // Use Supabase auth API to change password
    // Note: This requires the user to be authenticated and have a valid session
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': await chrome.storage.local.get('supabase_anon_key').then(r => r.supabase_anon_key),
        'Authorization': `Bearer ${await chrome.storage.local.get('session_token').then(r => r.session_token)}`
      },
      body: JSON.stringify({
        password: newPassword
      })
    });
    
    if (response.ok) {
      // Clear password fields
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

function showAccountMessage(text, type) {
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

async function loadNotificationPreferences() {
  try {
    const prefs = await chrome.storage.local.get([
      'emailNotifications', 
      'priceDropNotifications', 
      'friendRequestNotifications',
      'reminder60Days',
      'reminder30Days',
      'reminder15Days'
    ]);
    
    document.getElementById('emailNotificationsToggle').checked = prefs.emailNotifications !== false;
    document.getElementById('priceDropToggle').checked = prefs.priceDropNotifications !== false;
    document.getElementById('friendRequestToggle').checked = prefs.friendRequestNotifications !== false;
    document.getElementById('reminder60Toggle').checked = prefs.reminder60Days !== false;
    document.getElementById('reminder30Toggle').checked = prefs.reminder30Days !== false;
    document.getElementById('reminder15Toggle').checked = prefs.reminder15Days !== false;
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

async function saveNotificationPreferences() {
  try {
    const emailNotifications = document.getElementById('emailNotificationsToggle').checked;
    const priceDropNotifications = document.getElementById('priceDropToggle').checked;
    const friendRequestNotifications = document.getElementById('friendRequestToggle').checked;
    const reminder60Days = document.getElementById('reminder60Toggle').checked;
    const reminder30Days = document.getElementById('reminder30Toggle').checked;
    const reminder15Days = document.getElementById('reminder15Toggle').checked;
    
    await chrome.storage.local.set({
      emailNotifications,
      priceDropNotifications,
      friendRequestNotifications,
      reminder60Days,
      reminder30Days,
      reminder15Days
    });
    
    // Also update in database
    await supabaseRequest('PATCH', `/rest/v1/users?id=eq.${currentUser.id}`, {
      email_notifications_enabled: emailNotifications,
      price_drop_notifications: priceDropNotifications,
      friend_request_notifications: friendRequestNotifications,
      reminder_60_days: reminder60Days,
      reminder_30_days: reminder30Days,
      reminder_15_days: reminder15Days
    });
    
    showSettingsMessage('Preferences saved', 'success');
  } catch (error) {
    console.error('Error saving preferences:', error);
    showSettingsMessage('Error saving preferences', 'error');
  }
}

// ============================================
// PUSH NOTIFICATION SETTINGS
// ============================================

async function loadPushNotificationSettings() {
  try {
    // Get settings from background script
    const response = await chrome.runtime.sendMessage({ type: 'GET_NOTIFICATION_SETTINGS' });
    const settings = response?.settings || {};

    // Update toggles
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

    // Update UI state based on master toggle
    updatePushNotificationUIState(settings.enabled !== false);
  } catch (error) {
    console.error('Error loading push notification settings:', error);
  }
}

async function savePushNotificationSettings() {
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

    // Send to background script
    await chrome.runtime.sendMessage({
      type: 'UPDATE_NOTIFICATION_SETTINGS',
      settings
    });

    // Update UI state
    updatePushNotificationUIState(settings.enabled);

    showSettingsMessage('Notification settings saved', 'success');
  } catch (error) {
    console.error('Error saving push notification settings:', error);
    showSettingsMessage('Error saving settings', 'error');
  }
}

function updatePushNotificationUIState(enabled) {
  // Disable/enable child toggles based on master toggle
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

async function testPushNotification() {
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

async function clearRecentFriends() {
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

function showSettingsMessage(text, type) {
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

async function exportAllData() {
  try {
    showSettingsMessage('Preparing export...', 'info');
    
    // Gather all data
    const lists = currentLists || [];
    const products = currentProducts || [];
    
    // Create CSV content
    let csv = 'List Name,Product Name,URL,Current Price,Claimed,Created At\n';
    
    lists.forEach(list => {
      const listProducts = products.filter(p => p.list_id === list.id);
      
      if (listProducts.length === 0) {
        // Include empty lists
        csv += `"${list.name}",,,,,${list.created_at}\n`;
      } else {
        listProducts.forEach(product => {
          csv += `"${list.name}","${product.name}","${product.url || ''}","${product.current_price || ''}","${product.claimed_by ? 'Yes' : 'No'}","${product.created_at}"\n`;
        });
      }
    });
    
    // Create download
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

async function loadUserStats() {
  try {
    const lists = currentLists || [];
    const products = currentProducts || [];
    
    // Get friends count
    const friends = await supabaseRPC('get_friends', {});
    
    document.getElementById('statsLists').textContent = lists.length;
    document.getElementById('statsProducts').textContent = products.length;
    document.getElementById('statsFriends').textContent = friends?.length || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadPreferences() {
  try {
    const prefs = await chrome.storage.local.get(['currency', 'defaultVisibility']);
    
    if (prefs.currency) {
      document.getElementById('currencySelect').value = prefs.currency;
    }
    
    if (prefs.defaultVisibility) {
      document.getElementById('defaultVisibilitySelect').value = prefs.defaultVisibility;
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

async function saveCurrencyPreference() {
  try {
    const currency = document.getElementById('currencySelect').value;
    await chrome.storage.local.set({ currency });
    showSettingsMessage('Currency preference saved', 'success');
  } catch (error) {
    console.error('Error saving currency:', error);
    showSettingsMessage('Error saving currency', 'error');
  }
}

async function saveDefaultVisibility() {
  try {
    const defaultVisibility = document.getElementById('defaultVisibilitySelect').value;
    await chrome.storage.local.set({ defaultVisibility });
    showSettingsMessage('Default visibility saved', 'success');
  } catch (error) {
    console.error('Error saving visibility:', error);
    showSettingsMessage('Error saving visibility', 'error');
  }
}

async function loadPrivacySettings() {
  try {
    const prefs = await chrome.storage.local.get(['friendRequestPrivacy', 'profileVisibility', 'leaderboardVisibility']);
    
    if (prefs.friendRequestPrivacy) {
      document.getElementById('friendRequestPrivacySelect').value = prefs.friendRequestPrivacy;
    }
    
    document.getElementById('profileVisibilityToggle').checked = prefs.profileVisibility !== false;
    document.getElementById('leaderboardVisibilityToggle').checked = prefs.leaderboardVisibility !== false;
  } catch (error) {
    console.error('Error loading privacy settings:', error);
  }
}

async function loadThemePreference() {
  try {
    const { theme } = await chrome.storage.local.get('theme');
    
    // Update button states
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

async function savePrivacySettings() {
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

async function deleteAccount() {
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
    
    // Delete user data from database
    await supabaseRequest('DELETE', `/rest/v1/users?id=eq.${currentUser.id}`);
    
    // Clear local storage
    await chrome.storage.local.clear();
    
    // Show goodbye message
    alert('Your account has been deleted. Thank you for using hint!');
    
    // Reload to show login screen
    window.location.reload();
  } catch (error) {
    console.error('Error deleting account:', error);
    showSettingsMessage('Error deleting account. Please contact support.', 'error');
  }
}

function switchFriendsTab(tab) {
  // Update tab buttons
  document.getElementById('myFriendsTab').classList.remove('active');
  document.getElementById('requestsTab').classList.remove('active');
  document.getElementById('addFriendTab').classList.remove('active');
  
  // Hide all views
  document.getElementById('myFriendsView').classList.add('hidden');
  document.getElementById('requestsView').classList.add('hidden');
  document.getElementById('addFriendView').classList.add('hidden');
  
  // Show selected view
  if (tab === 'friends') {
    document.getElementById('myFriendsTab').classList.add('active');
    document.getElementById('myFriendsView').classList.remove('hidden');
    loadFriends();
  } else if (tab === 'requests') {
    document.getElementById('requestsTab').classList.add('active');
    document.getElementById('requestsView').classList.remove('hidden');
    loadPendingRequests();
  } else if (tab === 'add') {
    document.getElementById('addFriendTab').classList.add('active');
    document.getElementById('addFriendView').classList.remove('hidden');
  }
}

async function loadFriends() {
  const container = document.getElementById('friendsList');
  container.innerHTML = '<div class="loading">Loading friends...</div>';
  
  try {
    const friends = await supabaseRPC('get_friends', {});
    
    if (friends.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div>No friends yet</div>
          <div style="font-size: 12px; margin-top: 8px;">Add friends to share hintlists!</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    friends.forEach(friend => {
      const friendDiv = document.createElement('div');
      friendDiv.className = 'friend-item';
      
      friendDiv.innerHTML = `
        <div class="friend-info">
          <div>
            <div class="friend-name">${friend.friend_name}</div>
            <div class="friend-email">${friend.friend_email}</div>
          </div>
        </div>
      `;
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'friend-actions';
      
      const viewListsBtn = document.createElement('button');
      viewListsBtn.className = 'btn-small';
      viewListsBtn.textContent = 'View Lists';
      viewListsBtn.addEventListener('click', () => viewFriendLists(friend.friend_id, friend.friend_name));
      actionsDiv.appendChild(viewListsBtn);
      
      friendDiv.querySelector('.friend-info').appendChild(actionsDiv);
      container.appendChild(friendDiv);
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error loading friends</div>';
  }
}

async function loadPendingRequests() {
  const container = document.getElementById('requestsList');
  container.innerHTML = '<div class="loading">Loading requests...</div>';
  
  try {
    const requests = await supabaseRPC('get_pending_requests', {});
    
    if (requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📬</div>
          <div>No pending requests</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    requests.forEach(request => {
      const requestDiv = document.createElement('div');
      requestDiv.className = 'friend-item';
      
      requestDiv.innerHTML = `
        <div class="friend-info">
          <div>
            <div class="friend-name">${request.requester_name}</div>
            <div class="friend-email">${request.requester_email}</div>
          </div>
        </div>
      `;
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'friend-actions';
      
      const acceptBtn = document.createElement('button');
      acceptBtn.className = 'btn-small';
      acceptBtn.textContent = 'Accept';
      acceptBtn.addEventListener('click', () => acceptFriendRequest(request.request_id));
      actionsDiv.appendChild(acceptBtn);
      
      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'btn-small danger';
      rejectBtn.textContent = 'Reject';
      rejectBtn.addEventListener('click', () => rejectFriendRequest(request.request_id));
      actionsDiv.appendChild(rejectBtn);
      
      requestDiv.querySelector('.friend-info').appendChild(actionsDiv);
      container.appendChild(requestDiv);
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error loading requests</div>';
  }
}

async function sendFriendRequest() {
  const email = document.getElementById('friendEmail').value.trim();
  
  if (!email) {
    showMessage('addFriendMessage', 'Please enter an email address', 'error');
    return;
  }
  
  if (email === currentUser.email) {
    showMessage('addFriendMessage', 'You cannot add yourself as a friend', 'error');
    return;
  }
  
  try {
    const result = await supabaseRPC('send_friend_request', { friend_email: email });
    
    if (result.success) {
      showMessage('addFriendMessage', 'Friend request sent!', 'success');
      document.getElementById('friendEmail').value = '';
    } else {
      showMessage('addFriendMessage', result.error || 'Failed to send request', 'error');
    }
  } catch (error) {
    showMessage('addFriendMessage', 'Error sending request', 'error');
  }
}

async function acceptFriendRequest(requestId) {
  try {
    const result = await supabaseRPC('accept_friend_request', { request_id: requestId });
    
    if (result.success) {
      showMessage('addFriendMessage', 'Friend request accepted!', 'success');
      loadPendingRequests();
      switchFriendsTab('friends');
    } else {
      showMessage('addFriendMessage', result.error || 'Failed to accept request', 'error');
    }
  } catch (error) {
    showMessage('addFriendMessage', 'Error accepting request', 'error');
  }
}

async function rejectFriendRequest(requestId) {
  if (!confirm('Reject this friend request?')) return;
  
  try {
    const result = await supabaseRPC('reject_friend_request', { request_id: requestId });
    
    if (result.success) {
      showMessage('addFriendMessage', 'Request rejected', 'success');
      loadPendingRequests();
    } else {
      showMessage('addFriendMessage', result.error || 'Failed to reject request', 'error');
    }
  } catch (error) {
    showMessage('addFriendMessage', 'Error rejecting request', 'error');
  }
}

async function viewFriendLists(friendId, friendName) {
  // Close any open modals
  hideModal();
  const friendsModal = document.getElementById('friendsModal');
  if (friendsModal) {
    friendsModal.classList.remove('show');
  }
  
  // Show custom modal with friend's lists
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <div class="modal-header">👥 ${friendName}'s Hintlists</div>
    <div id="friendListsContainer" class="modal-body" style="max-height: 350px; overflow-y: auto;">
      <div class="loading">Loading hintlists...</div>
    </div>
    <button id="closeFriendListsBtn" class="secondary">Close</button>
  `;
  
  document.getElementById('modalOverlay').classList.add('show');
  document.getElementById('closeFriendListsBtn').addEventListener('click', hideModal);
  
  try {
    // Get friend's public lists
    const result = await supabaseRPC('get_friends_public_lists', {});
    
    // Handle if result is not an array or is null
    const allLists = Array.isArray(result) ? result : (result ? [result] : []);
    
    console.log('All public lists from friends:', allLists);
    
    // Get friend's email
    const friendEmail = await getUserEmailById(friendId);
    console.log('Looking for friend email:', friendEmail);
    
    // Filter for this specific friend
    const friendLists = allLists.filter(list => {
      console.log('Comparing:', list.friend_email, 'with', friendEmail);
      return list.friend_email === friendEmail;
    });
    
    console.log('Filtered friend lists:', friendLists);
    
    const container = document.getElementById('friendListsContainer');
    
    // If no lists found via get_friends_public_lists, try getting them directly
    if (friendLists.length === 0) {
      // Alternative: Get all public lists from this specific friend
      const directLists = await supabaseRequest('GET', `/rest/v1/lists?user_id=eq.${friendId}&is_public=eq.true&select=*`);
      console.log('Direct lists query result:', directLists);
      
      if (directLists && directLists.length > 0) {
        // We found public lists! Now check if we have access
        const listsWithAccess = await Promise.all(directLists.map(async (list) => {
          try {
            const access = await supabaseRequest('GET', `/rest/v1/hintlist_access?list_id=eq.${list.id}&user_id=eq.${currentUser.id}&select=*`);
            return {
              list_id: list.id,
              list_name: list.name,
              item_count: 0, // We'll get this separately if needed
              has_access: access && access.length > 0
            };
          } catch (err) {
            return {
              list_id: list.id,
              list_name: list.name,
              item_count: 0,
              has_access: false
            };
          }
        }));
        
        // Use these lists instead
        displayFriendListsInModal(listsWithAccess, friendName, container);
        return;
      }
    }
    
    if (friendLists.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div>${friendName} hasn't shared any hintlists yet</div>
        </div>
      `;
      return;
    }
    
    displayFriendListsInModal(friendLists, friendName, container);
  } catch (error) {
    console.error('Error in viewFriendLists:', error);
    const container = document.getElementById('friendListsContainer');
    container.innerHTML = `<div class="empty-state">Error loading hintlists: ${error.message}</div>`;
  }
}

function displayFriendListsInModal(friendLists, friendName, container) {
  container.innerHTML = '';
  
  friendLists.forEach(list => {
    const listDiv = document.createElement('div');
    listDiv.className = 'list-item';
    listDiv.style.marginBottom = '12px';
    
    listDiv.innerHTML = `
      <div class="list-header">
        <div class="list-name">${list.list_name}</div>
        <div class="list-badges">
          <span class="badge count">${list.item_count || 0} items</span>
          ${list.has_access ? '<span class="badge public">Access granted</span>' : ''}
        </div>
      </div>
    `;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.style.marginTop = '12px';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '8px';
    
    if (list.has_access) {
      // User already has access - can view the list
      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn-small';
      viewBtn.textContent = 'View Items';
      viewBtn.addEventListener('click', () => {
        hideModal();
        viewSharedList(list.list_id, list.list_name);
      });
      actionsDiv.appendChild(viewBtn);
    } else {
      // User needs to request access
      const requestBtn = document.createElement('button');
      requestBtn.className = 'btn-small';
      requestBtn.textContent = 'Request Access';
      requestBtn.addEventListener('click', async () => {
        if (confirm(`Request access to "${list.list_name}"?`)) {
          const code = prompt(`Enter the access code for "${list.list_name}":`);
          if (code) {
            console.log('Attempting to join with code:', code.trim());
            try {
              const result = await supabaseRPC('join_hintlist_by_code', { code: code.trim() });
              console.log('join_hintlist_by_code result:', result);
              
              if (result && result.success) {
                showMessage('addMessage', 'Access granted!', 'success');
                hideModal();
                viewSharedList(list.list_id, list.list_name);
              } else {
                console.error('Access denied:', result);
                alert(result?.error || 'Invalid access code');
              }
            } catch (error) {
              console.error('Error joining hintlist:', error);
              alert(`Error: ${error.message}`);
            }
          }
        }
      });
      actionsDiv.appendChild(requestBtn);
    }
    
    listDiv.appendChild(actionsDiv);
    container.appendChild(listDiv);
  });
}

async function getUserEmailById(userId) {
  // Helper to get email from user ID
  try {
    const users = await supabaseRequest('GET', `/rest/v1/users?id=eq.${userId}&select=email`);
    return users[0]?.email || '';
  } catch (error) {
    return '';
  }
}

async function viewSharedList(listId, listName) {
  // Switch to View Hintlist tab and display the shared list
  switchTab('viewHintlist');
  
  const container = document.getElementById('hintlistContainer');
  container.innerHTML = '<div class="loading">Loading hintlist...</div>';
  
  try {
    const lists = await supabaseRequest('GET', `/rest/v1/lists?id=eq.${listId}&select=*`);
    
    if (lists.length === 0) {
      container.innerHTML = '<div class="empty-state">Hintlist not found</div>';
      return;
    }
    
    const products = await supabaseRequest('GET', `/rest/v1/products?list_id=eq.${listId}&select=*`);
    displayHintlist(lists[0], products);
    
    showMessage('hintlistMessage', `Viewing "${listName}"`, 'info');
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error loading hintlist</div>';
  }
}

async function loadBrowseFriendsModal() {
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <div class="modal-header">👥 Browse Friends</div>
    <div class="modal-body">
      <div style="position: relative; margin-bottom: 16px;">
        <input type="text" id="friendSearchModal" class="modal-input" placeholder="🔍 Search by name..." style="margin-bottom: 0;">
        <div id="searchDropdown" style="position: absolute; width: 100%; background: var(--bg-secondary); border: 2px solid var(--border-color); border-top: none; border-radius: 0 0 6px 6px; max-height: 200px; overflow-y: auto; display: none; z-index: 1000;"></div>
      </div>
      
      <div id="recentFriendsModalSection" style="margin-bottom: 16px;" class="hidden">
        <h3 style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">⏱️ RECENTLY VIEWED</h3>
        <div id="recentFriendsModalContainer"></div>
      </div>
      
      <h3 style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">👥 ALL FRIENDS</h3>
      <div id="allFriendsModalContainer" style="max-height: 250px; overflow-y: auto;">
        <div class="loading">Loading friends...</div>
      </div>
    </div>
    <button id="closeBrowseFriendsBtn" class="secondary">Close</button>
  `;
  
  document.getElementById('modalOverlay').classList.add('show');
  document.getElementById('closeBrowseFriendsBtn').addEventListener('click', hideModal);
  
  // Load friends data
  try {
    const friends = await supabaseRPC('get_friends', {});
    window.currentFriends = friends;
    
    if (friends.length === 0) {
      document.getElementById('allFriendsModalContainer').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div>No friends yet</div>
        </div>
      `;
      return;
    }
    
    // Load recent friends
    const { recentFriends = [] } = await chrome.storage.local.get('recentFriends');
    const recentFriendData = recentFriends
      .map(id => friends.find(f => f.friend_id === id))
      .filter(f => f !== undefined)
      .slice(0, 3);
    
    if (recentFriendData.length > 0) {
      document.getElementById('recentFriendsModalSection').classList.remove('hidden');
      const recentContainer = document.getElementById('recentFriendsModalContainer');
      recentContainer.innerHTML = '';
      recentFriendData.forEach(friend => {
        recentContainer.appendChild(createFriendCard(friend));
      });
    }
    
    // Display all friends
    displayAllFriendsInModal(friends);
    
    // Setup search with dropdown and real-time filtering
    setupFriendSearch(friends);
    
  } catch (error) {
    document.getElementById('allFriendsModalContainer').innerHTML = '<div class="empty-state">Error loading friends</div>';
  }
}

function displayAllFriendsInModal(friends) {
  const container = document.getElementById('allFriendsModalContainer');
  container.innerHTML = '';
  
  friends.forEach(friend => {
    const friendDiv = createFriendCard(friend);
    friendDiv.dataset.friendName = friend.friend_name.toLowerCase();
    container.appendChild(friendDiv);
  });
}

function setupFriendSearch(friends) {
  const searchInput = document.getElementById('friendSearchModal');
  const dropdown = document.getElementById('searchDropdown');
  const allFriendsContainer = document.getElementById('allFriendsModalContainer');
  const recentSection = document.getElementById('recentFriendsModalSection');
  
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    
    if (!term) {
      // Hide dropdown, show all friends
      dropdown.style.display = 'none';
      allFriendsContainer.querySelectorAll('.friend-item').forEach(card => {
        card.style.display = 'block';
      });
      if (recentSection) {
        recentSection.classList.remove('hidden');
        document.getElementById('recentFriendsModalContainer').querySelectorAll('.friend-item').forEach(card => {
          card.style.display = 'block';
        });
      }
      return;
    }
    
    // Show dropdown with matching friends
    const matches = friends.filter(f => f.friend_name.toLowerCase().includes(term));
    
    if (matches.length > 0) {
      dropdown.innerHTML = '';
      matches.forEach(friend => {
        const item = document.createElement('div');
        item.style.padding = '10px';
        item.style.cursor = 'pointer';
        item.style.borderBottom = '1px solid var(--border-color)';
        item.textContent = friend.friend_name;
        item.addEventListener('click', async () => {
          searchInput.value = '';
          dropdown.style.display = 'none';
          await addToRecentFriends(friend.friend_id);
          hideModal();
          viewFriendLists(friend.friend_id, friend.friend_name);
        });
        item.addEventListener('mouseenter', () => {
          item.style.background = 'var(--bg-tertiary)';
        });
        item.addEventListener('mouseleave', () => {
          item.style.background = 'white';
        });
        dropdown.appendChild(item);
      });
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
    
    // Real-time filter in Recent and All Friends
    allFriendsContainer.querySelectorAll('.friend-item').forEach(card => {
      const name = card.dataset.friendName || '';
      card.style.display = name.includes(term) ? 'block' : 'none';
    });
    
    if (recentSection) {
      const recentContainer = document.getElementById('recentFriendsModalContainer');
      recentContainer.querySelectorAll('.friend-item').forEach(card => {
        const name = card.dataset.friendName || '';
        if (name.includes(term)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
          // Hide entire recent section if no matches
          const visibleInRecent = Array.from(recentContainer.querySelectorAll('.friend-item')).some(c => c.style.display !== 'none');
          recentSection.style.display = visibleInRecent ? 'block' : 'none';
        }
      });
    }
  });
  
  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

function createFriendCard(friend) {
  const friendDiv = document.createElement('div');
  friendDiv.className = 'friend-item';
  friendDiv.style.marginBottom = '8px';
  friendDiv.dataset.friendName = friend.friend_name.toLowerCase();
  
  friendDiv.innerHTML = `
    <div class="friend-info">
      <div>
        <div class="friend-name">${friend.friend_name}</div>
        <div class="friend-email">${friend.friend_email}</div>
      </div>
    </div>
  `;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'friend-actions';
  
  const viewListsBtn = document.createElement('button');
  viewListsBtn.className = 'btn-small';
  viewListsBtn.textContent = 'View Lists';
  viewListsBtn.addEventListener('click', async () => {
    await addToRecentFriends(friend.friend_id);
    hideModal();
    viewFriendLists(friend.friend_id, friend.friend_name);
  });
  actionsDiv.appendChild(viewListsBtn);
  
  friendDiv.querySelector('.friend-info').appendChild(actionsDiv);
  
  return friendDiv;
}

async function loadBrowseFriends() {
  const container = document.getElementById('browseFriendsContainer');
  container.innerHTML = '<div class="loading">Loading friends...</div>';
  
  try {
    const friends = await supabaseRPC('get_friends', {});
    
    if (friends.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div>No friends yet</div>
          <div style="font-size: 12px; margin-top: 8px;">Add friends to share hintlists!</div>
        </div>
      `;
      return;
    }
    
    // Store all friends for filtering
    window.allFriends = friends;
    
    // Load recent friends
    await loadRecentFriends();
    
    // Display all friends
    displayFriendsList(friends, container);
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error loading friends</div>';
  }
}

async function loadRecentFriends() {
  const { recentFriends = [] } = await chrome.storage.local.get('recentFriends');
  
  if (recentFriends.length === 0) {
    document.getElementById('recentFriendsSection').classList.add('hidden');
    return;
  }
  
  document.getElementById('recentFriendsSection').classList.remove('hidden');
  const container = document.getElementById('recentFriendsContainer');
  container.innerHTML = '';
  
  // Get friend details for recent IDs
  const allFriends = window.allFriends || [];
  const recentFriendData = recentFriends
    .map(id => allFriends.find(f => f.friend_id === id))
    .filter(f => f !== undefined)
    .slice(0, 3); // Show max 3 recent
  
  recentFriendData.forEach(friend => {
    const friendDiv = createFriendCard(friend, true);
    container.appendChild(friendDiv);
  });
}

function createFriendCard(friend, isRecent = false) {
  const friendDiv = document.createElement('div');
  friendDiv.className = 'friend-item';
  friendDiv.style.marginBottom = '8px';
  
  friendDiv.innerHTML = `
    <div class="friend-info">
      <div>
        <div class="friend-name">${friend.friend_name}</div>
        <div class="friend-email">${friend.friend_email}</div>
      </div>
    </div>
  `;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'friend-actions';
  
  const viewListsBtn = document.createElement('button');
  viewListsBtn.className = 'btn-small';
  viewListsBtn.textContent = 'View Lists';
  viewListsBtn.addEventListener('click', async () => {
    await addToRecentFriends(friend.friend_id);
    viewFriendLists(friend.friend_id, friend.friend_name);
  });
  actionsDiv.appendChild(viewListsBtn);
  
  friendDiv.querySelector('.friend-info').appendChild(actionsDiv);
  
  return friendDiv;
}

function displayFriendsList(friends, container) {
  container.innerHTML = '';
  
  friends.forEach(friend => {
    const friendDiv = createFriendCard(friend);
    friendDiv.dataset.friendName = friend.friend_name.toLowerCase();
    friendDiv.dataset.friendEmail = friend.friend_email.toLowerCase();
    container.appendChild(friendDiv);
  });
}

function filterFriends(searchTerm) {
  const container = document.getElementById('browseFriendsContainer');
  const friendCards = container.querySelectorAll('.friend-item');
  const term = searchTerm.toLowerCase().trim();
  
  if (!term) {
    // Show all
    friendCards.forEach(card => card.style.display = 'block');
    return;
  }
  
  // Filter by name or email
  friendCards.forEach(card => {
    const name = card.dataset.friendName || '';
    const email = card.dataset.friendEmail || '';
    
    if (name.includes(term) || email.includes(term)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

async function addToRecentFriends(friendId) {
  const { recentFriends = [] } = await chrome.storage.local.get('recentFriends');
  
  // Remove if already exists
  const filtered = recentFriends.filter(id => id !== friendId);
  
  // Add to beginning
  const updated = [friendId, ...filtered].slice(0, 5); // Keep max 5
  
  await chrome.storage.local.set({ recentFriends: updated });
}

async function loadMyClaims() {
  const container = document.getElementById('myClaimsContainer');

  // Show skeleton loading
  showListsSkeleton(container, 2);
  
  try {
    const claims = await supabaseRPC('get_my_claimed_products', {});
    
    if (claims.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎁</div>
          <div>No claimed items yet</div>
          <div style="font-size: 12px; margin-top: 8px;">Items you claim from friends' hintlists will appear here</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    // Group by list
    const groupedByList = {};
    claims.forEach(claim => {
      const key = claim.list_name;
      if (!groupedByList[key]) {
        groupedByList[key] = {
          listName: claim.list_name,
          ownerName: claim.list_owner_name,
          products: []
        };
      }
      groupedByList[key].products.push(claim);
    });
    
    // Display each list group
    Object.values(groupedByList).forEach(group => {
      const listDiv = document.createElement('div');
      listDiv.className = 'list-item';
      
      listDiv.innerHTML = `
        <div class="list-header">
          <div class="list-name">${group.listName}</div>
          <div class="list-badges">
            <span class="badge count">${group.products.length} claimed</span>
          </div>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
          From ${group.ownerName}'s hintlist
        </div>
      `;
      
      group.products.forEach(claim => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-item claimed';
        
        // Thumbnail
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'product-thumbnail';
        if (claim.image_url) {
          const img = document.createElement('img');
          img.src = claim.image_url;
          img.alt = claim.product_name;
          img.onerror = () => {
            thumbnailDiv.innerHTML = '<div class="product-thumbnail-placeholder">📦</div>';
          };
          thumbnailDiv.appendChild(img);
        } else {
          thumbnailDiv.innerHTML = '<div class="product-thumbnail-placeholder">📦</div>';
        }
        productDiv.appendChild(thumbnailDiv);
        
        // Product details container
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'product-details';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'product-name';
        nameDiv.textContent = claim.product_name;
        detailsDiv.appendChild(nameDiv);
        
        if (claim.current_price) {
          const priceDiv = document.createElement('div');
          priceDiv.className = 'product-meta';
          priceDiv.textContent = `$${claim.current_price}`;
          detailsDiv.appendChild(priceDiv);
        }
        
        const claimedDiv = document.createElement('div');
        claimedDiv.className = 'product-meta claimed-status';
        claimedDiv.textContent = `✓ Claimed ${new Date(claim.claimed_at).toLocaleDateString()}`;
        detailsDiv.appendChild(claimedDiv);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'product-actions';
        actionsDiv.classList.add('show'); // Always show for claims

        if (claim.product_url) {
          const visitBtn = document.createElement('button');
          visitBtn.className = 'btn-icon';
          visitBtn.textContent = '🛒';
          visitBtn.title = 'Buy now';
          visitBtn.addEventListener('click', () => window.open(claim.product_url, '_blank'));
          actionsDiv.appendChild(visitBtn);
        }

        const unclaimBtn = document.createElement('button');
        unclaimBtn.className = 'btn-icon secondary';
        unclaimBtn.textContent = '↩️';
        unclaimBtn.title = 'Unclaim item';
        unclaimBtn.addEventListener('click', async () => {
          if (!confirm(`Unclaim "${claim.product_name}"?`)) return;
          try {
            const result = await supabaseRPC('unclaim_product', { product_id: claim.product_id });
            if (result.success) {
              showMessage('addMessage', 'Item unclaimed', 'success');
              await loadMyClaims();
            } else {
              showMessage('addMessage', result.error || 'Error unclaiming', 'error');
            }
          } catch (error) {
            showMessage('addMessage', 'Error unclaiming item', 'error');
          }
        });
        actionsDiv.appendChild(unclaimBtn);
        
        detailsDiv.appendChild(actionsDiv);
        productDiv.appendChild(detailsDiv);
        listDiv.appendChild(productDiv);
      });
      
      container.appendChild(listDiv);
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error loading claims</div>';
  }
}

// Helper function for RPC calls
async function supabaseRPC(functionName, params) {
  return await supabaseRequest('POST', `/rest/v1/rpc/${functionName}`, params);
}

function switchTab(tab) {
  document.querySelectorAll('.tab-buttons button').forEach(btn => btn.classList.remove('active'));

  // Get all views
  const views = ['addView', 'myListsView', 'myClaimsView', 'viewHintlistView'];
  let targetView = null;

  // Hide all views with fade out
  views.forEach(viewId => {
    const view = document.getElementById(viewId);
    if (!view.classList.contains('hidden')) {
      view.style.opacity = '0';
      view.style.transform = 'translateY(-4px)';
      setTimeout(() => {
        view.classList.add('hidden');
        view.style.opacity = '';
        view.style.transform = '';
      }, 150);
    }
  });

  // Determine target view
  if (tab === 'add') {
    document.getElementById('addTab').classList.add('active');
    targetView = document.getElementById('addView');
    setTimeout(() => autoFillCurrentPage(), 200);
  } else if (tab === 'myLists') {
    document.getElementById('myListsTab').classList.add('active');
    targetView = document.getElementById('myListsView');
    setTimeout(() => displayMyLists(), 200);
  } else if (tab === 'myClaims') {
    document.getElementById('myClaimsTab').classList.add('active');
    targetView = document.getElementById('myClaimsView');
    setTimeout(() => loadMyClaims(), 200);
  } else if (tab === 'viewHintlist') {
    document.getElementById('viewHintlistTab').classList.add('active');
    targetView = document.getElementById('viewHintlistView');
  }

  // Show target view with fade in
  if (targetView) {
    setTimeout(() => {
      targetView.classList.remove('hidden');
      targetView.style.opacity = '0';
      targetView.style.transform = 'translateY(4px)';
      requestAnimationFrame(() => {
        targetView.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        targetView.style.opacity = '1';
        targetView.style.transform = 'translateY(0)';
      });
    }, 160);
  }
}

function showConfig() {
  hideAllSections();
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

function showLogin() {
  hideAllSections();
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

function showSignup() {
  hideAllSections();
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

function showApp() {
  hideAllSections();
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
  const fullName = currentUser?.user_metadata?.name || 
                   currentUser?.name || 
                   currentUser?.email?.split('@')[0] || 
                   'user';
  
  // Extract first name - split by space OR dot (preserve original capitalization)
  const userName = fullName.split(/[\s.]+/)[0];
  const userEmail = currentUser?.email || currentUser?.user?.email || '';
  
  // Display as: name • email
  document.getElementById('userInfo').textContent = `${userName} • ${userEmail}`;
}

function hideAllSections() {
  document.getElementById('configSection').classList.add('hidden');
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('appSection').classList.add('hidden');
}

function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (el) {
    // Clear any existing timeout
    if (el._messageTimeout) clearTimeout(el._messageTimeout);

    el.className = `message ${type}`;
    el.textContent = text;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';

    // Auto-hide with fade
    el._messageTimeout = setTimeout(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => {
        el.textContent = '';
        el.className = '';
        el.style.opacity = '';
        el.style.transform = '';
      }, 300);
    }, 4000);
  }

  // Also show as toast for success messages
  if (type === 'success' && text.length < 50) {
    showToast(text, 'success', 2500);
  }
}

function showCustomModal(title, bodyHtml, onConfirm) {
  const modal = document.getElementById('modalContent');
  modal.innerHTML = `
    <div class="modal-header">${title}</div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-buttons">
      <button id="modalCancelBtn" class="secondary">Cancel</button>
      <button id="modalConfirmBtn">Confirm</button>
    </div>
  `;
  
  document.getElementById('modalOverlay').classList.add('show');
  
  document.getElementById('modalCancelBtn').addEventListener('click', hideModal);
  document.getElementById('modalConfirmBtn').addEventListener('click', onConfirm);
  
  // Auto-focus first input
  setTimeout(() => {
    const firstInput = modal.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 100);
}

function hideModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}

// Export list to Excel (CSV format)
function exportListToExcel(list, products) {
  // Create CSV content
  const headers = ['Product Name', 'URL', 'Claimed', 'Date Added', 'Current Price'];
  const rows = [headers];
  
  products.forEach(product => {
    const row = [
      product.name || '',
      product.url || '',
      product.claimed_by ? 'Yes' : 'No',
      product.created_at ? new Date(product.created_at).toLocaleDateString() : '',
      product.current_price ? `$${product.current_price}` : 'N/A'
    ];
    rows.push(row);
  });
  
  // Convert to CSV string
  const csvContent = rows.map(row => 
    row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(cell).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
    }).join(',')
  ).join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${list.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  
  showMessage('addMessage', 'List exported successfully!', 'success');
}

// ============================================
// LEADERBOARD FUNCTIONS
// ============================================

let currentLeaderboardTimeframe = 'all';

// Track leaderboard state
let friendsOnlyLeaderboard = false;

async function openLeaderboardModal() {
  const modalContent = `
    <div class="modal-header" style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 24px;">🏆</span>
      <span>Leaderboard</span>
    </div>
    <div class="modal-body" style="padding: 0;">
      <!-- Filter row: Time + Friends toggle -->
      <div style="display: flex; border-bottom: 1px solid var(--border-color); background: var(--bg-tertiary);">
        <button class="leaderboard-tab active" data-timeframe="all" style="flex: 1; padding: 10px; border: none; background: transparent; cursor: pointer; font-size: 12px; color: var(--text-secondary); border-bottom: 2px solid transparent;">All Time</button>
        <button class="leaderboard-tab" data-timeframe="month" style="flex: 1; padding: 10px; border: none; background: transparent; cursor: pointer; font-size: 12px; color: var(--text-secondary); border-bottom: 2px solid transparent;">Month</button>
        <button class="leaderboard-tab" data-timeframe="week" style="flex: 1; padding: 10px; border: none; background: transparent; cursor: pointer; font-size: 12px; color: var(--text-secondary); border-bottom: 2px solid transparent;">Week</button>
        <button class="leaderboard-tab" data-timeframe="today" style="flex: 1; padding: 10px; border: none; background: transparent; cursor: pointer; font-size: 12px; color: var(--text-secondary); border-bottom: 2px solid transparent;">Today</button>
      </div>

      <!-- Friends toggle -->
      <div style="display: flex; justify-content: center; padding: 8px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">
        <button id="globalToggle" class="leaderboard-scope-btn active" style="padding: 6px 16px; border: none; background: var(--green-primary); color: white; border-radius: 16px 0 0 16px; font-size: 11px; cursor: pointer; font-weight: 500;">🌍 Global</button>
        <button id="friendsToggle" class="leaderboard-scope-btn" style="padding: 6px 16px; border: none; background: var(--bg-tertiary); color: var(--text-secondary); border-radius: 0 16px 16px 0; font-size: 11px; cursor: pointer; font-weight: 500;">👥 Friends</button>
      </div>

      <!-- Your stats banner -->
      <div id="yourRankBanner" style="background: linear-gradient(135deg, var(--green-primary), #1a6b44); color: white; padding: 12px 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; opacity: 0.9;">Your Rank</div>
            <div style="font-size: 20px; font-weight: bold;">#<span id="yourRankNumber">-</span></div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 11px; opacity: 0.9;">Streak</div>
            <div style="font-size: 20px; font-weight: bold;">🔥 <span id="yourStreak">0</span></div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; opacity: 0.9;">Points</div>
            <div style="font-size: 20px; font-weight: bold;"><span id="yourPoints">0</span> 🎁</div>
          </div>
        </div>
        <!-- Badges row -->
        <div id="yourBadges" style="margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
        </div>
      </div>
      
      <!-- Top 3 Podium -->
      <div id="podiumSection" style="padding: 16px; background: var(--bg-secondary);">
        <div style="display: flex; justify-content: center; align-items: flex-end; gap: 8px; height: 140px;">
          <!-- 2nd Place -->
          <div id="place2" class="podium-spot" style="text-align: center; width: 80px;">
            <div class="podium-avatar" style="width: 50px; height: 50px; border-radius: 50%; background: var(--bg-tertiary); margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid #C0C0C0;">-</div>
            <div class="podium-name" style="font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</div>
            <div class="podium-points" style="font-size: 10px; color: var(--text-secondary);">- pts</div>
            <div style="background: #C0C0C0; height: 60px; border-radius: 6px 6px 0 0; margin-top: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; color: white;">2</div>
          </div>
          
          <!-- 1st Place -->
          <div id="place1" class="podium-spot" style="text-align: center; width: 90px;">
            <div style="font-size: 20px; margin-bottom: 4px;">👑</div>
            <div class="podium-avatar" style="width: 60px; height: 60px; border-radius: 50%; background: var(--bg-tertiary); margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 3px solid #FFD700;">-</div>
            <div class="podium-name" style="font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</div>
            <div class="podium-points" style="font-size: 11px; color: var(--text-secondary);">- pts</div>
            <div style="background: #FFD700; height: 80px; border-radius: 6px 6px 0 0; margin-top: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: white;">1</div>
          </div>
          
          <!-- 3rd Place -->
          <div id="place3" class="podium-spot" style="text-align: center; width: 80px;">
            <div class="podium-avatar" style="width: 50px; height: 50px; border-radius: 50%; background: var(--bg-tertiary); margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid #CD7F32;">-</div>
            <div class="podium-name" style="font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</div>
            <div class="podium-points" style="font-size: 10px; color: var(--text-secondary);">- pts</div>
            <div style="background: #CD7F32; height: 40px; border-radius: 6px 6px 0 0; margin-top: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; color: white;">3</div>
          </div>
        </div>
      </div>
      
      <!-- Rest of leaderboard -->
      <div id="leaderboardList" style="max-height: 150px; overflow-y: auto;">
        <div style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading...</div>
      </div>
      
      <!-- How points work -->
      <div style="padding: 12px 16px; background: var(--bg-tertiary); border-top: 1px solid var(--border-color);">
        <div style="font-size: 11px; color: var(--text-secondary); text-align: center;">
          <strong>How to earn points:</strong> Claim gifts (+10), Create lists (+2), Add items (+1)
        </div>
      </div>
    </div>
    <div class="modal-buttons">
      <button id="closeLeaderboardBtn" class="secondary">Close</button>
    </div>
  `;
  
  document.getElementById('modalContent').innerHTML = modalContent;
  document.getElementById('modalOverlay').classList.add('show');
  
  // Add event listeners
  document.getElementById('closeLeaderboardBtn').addEventListener('click', hideModal);

  // Friends/Global toggle
  document.getElementById('globalToggle').addEventListener('click', () => {
    friendsOnlyLeaderboard = false;
    document.getElementById('globalToggle').style.background = 'var(--green-primary)';
    document.getElementById('globalToggle').style.color = 'white';
    document.getElementById('friendsToggle').style.background = 'var(--bg-tertiary)';
    document.getElementById('friendsToggle').style.color = 'var(--text-secondary)';
    loadLeaderboardData(currentLeaderboardTimeframe);
  });

  document.getElementById('friendsToggle').addEventListener('click', () => {
    friendsOnlyLeaderboard = true;
    document.getElementById('friendsToggle').style.background = 'var(--green-primary)';
    document.getElementById('friendsToggle').style.color = 'white';
    document.getElementById('globalToggle').style.background = 'var(--bg-tertiary)';
    document.getElementById('globalToggle').style.color = 'var(--text-secondary)';
    loadLeaderboardData(currentLeaderboardTimeframe);
  });

  // Tab switching
  document.querySelectorAll('.leaderboard-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.leaderboard-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--text-secondary)';
        t.style.borderBottomColor = 'transparent';
      });
      tab.classList.add('active');
      tab.style.color = 'var(--green-primary)';
      tab.style.borderBottomColor = 'var(--green-primary)';
      currentLeaderboardTimeframe = tab.dataset.timeframe;
      loadLeaderboardData(currentLeaderboardTimeframe);
    });
  });

  // Set active tab styling
  const activeTab = document.querySelector('.leaderboard-tab.active');
  if (activeTab) {
    activeTab.style.color = 'var(--green-primary)';
    activeTab.style.borderBottomColor = 'var(--green-primary)';
  }

  // Load initial data
  friendsOnlyLeaderboard = false;
  await loadLeaderboardData('all');
}

// Badge definitions
const BADGES = {
  first_gift: { emoji: '🎁', name: 'First Gift', desc: 'Claimed your first item' },
  generous_5: { emoji: '💚', name: 'Generous', desc: 'Claimed 5+ items' },
  generous_10: { emoji: '💚', name: 'Super Generous', desc: 'Claimed 10+ items' },
  gift_master: { emoji: '👑', name: 'Gift Master', desc: 'Claimed 50+ items' },
  list_creator: { emoji: '📝', name: 'List Maker', desc: 'Created 3+ lists' },
  streak_7: { emoji: '🔥', name: 'On Fire', desc: '7-day streak' },
  streak_30: { emoji: '⚡', name: 'Unstoppable', desc: '30-day streak' },
  early_bird: { emoji: '🐦', name: 'Early Bird', desc: 'Claimed within 24h of item added' },
  secret_santa: { emoji: '🎅', name: 'Secret Santa', desc: 'Claimed for 5+ different people' }
};

async function loadLeaderboardData(timeframe = 'all') {
  try {
    const userEmail = currentUser?.email || currentUser?.user?.email;
    const userId = currentUser?.id || currentUser?.user?.id;

    // Get leaderboard data (with friends filter if enabled)
    const leaderboardResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_leaderboard`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_timeframe: timeframe,
          p_limit: 10,
          p_friends_only: friendsOnlyLeaderboard,
          p_user_id: userId || null
        })
      }
    );

    let leaderboard = [];
    if (leaderboardResponse.ok) {
      leaderboard = await leaderboardResponse.json();
    }

    // Get current user's rank, streak, and badges
    let userRank = null;
    let userStreak = 0;
    let userBadges = [];

    if (userId || userEmail) {
      // Get rank
      const rankResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_user_rank`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_user_id: userId || null,
            p_email: userEmail || null,
            p_timeframe: timeframe,
            p_friends_only: friendsOnlyLeaderboard
          })
        }
      );

      if (rankResponse.ok) {
        const rankData = await rankResponse.json();
        if (rankData && rankData.length > 0) {
          userRank = rankData[0];
        }
      }

      // Get user stats (streak and badges)
      const statsResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_user_stats`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_user_id: userId || null,
            p_email: userEmail || null
          })
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData && statsData.length > 0) {
          userStreak = statsData[0].streak_days || 0;
          userBadges = statsData[0].badges || [];
        }
      }
    }

    // Update your rank banner
    document.getElementById('yourRankNumber').textContent = userRank?.rank || '-';
    document.getElementById('yourPoints').textContent = userRank?.points || '0';
    document.getElementById('yourStreak').textContent = userStreak;

    // Update badges display
    const badgesContainer = document.getElementById('yourBadges');
    if (userBadges.length > 0) {
      badgesContainer.innerHTML = userBadges.map(badgeId => {
        const badge = BADGES[badgeId];
        if (!badge) return '';
        return `<span title="${badge.name}: ${badge.desc}" style="font-size: 16px; cursor: help;">${badge.emoji}</span>`;
      }).join('');
    } else {
      badgesContainer.innerHTML = '<span style="font-size: 11px; opacity: 0.7;">No badges yet - keep claiming!</span>';
    }

    // Update podium
    updatePodium(leaderboard);

    // Update list (4th place and below)
    updateLeaderboardList(leaderboard.slice(3));

  } catch (error) {
    console.error('Error loading leaderboard:', error);
    document.getElementById('leaderboardList').innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
        ${friendsOnlyLeaderboard ? 'No friends data yet. Add some friends!' : 'No leaderboard data yet. Start claiming gifts to earn points!'}
      </div>
    `;
  }
}

function updatePodium(leaderboard) {
  const places = [
    { id: 'place1', index: 0 },
    { id: 'place2', index: 1 },
    { id: 'place3', index: 2 }
  ];

  places.forEach(({ id, index }) => {
    const place = document.getElementById(id);
    const user = leaderboard[index];

    if (user) {
      const avatar = place.querySelector('.podium-avatar');
      const name = place.querySelector('.podium-name');
      const points = place.querySelector('.podium-points');

      // Set avatar (first letter of name or emoji)
      const initial = (user.name || user.email || '?')[0].toUpperCase();
      avatar.textContent = initial;
      avatar.style.background = getAvatarColor(user.name || user.email);
      avatar.style.color = 'white';
      avatar.style.fontWeight = 'bold';

      // Set name with top badge (truncated)
      const displayName = user.name || user.email?.split('@')[0] || 'Anonymous';
      const truncName = displayName.length > 8 ? displayName.substring(0, 8) + '..' : displayName;

      // Show top badge if user has any
      const topBadge = user.badges && user.badges.length > 0 ? BADGES[user.badges[0]]?.emoji || '' : '';
      name.innerHTML = `${truncName} ${topBadge}`;
      name.title = displayName + (user.badges?.length > 0 ? ` - ${user.badges.length} badges` : '');

      // Set points with streak if > 0
      const streakText = user.streak_days > 0 ? ` 🔥${user.streak_days}` : '';
      points.textContent = `${user.points} pts${streakText}`;
    } else {
      const avatar = place.querySelector('.podium-avatar');
      const name = place.querySelector('.podium-name');
      const points = place.querySelector('.podium-points');

      avatar.textContent = '-';
      avatar.style.background = 'var(--bg-tertiary)';
      name.textContent = '-';
      points.textContent = '- pts';
    }
  });
}

function updateLeaderboardList(users) {
  const container = document.getElementById('leaderboardList');

  if (!users || users.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 13px;">
        ${friendsOnlyLeaderboard ? 'Add friends to see their rankings!' : 'No more rankings to show'}
      </div>
    `;
    return;
  }

  container.innerHTML = users.map((user, idx) => {
    const rank = idx + 4; // Starting from 4th place
    const displayName = user.name || user.email?.split('@')[0] || 'Anonymous';
    const initial = (user.name || user.email || '?')[0].toUpperCase();
    const avatarColor = getAvatarColor(user.name || user.email);

    // Get badges display (show up to 3)
    const badgesHtml = user.badges && user.badges.length > 0
      ? user.badges.slice(0, 3).map(b => BADGES[b]?.emoji || '').join('')
      : '';

    // Streak indicator
    const streakHtml = user.streak_days > 0 ? `<span style="font-size: 10px; color: #ff6b35;">🔥${user.streak_days}</span>` : '';

    return `
      <div style="display: flex; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border-color);">
        <div style="width: 24px; font-weight: bold; color: var(--text-secondary); font-size: 13px;">${rank}</div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 10px;">${initial}</div>
        <div style="flex: 1; overflow: hidden;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-weight: 500; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayName}</span>
            <span style="font-size: 12px;">${badgesHtml}</span>
            ${streakHtml}
          </div>
        </div>
        <div style="font-weight: 600; color: var(--green-primary); font-size: 13px;">${user.points} pts</div>
      </div>
    `;
  }).join('');
}

function getAvatarColor(str) {
  const colors = [
    '#e74c3c', '#3498db', '#9b59b6', '#1abc9c', '#f39c12',
    '#e67e22', '#2ecc71', '#34495e', '#16a085', '#c0392b'
  ];
  
  if (!str) return colors[0];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Function to award points (call this when relevant actions happen)
async function awardPoints(eventType, points, description = null, productId = null, listId = null) {
  try {
    const userEmail = currentUser?.email || currentUser?.user?.email;
    const userId = currentUser?.id || currentUser?.user?.id;
    const userName = currentUser?.user_metadata?.name || currentUser?.name || userEmail?.split('@')[0];

    await fetch(
      `${supabaseUrl}/rest/v1/rpc/award_points`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_user_id: userId || null,
          p_email: userEmail || null,
          p_name: userName || null,
          p_event_type: eventType,
          p_points: points,
          p_description: description,
          p_product_id: productId,
          p_list_id: listId
        })
      }
    );

    // Check for new badges after point award
    await checkAndAwardBadges(userId, userEmail, eventType);

  } catch (error) {
    console.error('Error awarding points:', error);
  }
}

// Check if user earned any new badges
async function checkAndAwardBadges(userId, userEmail, eventType) {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/check_and_award_badges`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_user_id: userId || null,
          p_email: userEmail || null,
          p_event_type: eventType
        })
      }
    );

    if (response.ok) {
      const result = await response.json();
      // Show notification for new badges
      if (result && result.new_badges && result.new_badges.length > 0) {
        result.new_badges.forEach(badgeId => {
          const badge = BADGES[badgeId];
          if (badge) {
            showBadgeNotification(badge);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

// Show a price drop alert notification
function showPriceDropAlert(product, currentPrice, targetPrice) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
    z-index: 10001;
    max-width: 320px;
    animation: badgeSlideIn 0.3s ease-out;
  `;

  const savings = (targetPrice - currentPrice).toFixed(2);
  const productName = product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name;

  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="font-size: 32px;">🎉</span>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">Price Drop Alert!</div>
        <div style="font-size: 13px; opacity: 0.95; margin-bottom: 8px;">${productName}</div>
        <div style="display: flex; gap: 12px; font-size: 14px;">
          <span>Now: <strong>$${currentPrice.toFixed(2)}</strong></span>
          <span style="opacity: 0.8;">Target: $${targetPrice.toFixed(2)}</span>
        </div>
        ${product.url ? `
        <button onclick="window.open('${product.url}', '_blank'); this.parentElement.parentElement.parentElement.remove();"
          style="margin-top: 10px; padding: 8px 16px; background: white; color: #16a34a; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">
          🛒 Buy Now
        </button>
        ` : ''}
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; opacity: 0.7; cursor: pointer; font-size: 18px; padding: 0;">×</button>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 10 seconds (longer for important alerts)
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'badgeSlideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, 10000);
}

// Show a toast notification for new badge
function showBadgeNotification(badge) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, var(--green-primary), #1a6b44);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 10001;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: badgeSlideIn 0.3s ease-out;
  `;
  notification.innerHTML = `
    <span style="font-size: 28px;">${badge.emoji}</span>
    <div>
      <div style="font-weight: 600; font-size: 14px;">New Badge Earned!</div>
      <div style="font-size: 12px; opacity: 0.9;">${badge.name}: ${badge.desc}</div>
    </div>
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'badgeSlideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}