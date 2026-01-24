// Shared mutable state - exported so all modules can access

export let supabaseUrl = '';
export let supabaseKey = '';
export let currentUser = null;
export let currentLists = [];
export let currentProducts = [];
export let viewingListId = null;
export let expandedLists = new Set();

// Leaderboard state
export let currentLeaderboardTimeframe = 'all';
export let friendsOnlyLeaderboard = false;

// Friends state
export let allFriends = null;
export let currentFriends = null;

export function setSupabaseUrl(value) {
  supabaseUrl = value;
}

export function setSupabaseKey(value) {
  supabaseKey = value;
}

export function setCurrentUser(value) {
  currentUser = value;
}

export function setCurrentLists(value) {
  currentLists = value;
}

export function setCurrentProducts(value) {
  currentProducts = value;
}

export function setViewingListId(value) {
  viewingListId = value;
}

export function setExpandedLists(value) {
  expandedLists = value;
}

export function setCurrentLeaderboardTimeframe(value) {
  currentLeaderboardTimeframe = value;
}

export function setFriendsOnlyLeaderboard(value) {
  friendsOnlyLeaderboard = value;
}

export function setAllFriends(value) {
  allFriends = value;
}

export function setCurrentFriends(value) {
  currentFriends = value;
}
