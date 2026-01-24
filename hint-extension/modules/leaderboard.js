// Leaderboard module - Points, badges, rankings
import * as state from './state.js';
import * as ui from './ui.js';

// Badge definitions
export const BADGES = {
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

// Open leaderboard modal
export async function openLeaderboardModal() {
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
  document.getElementById('closeLeaderboardBtn').addEventListener('click', ui.hideModal);

  // Friends/Global toggle
  document.getElementById('globalToggle').addEventListener('click', () => {
    state.setFriendsOnlyLeaderboard(false);
    document.getElementById('globalToggle').style.background = 'var(--green-primary)';
    document.getElementById('globalToggle').style.color = 'white';
    document.getElementById('friendsToggle').style.background = 'var(--bg-tertiary)';
    document.getElementById('friendsToggle').style.color = 'var(--text-secondary)';
    loadLeaderboardData(state.currentLeaderboardTimeframe);
  });

  document.getElementById('friendsToggle').addEventListener('click', () => {
    state.setFriendsOnlyLeaderboard(true);
    document.getElementById('friendsToggle').style.background = 'var(--green-primary)';
    document.getElementById('friendsToggle').style.color = 'white';
    document.getElementById('globalToggle').style.background = 'var(--bg-tertiary)';
    document.getElementById('globalToggle').style.color = 'var(--text-secondary)';
    loadLeaderboardData(state.currentLeaderboardTimeframe);
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
      state.setCurrentLeaderboardTimeframe(tab.dataset.timeframe);
      loadLeaderboardData(state.currentLeaderboardTimeframe);
    });
  });

  // Set active tab styling
  const activeTab = document.querySelector('.leaderboard-tab.active');
  if (activeTab) {
    activeTab.style.color = 'var(--green-primary)';
    activeTab.style.borderBottomColor = 'var(--green-primary)';
  }

  // Load initial data
  state.setFriendsOnlyLeaderboard(false);
  await loadLeaderboardData('all');
}

export async function loadLeaderboardData(timeframe = 'all') {
  try {
    const userEmail = state.currentUser?.email || state.currentUser?.user?.email;
    const userId = state.currentUser?.id || state.currentUser?.user?.id;

    // Get leaderboard data (with friends filter if enabled)
    const leaderboardResponse = await fetch(
      `${state.supabaseUrl}/rest/v1/rpc/get_leaderboard`,
      {
        method: 'POST',
        headers: {
          'apikey': state.supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_timeframe: timeframe,
          p_limit: 10,
          p_friends_only: state.friendsOnlyLeaderboard,
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
        `${state.supabaseUrl}/rest/v1/rpc/get_user_rank`,
        {
          method: 'POST',
          headers: {
            'apikey': state.supabaseKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_user_id: userId || null,
            p_email: userEmail || null,
            p_timeframe: timeframe,
            p_friends_only: state.friendsOnlyLeaderboard
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
        `${state.supabaseUrl}/rest/v1/rpc/get_user_stats`,
        {
          method: 'POST',
          headers: {
            'apikey': state.supabaseKey,
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
        ${state.friendsOnlyLeaderboard ? 'No friends data yet. Add some friends!' : 'No leaderboard data yet. Start claiming gifts to earn points!'}
      </div>
    `;
  }
}

export function updatePodium(leaderboard) {
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

      const initial = (user.name || user.email || '?')[0].toUpperCase();
      avatar.textContent = initial;
      avatar.style.background = getAvatarColor(user.name || user.email);
      avatar.style.color = 'white';
      avatar.style.fontWeight = 'bold';

      const displayName = user.name || user.email?.split('@')[0] || 'Anonymous';
      const truncName = displayName.length > 8 ? displayName.substring(0, 8) + '..' : displayName;

      const topBadge = user.badges && user.badges.length > 0 ? BADGES[user.badges[0]]?.emoji || '' : '';
      name.innerHTML = `${truncName} ${topBadge}`;
      name.title = displayName + (user.badges?.length > 0 ? ` - ${user.badges.length} badges` : '');

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

export function updateLeaderboardList(users) {
  const container = document.getElementById('leaderboardList');

  if (!users || users.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 13px;">
        ${state.friendsOnlyLeaderboard ? 'Add friends to see their rankings!' : 'No more rankings to show'}
      </div>
    `;
    return;
  }

  container.innerHTML = users.map((user, idx) => {
    const rank = idx + 4;
    const displayName = user.name || user.email?.split('@')[0] || 'Anonymous';
    const initial = (user.name || user.email || '?')[0].toUpperCase();
    const avatarColor = getAvatarColor(user.name || user.email);

    const badgesHtml = user.badges && user.badges.length > 0
      ? user.badges.slice(0, 3).map(b => BADGES[b]?.emoji || '').join('')
      : '';

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

export function getAvatarColor(str) {
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
export async function awardPoints(eventType, points, description = null, productId = null, listId = null) {
  try {
    const userEmail = state.currentUser?.email || state.currentUser?.user?.email;
    const userId = state.currentUser?.id || state.currentUser?.user?.id;
    const userName = state.currentUser?.user_metadata?.name || state.currentUser?.name || userEmail?.split('@')[0];

    await fetch(
      `${state.supabaseUrl}/rest/v1/rpc/award_points`,
      {
        method: 'POST',
        headers: {
          'apikey': state.supabaseKey,
          'Authorization': `Bearer ${state.supabaseKey}`,
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
export async function checkAndAwardBadges(userId, userEmail, eventType) {
  try {
    const response = await fetch(
      `${state.supabaseUrl}/rest/v1/rpc/check_and_award_badges`,
      {
        method: 'POST',
        headers: {
          'apikey': state.supabaseKey,
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

// Show a toast notification for new badge
export function showBadgeNotification(badge) {
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

// Show a price drop alert notification
export function showPriceDropAlert(product, currentPrice, targetPrice) {
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
