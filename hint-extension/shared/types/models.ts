/**
 * Hint - Shared Data Models
 * These interfaces define the data structures used across all platforms
 * (Chrome extension, mobile app, web viewer)
 */

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupData extends AuthCredentials {
  name: string;
}

// ============================================
// LISTS
// ============================================

export type NotificationLevel = 'none' | 'who_only' | 'what_only' | 'both';

export interface List {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  access_code?: string;
  share_code?: string;
  key_date?: string;
  notification_level: NotificationLevel;
  created_at: string;
  updated_at?: string;
}

export interface CreateListData {
  name: string;
  is_public?: boolean;
  key_date?: string;
}

export interface UpdateListData {
  name?: string;
  is_public?: boolean;
  key_date?: string;
  notification_level?: NotificationLevel;
}

// ============================================
// PRODUCTS
// ============================================

export interface Product {
  id: string;
  list_id: string;
  name: string;
  url?: string;
  image_url?: string;
  current_price?: number;
  target_price?: number;
  in_stock: boolean;
  claimed_by?: string;
  guest_claimer_name?: string;
  guest_claimer_email?: string;
  claimed_at?: string;
  unclaim_token?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateProductData {
  list_id: string;
  name: string;
  url?: string;
  image_url?: string;
  current_price?: number;
  target_price?: number;
}

export interface UpdateProductData {
  name?: string;
  url?: string;
  image_url?: string;
  current_price?: number;
  target_price?: number;
  in_stock?: boolean;
}

export interface PriceData {
  price: number | null;
  inStock: boolean;
}

// ============================================
// CLAIMS
// ============================================

export interface Claim {
  id: string;
  product_id: string;
  product_name: string;
  product_url?: string;
  image_url?: string;
  current_price?: number;
  list_id: string;
  list_name: string;
  list_owner_id: string;
  list_owner_name: string;
  claimed_at: string;
  claimer_name?: string;
  claimer_email?: string;
}

export interface ClaimProductData {
  product_id: string;
  claimer_name: string;
  claimer_email?: string;
  is_guest: boolean;
}

// ============================================
// FRIENDS & SOCIAL
// ============================================

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendRequestStatus;
  name: string;
  email: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  from_user_name: string;
  from_user_email: string;
  to_user_id: string;
  status: FriendRequestStatus;
  created_at: string;
}

// ============================================
// LEADERBOARD & GAMIFICATION
// ============================================

export interface UserStats {
  user_id?: string;
  email?: string;
  name?: string;
  total_points: number;
  gifts_claimed: number;
  gifts_given: number;
  lists_created: number;
  items_added: number;
  streak_days: number;
  badges: string[];
  last_active_date?: string;
}

export interface LeaderboardEntry {
  user_id?: string;
  email: string;
  name: string;
  points: number;
  rank: number;
  streak_days: number;
  badges: string[];
}

export type LeaderboardTimeframe = 'all' | 'month' | 'week' | 'today';

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

// Badge definitions
export const BADGES: Record<string, Badge> = {
  first_gift: { id: 'first_gift', emoji: '🎁', name: 'First Gift', description: 'Claimed your first item' },
  generous_5: { id: 'generous_5', emoji: '💚', name: 'Generous', description: 'Claimed 5+ items' },
  generous_10: { id: 'generous_10', emoji: '💚', name: 'Super Generous', description: 'Claimed 10+ items' },
  gift_master: { id: 'gift_master', emoji: '👑', name: 'Gift Master', description: 'Claimed 50+ items' },
  list_creator: { id: 'list_creator', emoji: '📝', name: 'List Maker', description: 'Created 3+ lists' },
  streak_7: { id: 'streak_7', emoji: '🔥', name: 'On Fire', description: '7-day streak' },
  streak_30: { id: 'streak_30', emoji: '⚡', name: 'Unstoppable', description: '30-day streak' },
  early_bird: { id: 'early_bird', emoji: '🐦', name: 'Early Bird', description: 'Claimed within 24h of item added' },
  secret_santa: { id: 'secret_santa', emoji: '🎅', name: 'Secret Santa', description: 'Claimed for 5+ different people' },
};

// ============================================
// PRICE HISTORY
// ============================================

export interface PriceHistoryEntry {
  id: string;
  product_id: string;
  price: number;
  in_stock: boolean;
  checked_at: string;
}

// ============================================
// POINTS & EVENTS
// ============================================

export type PointEventType = 'claim' | 'create_list' | 'add_item' | 'invite_friend' | 'other';

export interface PointEvent {
  id: string;
  user_id?: string;
  email?: string;
  name?: string;
  event_type: PointEventType;
  points: number;
  description?: string;
  product_id?: string;
  list_id?: string;
  created_at: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: string;
}

export interface RpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// CONFIGURATION
// ============================================

export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  friendRequestPrivacy: 'everyone' | 'friends_of_friends' | 'nobody';
  profileVisibility: boolean;
  leaderboardVisibility: boolean;
}
