// SmartList Extension Logic
let supabaseUrl = '';
let supabaseKey = '';
let currentUser = null;
let currentLists = [];
let currentProducts = [];

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  setupEventListeners();
});

// Load configuration and check auth
async function loadConfig() {
  const config = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey', 'session']);
  
  if (config.supabaseUrl && config.supabaseKey) {
    supabaseUrl = config.supabaseUrl;
    supabaseKey = config.supabaseKey;
    
    // Check if user has valid session
    if (config.session) {
      currentUser = config.session.user;
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

// Setup all event listeners
function setupEventListeners() {
  // Config
  document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
  document.getElementById('showConfigLink').addEventListener('click', (e) => {
    e.preventDefault();
    showConfig();
  });
  
  // Auth
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('signupBtn').addEventListener('click', signup);
  document.getElementById('showSignupBtn').addEventListener('click', showSignup);
  document.getElementById('showLoginLink').addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // Tabs
  document.getElementById('addTab').addEventListener('click', () => switchTab('add'));
  document.getElementById('myListsTab').addEventListener('click', () => switchTab('myLists'));
  document.getElementById('viewWishlistTab').addEventListener('click', () => switchTab('viewWishlist'));
  
  // Actions
  document.getElementById('createListBtn').addEventListener('click', createNewList);
  document.getElementById('addProductBtn').addEventListener('click', addProduct);
  document.getElementById('loadWishlistBtn').addEventListener('click', loadWishlist);
}

// Save Supabase configuration
async function saveConfig() {
  const url = document.getElementById('supabaseUrl').value.trim();
  const key = document.getElementById('supabaseKey').value.trim();
  
  if (!url || !key) {
    showMessage('configMessage', 'Please enter both URL and key', 'error');
    return;
  }
  
  // Validate URL format
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    showMessage('configMessage', 'Please enter a valid Supabase URL', 'error');
    return;
  }
  
  await chrome.storage.local.set({ supabaseUrl: url, supabaseKey: key });
  supabaseUrl = url;
  supabaseKey = key;
  
  showMessage('configMessage', 'Configuration saved!', 'success');
  setTimeout(() => showLogin(), 1000);
}

// Authentication functions
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
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.error) {
      showMessage('loginMessage', data.error.message || 'Login failed', 'error');
      return;
    }
    
    // Save session
    await chrome.storage.local.set({ session: data });
    currentUser = data.user;
    
    // Create user record if doesn't exist
    await ensureUserRecord();
    
    showMessage('loginMessage', 'Logged in successfully!', 'success');
    setTimeout(() => {
      showApp();
      loadUserData();
      autoFillCurrentPage();
    }, 500);
    
  } catch (error) {
    showMessage('loginMessage', 'Connection error. Please check your configuration.', 'error');
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
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.error) {
      showMessage('signupMessage', data.error.message || 'Signup failed', 'error');
      return;
    }
    
    // Save session
    await chrome.storage.local.set({ session: data });
    currentUser = data.user;
    
    // Create user record
    await supabaseRequest('POST', '/rest/v1/users', {
      id: currentUser.id,
      email: email,
      name: name
    });
    
    showMessage('signupMessage', 'Account created!', 'success');
    setTimeout(() => {
      showApp();
      loadUserData();
      autoFillCurrentPage();
    }, 500);
    
  } catch (error) {
    showMessage('signupMessage', 'Connection error. Please check your configuration.', 'error');
  }
}

async function logout() {
  await chrome.storage.local.remove('session');
  currentUser = null;
  currentLists = [];
  currentProducts = [];
  showLogin();
}

// Ensure user record exists
async function ensureUserRecord() {
  const session = await chrome.storage.local.get('session');
  const token = session.session?.access_token;
  
  if (!token) return;
  
  try {
    await supabaseRequest('POST', '/rest/v1/users', {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.email.split('@')[0]
    }, token);
  } catch (error) {
    // User might already exist, that's okay
  }
}

// Generic Supabase request helper
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
  
  const options = {
    method,
    headers
  };
  
  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${supabaseUrl}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

// Load user's lists and products
async function loadUserData() {
  try {
    // Load lists
    currentLists = await supabaseRequest('GET', `/rest/v1/lists?user_id=eq.${currentUser.id}&select=*`);
    
    // Load products for user's lists
    if (currentLists.length > 0) {
      const listIds = currentLists.map(l => l.id).join(',');
      currentProducts = await supabaseRequest('GET', `/rest/v1/products?list_id=in.(${listIds})&select=*`);
    }
    
    updateListsDropdown();
    if (document.getElementById('myListsView').classList.contains('hidden') === false) {
      displayMyLists();
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Update lists dropdown
function updateListsDropdown() {
  const select = document.getElementById('listSelect');
  select.innerHTML = '<option value="">Select a list...</option>';
  
  currentLists.forEach(list => {
    const option = document.createElement('option');
    option.value = list.id;
    option.textContent = `${list.name}${list.is_public ? ' 🌍' : ' 🔒'}`;
    select.appendChild(option);
  });
}

// Auto-fill current page
async function autoFillCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.url.startsWith('chrome://')) {
      document.getElementById('productUrl').value = tab.url;
      if (!document.getElementById('productName').value) {
        document.getElementById('productName').value = tab.title;
      }
    }
  } catch (error) {
    // Silently fail for restricted pages
  }
}

// Create new list
async function createNewList() {
  const name = prompt('Enter list name (e.g., "Mom\'s Birthday", "My Wishlist"):');
  if (!name) return;
  
  const isPublic = confirm('Make this list public so others can view it?');
  
  try {
    const newList = await supabaseRequest('POST', '/rest/v1/lists?select=*', {
      user_id: currentUser.id,
      name: name,
      is_public: isPublic
    });
    
    currentLists.push(newList[0]);
    updateListsDropdown();
    showMessage('addMessage', `List "${name}" created!`, 'success');
    
    if (isPublic && newList[0].share_code) {
      alert(`Your public wishlist code is: ${newList[0].share_code}\nShare this with friends and family!`);
    }
  } catch (error) {
    showMessage('addMessage', 'Error creating list', 'error');
  }
}

// Add product to list
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
    const newProduct = await supabaseRequest('POST', '/rest/v1/products?select=*', {
      list_id: listId,
      name: name,
      url: url || null
    });
    
    currentProducts.push(newProduct[0]);
    showMessage('addMessage', 'Product added!', 'success');
    
    // Clear form
    document.getElementById('productName').value = '';
    document.getElementById('productUrl').value = '';
    await autoFillCurrentPage();
  } catch (error) {
    showMessage('addMessage', 'Error adding product', 'error');
  }
}

// Display user's lists
async function displayMyLists() {
  const container = document.getElementById('myListsContainer');
  container.innerHTML = '';
  
  if (currentLists.length === 0) {
    container.innerHTML = '<div class="form-section">No lists yet. Create one to get started!</div>';
    return;
  }
  
  for (const list of currentLists) {
    const products = currentProducts.filter(p => p.list_id === list.id);
    const claimedCount = products.filter(p => p.claimed_by).length;
    
    const listDiv = document.createElement('div');
    listDiv.className = 'list-item';
    
    listDiv.innerHTML = `
      <div class="list-header">
        <div class="list-name">${list.name}</div>
        <div class="list-badges">
          <span class="badge ${list.is_public ? 'public' : 'private'}">
            ${list.is_public ? '🌍 Public' : '🔒 Private'}
          </span>
          <span class="badge count">${products.length} items</span>
          ${claimedCount > 0 ? `<span class="badge count">${claimedCount} claimed</span>` : ''}
        </div>
      </div>
    `;
    
    if (list.is_public && list.share_code) {
      const shareDiv = document.createElement('div');
      shareDiv.className = 'share-link';
      shareDiv.innerHTML = `
        <input type="text" readonly value="${list.share_code}">
        <button class="btn-small" onclick="copyShareCode('${list.share_code}')">Copy</button>
      `;
      listDiv.appendChild(shareDiv);
    }
    
    products.forEach(product => {
      const productDiv = document.createElement('div');
      productDiv.className = `product-item ${product.claimed_by ? 'claimed' : ''}`;
      
      productDiv.innerHTML = `
        <div class="product-name">${product.name}</div>
        ${product.claimed_by ? '<div class="product-meta">✓ Claimed by someone</div>' : ''}
        ${product.url ? `<div class="product-url">${product.url}</div>` : ''}
        <div class="product-actions">
          ${product.url ? `<button class="btn-small" onclick="window.open('${product.url}', '_blank')">Visit</button>` : ''}
          <button class="btn-small danger" onclick="deleteProduct('${product.id}')">Delete</button>
        </div>
      `;
      
      listDiv.appendChild(productDiv);
    });
    
    const actionsDiv = document.createElement('div');
    actionsDiv.innerHTML = `
      <div style="display: flex; gap: 4px; margin-top: 8px;">
        <button class="btn-small secondary" onclick="toggleListVisibility('${list.id}', ${list.is_public})">
          ${list.is_public ? 'Make Private' : 'Make Public'}
        </button>
        <button class="btn-small danger" onclick="deleteList('${list.id}')">Delete List</button>
      </div>
    `;
    listDiv.appendChild(actionsDiv);
    
    container.appendChild(listDiv);
  }
}

// Load and display a wishlist by code
async function loadWishlist() {
  const code = document.getElementById('wishlistCode').value.trim();
  
  if (!code) {
    showMessage('wishlistMessage', 'Please enter a wishlist code', 'error');
    return;
  }
  
  try {
    // Find list by share code
    const lists = await supabaseRequest('GET', `/rest/v1/lists?share_code=eq.${code}&is_public=eq.true&select=*`);
    
    if (lists.length === 0) {
      showMessage('wishlistMessage', 'Wishlist not found or not public', 'error');
      return;
    }
    
    const list = lists[0];
    
    // Get products (excluding those claimed by others)
    const products = await supabaseRequest('GET', 
      `/rest/v1/products?list_id=eq.${list.id}&select=*`
    );
    
    displayWishlist(list, products);
    
  } catch (error) {
    showMessage('wishlistMessage', 'Error loading wishlist', 'error');
  }
}

// Display wishlist
function displayWishlist(list, products) {
  const container = document.getElementById('wishlistContainer');
  container.innerHTML = '';
  
  const wishlistDiv = document.createElement('div');
  wishlistDiv.className = 'list-item';
  
  const availableProducts = products.filter(p => !p.claimed_by || p.claimed_by === currentUser.id);
  const claimedByMe = products.filter(p => p.claimed_by === currentUser.id).length;
  
  wishlistDiv.innerHTML = `
    <div class="list-header">
      <div class="list-name">${list.name}</div>
      <div class="list-badges">
        <span class="badge count">${availableProducts.length} available</span>
        ${claimedByMe > 0 ? `<span class="badge count">${claimedByMe} claimed by you</span>` : ''}
      </div>
    </div>
  `;
  
  if (availableProducts.length === 0) {
    wishlistDiv.innerHTML += '<p style="margin-top: 8px; color: #6c757d; font-size: 13px;">All items have been claimed!</p>';
  }
  
  availableProducts.forEach(product => {
    const isMyClaim = product.claimed_by === currentUser.id;
    
    const productDiv = document.createElement('div');
    productDiv.className = `product-item ${isMyClaim ? 'claimed' : ''}`;
    
    productDiv.innerHTML = `
      <div class="product-name">${product.name}</div>
      ${isMyClaim ? '<div class="product-meta">✓ You claimed this</div>' : ''}
      ${product.url ? `<div class="product-url">${product.url}</div>` : ''}
      <div class="product-actions">
        ${product.url ? `<button class="btn-small" onclick="window.open('${product.url}', '_blank')">Visit</button>` : ''}
        ${isMyClaim 
          ? `<button class="btn-small danger" onclick="unclaimProduct('${product.id}')">Unclaim</button>`
          : `<button class="btn-small" onclick="claimProduct('${product.id}')">Claim (I'll buy this!)</button>`
        }
      </div>
    `;
    
    wishlistDiv.appendChild(productDiv);
  });
  
  container.appendChild(wishlistDiv);
}

// Claim a product
window.claimProduct = async function(productId) {
  if (!confirm('Claim this item? This will hide it from other people.')) return;
  
  try {
    await supabaseRequest('PATCH', `/rest/v1/products?id=eq.${productId}`, {
      claimed_by: currentUser.id,
      claimed_at: new Date().toISOString()
    });
    
    showMessage('wishlistMessage', 'Item claimed! The owner will see it as purchased.', 'success');
    
    // Reload wishlist
    const code = document.getElementById('wishlistCode').value.trim();
    if (code) {
      setTimeout(() => loadWishlist(), 1000);
    }
  } catch (error) {
    showMessage('wishlistMessage', 'Error claiming item', 'error');
  }
};

// Unclaim a product
window.unclaimProduct = async function(productId) {
  if (!confirm('Unclaim this item? It will be visible to others again.')) return;
  
  try {
    await supabaseRequest('PATCH', `/rest/v1/products?id=eq.${productId}`, {
      claimed_by: null,
      claimed_at: null
    });
    
    showMessage('wishlistMessage', 'Item unclaimed', 'success');
    
    // Reload wishlist
    const code = document.getElementById('wishlistCode').value.trim();
    if (code) {
      setTimeout(() => loadWishlist(), 1000);
    }
  } catch (error) {
    showMessage('wishlistMessage', 'Error unclaiming item', 'error');
  }
};

// Delete product
window.deleteProduct = async function(productId) {
  if (!confirm('Delete this product?')) return;
  
  try {
    await supabaseRequest('DELETE', `/rest/v1/products?id=eq.${productId}`, null);
    
    currentProducts = currentProducts.filter(p => p.id !== productId);
    displayMyLists();
  } catch (error) {
    alert('Error deleting product');
  }
};

// Delete list
window.deleteList = async function(listId) {
  if (!confirm('Delete this list and all its products?')) return;
  
  try {
    await supabaseRequest('DELETE', `/rest/v1/lists?id=eq.${listId}`, null);
    
    currentLists = currentLists.filter(l => l.id !== listId);
    currentProducts = currentProducts.filter(p => p.list_id !== listId);
    updateListsDropdown();
    displayMyLists();
  } catch (error) {
    alert('Error deleting list');
  }
};

// Toggle list visibility
window.toggleListVisibility = async function(listId, currentlyPublic) {
  try {
    const updated = await supabaseRequest('PATCH', `/rest/v1/lists?id=eq.${listId}&select=*`, {
      is_public: !currentlyPublic
    });
    
    const list = currentLists.find(l => l.id === listId);
    if (list) {
      list.is_public = updated[0].is_public;
      list.share_code = updated[0].share_code;
    }
    
    if (updated[0].is_public && updated[0].share_code) {
      alert(`List is now public! Share code: ${updated[0].share_code}`);
    }
    
    updateListsDropdown();
    displayMyLists();
  } catch (error) {
    alert('Error updating list');
  }
};

// Copy share code
window.copyShareCode = function(code) {
  navigator.clipboard.writeText(code);
  alert('Share code copied! Send this to friends and family.');
};

// Switch tabs
function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.tab-buttons button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Hide all views
  document.getElementById('addView').classList.add('hidden');
  document.getElementById('myListsView').classList.add('hidden');
  document.getElementById('viewWishlistView').classList.add('hidden');
  
  // Show selected view
  if (tab === 'add') {
    document.getElementById('addTab').classList.add('active');
    document.getElementById('addView').classList.remove('hidden');
    autoFillCurrentPage();
  } else if (tab === 'myLists') {
    document.getElementById('myListsTab').classList.add('active');
    document.getElementById('myListsView').classList.remove('hidden');
    displayMyLists();
  } else if (tab === 'viewWishlist') {
    document.getElementById('viewWishlistTab').classList.add('active');
    document.getElementById('viewWishlistView').classList.remove('hidden');
  }
}

// UI helpers
function showConfig() {
  hideAllSections();
  document.getElementById('configSection').classList.remove('hidden');
}

function showLogin() {
  hideAllSections();
  document.getElementById('loginSection').classList.remove('hidden');
}

function showSignup() {
  hideAllSections();
  document.getElementById('signupSection').classList.remove('hidden');
}

function showApp() {
  hideAllSections();
  document.getElementById('appSection').classList.remove('hidden');
  document.getElementById('userInfo').textContent = currentUser.email;
}

function hideAllSections() {
  document.getElementById('configSection').classList.add('hidden');
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('appSection').classList.add('hidden');
}

function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  el.className = `message ${type}`;
  el.textContent = text;
  setTimeout(() => el.textContent = '', 4000);
}