/**
 * Hint - Notification Service
 * Handles in-app notification operations via Supabase
 */

import type { ApiResponse } from '../types/models';
import { getConfig } from '../config';
import { authService } from './auth.service';

export type NotificationType =
  | 'item_claimed'
  | 'price_drop'
  | 'back_in_stock'
  | 'friend_request'
  | 'due_date_reminder'
  | 'friend_activity';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  data?: {
    list_id?: string;
    product_id?: string;
    friend_id?: string;
    friend_name?: string;
    price?: number;
    days_until_due?: number;
  };
}

class NotificationService {
  /**
   * Make RPC call to Supabase
   */
  private async rpc<T>(functionName: string, params: Record<string, any> = {}): Promise<T | null> {
    const config = getConfig();
    const token = authService.getAccessToken();

    if (!config) {
      throw new Error('Not configured');
    }

    const headers: Record<string, string> = {
      'apikey': config.supabaseAnonKey,
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/rpc/${functionName}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      }
    );

    if (response.status === 401) {
      const refreshed = await authService.refreshSession();
      if (refreshed) {
        return this.rpc(functionName, params);
      }
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`RPC call failed: ${response.status} - ${error}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * Get user notifications with pagination
   */
  async getNotifications(limit = 50, offset = 0): Promise<ApiResponse<AppNotification[]>> {
    try {
      const notifications = await this.rpc<AppNotification[]>('get_user_notifications', {
        p_limit: limit,
        p_offset: offset,
      });

      return { data: notifications || [] };
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load notifications',
        },
      };
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      await this.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });

      return { data: undefined };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return {
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to mark as read',
        },
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    try {
      await this.rpc('mark_all_notifications_read', {});

      return { data: undefined };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return {
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to mark all as read',
        },
      };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<number>> {
    try {
      const count = await this.rpc<number>('get_unread_notification_count', {});

      return { data: count || 0 };
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get unread count',
        },
      };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    try {
      await this.rpc('delete_notification', {
        p_notification_id: notificationId,
      });

      return { data: undefined };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return {
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete notification',
        },
      };
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<ApiResponse<void>> {
    try {
      await this.rpc('clear_all_notifications', {});

      return { data: undefined };
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      return {
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to clear notifications',
        },
      };
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
