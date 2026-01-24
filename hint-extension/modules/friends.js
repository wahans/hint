// Friends module - Friend system, browse modal
import * as state from './state.js';
import * as api from './api.js';
import * as ui from './ui.js';
import { switchTab } from './navigation.js';

// Open friends modal
export function openFriendsModal() {
  document.getElementById('friendsModal').classList.add('show');
  loadFriends();
}

// Close friends modal
export function closeFriendsModal() {
  document.getElementById('friendsModal').classList.remove('show');
}

// Switch between friends tabs
export function switchFriendsTab(tab) {
  document.getElementById('myFriendsTab').classList.remove('active');
  document.getElementById('requestsTab').classList.remove('active');
  document.getElementById('addFriendTab').classList.remove('active');

  document.getElementById('myFriendsView').classList.add('hidden');
  document.getElementById('requestsView').classList.add('hidden');
  document.getElementById('addFriendView').classList.add('hidden');

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

// Load friends list
export async function loadFriends() {
  const container = document.getElementById('friendsList');
  container.innerHTML = '<div class="loading">Loading friends...</div>';

  try {
    const friends = await api.supabaseRPC('get_friends', {});

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

// Load pending friend requests
export async function loadPendingRequests() {
  const container = document.getElementById('requestsList');
  container.innerHTML = '<div class="loading">Loading requests...</div>';

  try {
    const requests = await api.supabaseRPC('get_pending_requests', {});

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

// Send friend request
export async function sendFriendRequest() {
  const email = document.getElementById('friendEmail').value.trim();

  if (!email) {
    ui.showMessage('addFriendMessage', 'Please enter an email address', 'error');
    return;
  }

  if (email === state.currentUser.email) {
    ui.showMessage('addFriendMessage', 'You cannot add yourself as a friend', 'error');
    return;
  }

  try {
    const result = await api.supabaseRPC('send_friend_request', { friend_email: email });

    if (result.success) {
      ui.showMessage('addFriendMessage', 'Friend request sent!', 'success');
      document.getElementById('friendEmail').value = '';
    } else {
      ui.showMessage('addFriendMessage', result.error || 'Failed to send request', 'error');
    }
  } catch (error) {
    ui.showMessage('addFriendMessage', 'Error sending request', 'error');
  }
}

// Accept friend request
export async function acceptFriendRequest(requestId) {
  try {
    const result = await api.supabaseRPC('accept_friend_request', { request_id: requestId });

    if (result.success) {
      ui.showMessage('addFriendMessage', 'Friend request accepted!', 'success');
      loadPendingRequests();
      switchFriendsTab('friends');
    } else {
      ui.showMessage('addFriendMessage', result.error || 'Failed to accept request', 'error');
    }
  } catch (error) {
    ui.showMessage('addFriendMessage', 'Error accepting request', 'error');
  }
}

// Reject friend request
export async function rejectFriendRequest(requestId) {
  if (!confirm('Reject this friend request?')) return;

  try {
    const result = await api.supabaseRPC('reject_friend_request', { request_id: requestId });

    if (result.success) {
      ui.showMessage('addFriendMessage', 'Request rejected', 'success');
      loadPendingRequests();
    } else {
      ui.showMessage('addFriendMessage', result.error || 'Failed to reject request', 'error');
    }
  } catch (error) {
    ui.showMessage('addFriendMessage', 'Error rejecting request', 'error');
  }
}

// View friend's lists
export async function viewFriendLists(friendId, friendName) {
  ui.hideModal();
  const friendsModal = document.getElementById('friendsModal');
  if (friendsModal) {
    friendsModal.classList.remove('show');
  }

  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <div class="modal-header">👥 ${friendName}'s Hintlists</div>
    <div id="friendListsContainer" class="modal-body" style="max-height: 350px; overflow-y: auto;">
      <div class="loading">Loading hintlists...</div>
    </div>
    <button id="closeFriendListsBtn" class="secondary">Close</button>
  `;

  document.getElementById('modalOverlay').classList.add('show');
  document.getElementById('closeFriendListsBtn').addEventListener('click', ui.hideModal);

  try {
    const result = await api.supabaseRPC('get_friends_public_lists', {});
    const allLists = Array.isArray(result) ? result : (result ? [result] : []);

    const friendEmail = await getUserEmailById(friendId);

    const friendLists = allLists.filter(list => list.friend_email === friendEmail);

    const container = document.getElementById('friendListsContainer');

    if (friendLists.length === 0) {
      // Try getting them directly
      const directLists = await api.supabaseRequest('GET', `/rest/v1/lists?user_id=eq.${friendId}&is_public=eq.true&select=*`);

      if (directLists && directLists.length > 0) {
        const listsWithAccess = await Promise.all(directLists.map(async (list) => {
          try {
            const access = await api.supabaseRequest('GET', `/rest/v1/hintlist_access?list_id=eq.${list.id}&user_id=eq.${state.currentUser.id}&select=*`);
            return {
              list_id: list.id,
              list_name: list.name,
              item_count: 0,
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

// Display friend lists in modal
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
      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn-small';
      viewBtn.textContent = 'View Items';
      viewBtn.addEventListener('click', () => {
        ui.hideModal();
        viewSharedList(list.list_id, list.list_name);
      });
      actionsDiv.appendChild(viewBtn);
    } else {
      const requestBtn = document.createElement('button');
      requestBtn.className = 'btn-small';
      requestBtn.textContent = 'Request Access';
      requestBtn.addEventListener('click', async () => {
        if (confirm(`Request access to "${list.list_name}"?`)) {
          const code = prompt(`Enter the access code for "${list.list_name}":`);
          if (code) {
            try {
              const result = await api.supabaseRPC('join_hintlist_by_code', { code: code.trim() });

              if (result && result.success) {
                ui.showMessage('addMessage', 'Access granted!', 'success');
                ui.hideModal();
                viewSharedList(list.list_id, list.list_name);
              } else {
                alert(result?.error || 'Invalid access code');
              }
            } catch (error) {
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

// Get user email by ID
async function getUserEmailById(userId) {
  try {
    const users = await api.supabaseRequest('GET', `/rest/v1/users?id=eq.${userId}&select=email`);
    return users[0]?.email || '';
  } catch (error) {
    return '';
  }
}

// View shared list
export async function viewSharedList(listId, listName) {
  const { displayHintlist } = await import('./claims.js');

  switchTab('viewHintlist');

  const container = document.getElementById('hintlistContainer');
  container.innerHTML = '<div class="loading">Loading hintlist...</div>';

  try {
    const lists = await api.supabaseRequest('GET', `/rest/v1/lists?id=eq.${listId}&select=*`);

    if (lists.length === 0) {
      container.innerHTML = '<div class="empty-state">Hintlist not found</div>';
      return;
    }

    const products = await api.supabaseRequest('GET', `/rest/v1/products?list_id=eq.${listId}&select=*`);
    displayHintlist(lists[0], products);

    ui.showMessage('hintlistMessage', `Viewing "${listName}"`, 'info');
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error loading hintlist</div>';
  }
}

// Load browse friends modal
export async function loadBrowseFriendsModal() {
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
  document.getElementById('closeBrowseFriendsBtn').addEventListener('click', ui.hideModal);

  try {
    const friends = await api.supabaseRPC('get_friends', {});
    state.setCurrentFriends(friends);

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

    // Setup search
    setupFriendSearch(friends);

  } catch (error) {
    document.getElementById('allFriendsModalContainer').innerHTML = '<div class="empty-state">Error loading friends</div>';
  }
}

// Display all friends in modal
function displayAllFriendsInModal(friends) {
  const container = document.getElementById('allFriendsModalContainer');
  container.innerHTML = '';

  friends.forEach(friend => {
    const friendDiv = createFriendCard(friend);
    friendDiv.dataset.friendName = friend.friend_name.toLowerCase();
    container.appendChild(friendDiv);
  });
}

// Setup friend search
function setupFriendSearch(friends) {
  const searchInput = document.getElementById('friendSearchModal');
  const dropdown = document.getElementById('searchDropdown');
  const allFriendsContainer = document.getElementById('allFriendsModalContainer');
  const recentSection = document.getElementById('recentFriendsModalSection');

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();

    if (!term) {
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
          ui.hideModal();
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

    // Real-time filter
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
          const visibleInRecent = Array.from(recentContainer.querySelectorAll('.friend-item')).some(c => c.style.display !== 'none');
          recentSection.style.display = visibleInRecent ? 'block' : 'none';
        }
      });
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

// Create friend card element
export function createFriendCard(friend, isRecent = false) {
  const friendDiv = document.createElement('div');
  friendDiv.className = 'friend-item';
  friendDiv.style.marginBottom = '8px';
  friendDiv.dataset.friendName = friend.friend_name.toLowerCase();
  friendDiv.dataset.friendEmail = (friend.friend_email || '').toLowerCase();

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
    if (!isRecent) ui.hideModal();
    viewFriendLists(friend.friend_id, friend.friend_name);
  });
  actionsDiv.appendChild(viewListsBtn);

  friendDiv.querySelector('.friend-info').appendChild(actionsDiv);

  return friendDiv;
}

// Display friends list
export function displayFriendsList(friends, container) {
  container.innerHTML = '';

  friends.forEach(friend => {
    const friendDiv = createFriendCard(friend);
    friendDiv.dataset.friendName = friend.friend_name.toLowerCase();
    friendDiv.dataset.friendEmail = friend.friend_email.toLowerCase();
    container.appendChild(friendDiv);
  });
}

// Filter friends by search term
export function filterFriends(searchTerm) {
  const container = document.getElementById('browseFriendsContainer');
  const friendCards = container.querySelectorAll('.friend-item');
  const term = searchTerm.toLowerCase().trim();

  if (!term) {
    friendCards.forEach(card => card.style.display = 'block');
    return;
  }

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

// Add friend to recent list
export async function addToRecentFriends(friendId) {
  const { recentFriends = [] } = await chrome.storage.local.get('recentFriends');

  const filtered = recentFriends.filter(id => id !== friendId);
  const updated = [friendId, ...filtered].slice(0, 5);

  await chrome.storage.local.set({ recentFriends: updated });
}

// Clear recent friends
export async function clearRecentFriends() {
  if (confirm('Clear recently viewed friends?')) {
    try {
      await chrome.storage.local.set({ recentFriends: [] });
      ui.showMessage('settingsMessage', 'Recently viewed friends cleared', 'success');
    } catch (error) {
      ui.showMessage('settingsMessage', 'Error clearing recent friends', 'error');
    }
  }
}

// Load browse friends section
export async function loadBrowseFriends() {
  const container = document.getElementById('browseFriendsContainer');
  container.innerHTML = '<div class="loading">Loading friends...</div>';

  try {
    const friends = await api.supabaseRPC('get_friends', {});

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

    state.setAllFriends(friends);
    await loadRecentFriends();
    displayFriendsList(friends, container);
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error loading friends</div>';
  }
}

// Load recent friends
async function loadRecentFriends() {
  const { recentFriends = [] } = await chrome.storage.local.get('recentFriends');

  if (recentFriends.length === 0) {
    document.getElementById('recentFriendsSection')?.classList.add('hidden');
    return;
  }

  document.getElementById('recentFriendsSection')?.classList.remove('hidden');
  const container = document.getElementById('recentFriendsContainer');
  if (!container) return;

  container.innerHTML = '';

  const allFriends = state.allFriends || [];
  const recentFriendData = recentFriends
    .map(id => allFriends.find(f => f.friend_id === id))
    .filter(f => f !== undefined)
    .slice(0, 3);

  recentFriendData.forEach(friend => {
    const friendDiv = createFriendCard(friend, true);
    container.appendChild(friendDiv);
  });
}
