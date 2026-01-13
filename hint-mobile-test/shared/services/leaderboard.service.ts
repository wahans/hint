/**
 * Hint - Leaderboard Service
 * Handles leaderboard and gamification operations
 */

import type {
  LeaderboardEntry,
  LeaderboardTimeframe,
  UserStats,
  ApiResponse,
} from '../types/models';
import { getConfig } from '../config';
import { authService } from './auth.service';

class LeaderboardService {
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

    if (!config) {
      throw new Error('Config not initialized');
    }

    const headers: Record<string, string> = {
      'apikey': config.supabaseAnonKey,
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = { method, headers };

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${config.supabaseUrl}${endpoint}`, options);

    // Handle 401 - token expired
    if (response.status === 401 && token) {
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
   * Get leaderboard entries
   */
  async getLeaderboard(
    timeframe: LeaderboardTimeframe = 'all',
    limit: number = 20,
    friendsOnly: boolean = false
  ): Promise<ApiResponse<LeaderboardEntry[]>> {
    try {
      const user = authService.getCurrentUser();

      const result = await this.request<LeaderboardEntry[]>(
        'POST',
        '/rest/v1/rpc/get_leaderboard',
        {
          p_timeframe: timeframe,
          p_limit: limit,
          p_friends_only: friendsOnly,
          p_user_id: user?.id || null,
        }
      );

      return { data: result || [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load leaderboard',
        },
      };
    }
  }

  /**
   * Get current user's rank
   */
  async getUserRank(
    timeframe: LeaderboardTimeframe = 'all',
    friendsOnly: boolean = false
  ): Promise<ApiResponse<{ rank: number; points: number; streak_days: number; badges: string[] }>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      const result = await this.request<any[]>(
        'POST',
        '/rest/v1/rpc/get_user_rank',
        {
          p_user_id: user.id,
          p_email: user.email,
          p_timeframe: timeframe,
          p_friends_only: friendsOnly,
        }
      );

      if (!result || result.length === 0) {
        return { data: { rank: 0, points: 0, streak_days: 0, badges: [] } };
      }

      return { data: result[0] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load rank',
        },
      };
    }
  }

  /**
   * Get current user's stats
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      const result = await this.request<UserStats[]>(
        'POST',
        '/rest/v1/rpc/get_user_stats',
        {
          p_user_id: user.id,
          p_email: user.email,
        }
      );

      if (!result || result.length === 0) {
        // Return default stats if none exist
        return {
          data: {
            user_id: user.id,
            email: user.email,
            total_points: 0,
            gifts_claimed: 0,
            gifts_given: 0,
            lists_created: 0,
            items_added: 0,
            streak_days: 0,
            badges: [],
          },
        };
      }

      return { data: result[0] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load stats',
        },
      };
    }
  }

  /**
   * Award points to user (called after actions like claiming)
   */
  async awardPoints(
    eventType: string,
    points: number,
    description?: string,
    productId?: string,
    listId?: string
  ): Promise<ApiResponse<{ success: boolean; points_awarded: number }>> {
    const user = authService.getCurrentUser();

    try {
      const result = await this.request<{ success: boolean; points_awarded: number }>(
        'POST',
        '/rest/v1/rpc/award_points',
        {
          p_user_id: user?.id || null,
          p_email: user?.email || null,
          p_name: user?.name || user?.user_metadata?.name || null,
          p_event_type: eventType,
          p_points: points,
          p_description: description || null,
          p_product_id: productId || null,
          p_list_id: listId || null,
        }
      );

      return { data: result || { success: false, points_awarded: 0 } };
    } catch (error) {
      return {
        error: {
          code: 'AWARD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to award points',
        },
      };
    }
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();
