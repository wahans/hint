/**
 * Hint - Friends Service
 * Handles friend requests and friend list operations
 */

import type {
  Friend,
  FriendRequest,
  List,
  ApiResponse,
} from '../types/models';
import { getConfig } from '../config';
import { authService } from './auth.service';

// Interface for friends with their lists
export interface FriendWithLists {
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  lists: List[];
}

class FriendsService {
  private friendsBaseUrl = '/rest/v1/friends';
  private friendRequestsBaseUrl = '/rest/v1/friend_requests';

  /**
   * Make authenticated request to Supabase
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T | null> {
    const config = getConfig();
    const token = authService.getAccessToken();

    if (!config || !token) {
      throw new Error('Not authenticated');
    }

    const headers: Record<string, string> = {
      'apikey': config.supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (method === 'POST') {
      headers['Prefer'] = 'return=representation';
    }

    const options: RequestInit = { method, headers };

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${config.supabaseUrl}${endpoint}`, options);

    // Handle 401 - token expired
    if (response.status === 401) {
      const refreshed = await authService.refreshSession();
      if (refreshed) {
        return this.request(method, endpoint, body);
      }
      throw new Error('Session expired');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * Get all accepted friends for current user
   */
  async getFriends(): Promise<ApiResponse<Friend[]>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      // Get friends where user is either user_id or friend_id and status is accepted
      const friends = await this.request<Friend[]>(
        'GET',
        `${this.friendsBaseUrl}?or=(user_id.eq.${user.id},friend_id.eq.${user.id})&status=eq.accepted&select=*`
      );

      return { data: friends || [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load friends',
        },
      };
    }
  }

  /**
   * Get friends with their public lists
   */
  async getFriendsWithLists(): Promise<ApiResponse<FriendWithLists[]>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      // First get accepted friends
      const friendsResult = await this.getFriends();
      if (friendsResult.error || !friendsResult.data) {
        return { error: friendsResult.error || { code: 'FETCH_ERROR', message: 'Failed to load friends' } };
      }

      const friends = friendsResult.data;
      if (friends.length === 0) {
        return { data: [] };
      }

      // Get the friend user IDs (the one that isn't the current user)
      const friendUserIds = friends.map(f =>
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      // Get public lists for all friends
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      // Query lists where user_id is in friendUserIds and is_public is true
      const listsResponse = await fetch(
        `${config.supabaseUrl}/rest/v1/lists?user_id=in.(${friendUserIds.join(',')})&is_public=eq.true&select=*`,
        {
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const lists: List[] = await listsResponse.json();

      // Get user info for friends
      const usersResponse = await fetch(
        `${config.supabaseUrl}/rest/v1/users?id=in.(${friendUserIds.join(',')})&select=id,name,email`,
        {
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const users: { id: string; name: string; email: string }[] = await usersResponse.json();

      // Group lists by friend
      const friendsWithLists: FriendWithLists[] = friendUserIds.map(friendId => {
        const friendUser = users.find(u => u.id === friendId);
        const friendLists = lists.filter(l => l.user_id === friendId);

        return {
          friendId,
          friendName: friendUser?.name || friendUser?.email?.split('@')[0] || 'Friend',
          friendAvatar: undefined,
          lists: friendLists,
        };
      }).filter(f => f.lists.length > 0); // Only include friends with public lists

      return { data: friendsWithLists };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load friends lists',
        },
      };
    }
  }

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(): Promise<ApiResponse<FriendRequest[]>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      const requests = await this.request<FriendRequest[]>(
        'GET',
        `${this.friendRequestsBaseUrl}?to_user_id=eq.${user.id}&status=eq.pending&select=*`
      );

      return { data: requests || [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load friend requests',
        },
      };
    }
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(toUserEmail: string): Promise<ApiResponse<FriendRequest>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      // First find the user by email
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      const usersResponse = await fetch(
        `${config.supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(toUserEmail)}&select=id,name,email`,
        {
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const users = await usersResponse.json();

      if (!users || users.length === 0) {
        return { error: { code: 'NOT_FOUND', message: 'User not found' } };
      }

      const toUser = users[0];

      if (toUser.id === user.id) {
        return { error: { code: 'INVALID_REQUEST', message: 'Cannot send friend request to yourself' } };
      }

      // Create friend request
      const result = await this.request<FriendRequest[]>(
        'POST',
        this.friendRequestsBaseUrl,
        {
          from_user_id: user.id,
          from_user_name: user.name || user.user_metadata?.name || user.email?.split('@')[0],
          from_user_email: user.email,
          to_user_id: toUser.id,
          status: 'pending',
        }
      );

      if (!result || result.length === 0) {
        return { error: { code: 'CREATE_ERROR', message: 'Failed to send friend request' } };
      }

      return { data: result[0] };
    } catch (error) {
      return {
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send friend request',
        },
      };
    }
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: string): Promise<ApiResponse<void>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      // Get the friend request
      const requestResponse = await fetch(
        `${config.supabaseUrl}${this.friendRequestsBaseUrl}?id=eq.${requestId}&select=*`,
        {
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const requests = await requestResponse.json();
      if (!requests || requests.length === 0) {
        return { error: { code: 'NOT_FOUND', message: 'Friend request not found' } };
      }

      const request = requests[0];

      // Update request status to accepted
      await fetch(
        `${config.supabaseUrl}${this.friendRequestsBaseUrl}?id=eq.${requestId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'accepted' }),
        }
      );

      // Create friend relationship
      await fetch(
        `${config.supabaseUrl}${this.friendsBaseUrl}`,
        {
          method: 'POST',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: request.from_user_id,
            friend_id: request.to_user_id,
            status: 'accepted',
            name: request.from_user_name,
            email: request.from_user_email,
          }),
        }
      );

      return { data: undefined };
    } catch (error) {
      return {
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to accept friend request',
        },
      };
    }
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(requestId: string): Promise<ApiResponse<void>> {
    try {
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      await fetch(
        `${config.supabaseUrl}${this.friendRequestsBaseUrl}?id=eq.${requestId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'rejected' }),
        }
      );

      return { data: undefined };
    } catch (error) {
      return {
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reject friend request',
        },
      };
    }
  }

  /**
   * Remove a friend
   */
  async removeFriend(friendId: string): Promise<ApiResponse<void>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      // Delete friend record (both directions)
      await fetch(
        `${config.supabaseUrl}${this.friendsBaseUrl}?or=(and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id}))`,
        {
          method: 'DELETE',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return { data: undefined };
    } catch (error) {
      return {
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to remove friend',
        },
      };
    }
  }
}

// Export singleton instance
export const friendsService = new FriendsService();
