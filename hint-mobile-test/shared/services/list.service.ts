/**
 * Hint - List Service
 * Handles all list-related operations
 */

import type {
  List,
  CreateListData,
  UpdateListData,
  ApiResponse,
} from '../types/models';
import { getConfig } from '../config';
import { authService } from './auth.service';

class ListService {
  private baseUrl = '/rest/v1/lists';

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

    // For POST requests, add Prefer header to return the created record
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
   * Get all lists for current user
   */
  async getMyLists(): Promise<ApiResponse<List[]>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      const lists = await this.request<List[]>(
        'GET',
        `${this.baseUrl}?user_id=eq.${user.id}&select=*&order=created_at.desc`
      );

      return { data: lists || [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load lists',
        },
      };
    }
  }

  /**
   * Get a single list by ID
   */
  async getList(listId: string): Promise<ApiResponse<List>> {
    try {
      const lists = await this.request<List[]>(
        'GET',
        `${this.baseUrl}?id=eq.${listId}&select=*`
      );

      if (!lists || lists.length === 0) {
        return { error: { code: 'NOT_FOUND', message: 'List not found' } };
      }

      return { data: lists[0] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load list',
        },
      };
    }
  }

  /**
   * Get a list by share code (for public viewing)
   */
  async getListByShareCode(shareCode: string): Promise<ApiResponse<List>> {
    try {
      const lists = await this.request<List[]>(
        'GET',
        `${this.baseUrl}?share_code=eq.${shareCode}&select=*`
      );

      if (!lists || lists.length === 0) {
        return { error: { code: 'NOT_FOUND', message: 'List not found' } };
      }

      return { data: lists[0] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load list',
        },
      };
    }
  }

  /**
   * Create a new list
   */
  async createList(data: CreateListData): Promise<ApiResponse<List>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      const result = await this.request<List[]>('POST', this.baseUrl, {
        name: data.name,
        user_id: user.id,
        is_public: data.is_public ?? false,
        key_date: data.key_date || null,
      });

      if (!result || result.length === 0) {
        return { error: { code: 'CREATE_ERROR', message: 'Failed to create list' } };
      }

      return { data: result[0] };
    } catch (error) {
      return {
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create list',
        },
      };
    }
  }

  /**
   * Update an existing list
   */
  async updateList(listId: string, data: UpdateListData): Promise<ApiResponse<List>> {
    try {
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      const response = await fetch(
        `${config.supabaseUrl}${this.baseUrl}?id=eq.${listId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            ...data,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (response.status === 401) {
        const refreshed = await authService.refreshSession();
        if (refreshed) {
          return this.updateList(listId, data);
        }
        return { error: { code: 'SESSION_EXPIRED', message: 'Session expired' } };
      }

      const result = await response.json();

      if (!result || result.length === 0) {
        return { error: { code: 'UPDATE_ERROR', message: 'Failed to update list' } };
      }

      return { data: result[0] };
    } catch (error) {
      return {
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update list',
        },
      };
    }
  }

  /**
   * Delete a list
   */
  async deleteList(listId: string): Promise<ApiResponse<void>> {
    try {
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      // First delete all products in the list
      await fetch(`${config.supabaseUrl}/rest/v1/products?list_id=eq.${listId}`, {
        method: 'DELETE',
        headers: {
          'apikey': config.supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
      });

      // Then delete the list
      const response = await fetch(
        `${config.supabaseUrl}${this.baseUrl}?id=eq.${listId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        const refreshed = await authService.refreshSession();
        if (refreshed) {
          return this.deleteList(listId);
        }
        return { error: { code: 'SESSION_EXPIRED', message: 'Session expired' } };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete list',
        },
      };
    }
  }

  /**
   * Toggle list public/private status
   */
  async togglePublic(listId: string, isPublic: boolean): Promise<ApiResponse<List>> {
    return this.updateList(listId, { is_public: isPublic });
  }

  /**
   * Generate a new share code for a list
   */
  async generateShareCode(listId: string): Promise<ApiResponse<string>> {
    // Generate a short random code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await this.updateList(listId, { is_public: true } as any);

    if (result.error) {
      return { error: result.error };
    }

    // Update with share_code directly
    const config = getConfig();
    const token = authService.getAccessToken();

    if (!config || !token) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      await fetch(`${config.supabaseUrl}${this.baseUrl}?id=eq.${listId}`, {
        method: 'PATCH',
        headers: {
          'apikey': config.supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ share_code: code }),
      });

      return { data: code };
    } catch (error) {
      return {
        error: {
          code: 'SHARE_ERROR',
          message: 'Failed to generate share code',
        },
      };
    }
  }
}

// Export singleton instance
export const listService = new ListService();
