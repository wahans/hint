/**
 * Hint - Authentication Service
 * Handles all Supabase authentication operations
 */

import type { User, Session, AuthCredentials, SignupData, ApiResponse, ApiError } from '../types/models';
import { getConfig } from '../config';
import { storage } from './storage';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
}

export type AuthEventType = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'SESSION_EXPIRED';

export interface AuthEventListener {
  (event: AuthEventType, session: Session | null): void;
}

class AuthService {
  private listeners: AuthEventListener[] = [];
  private currentUser: User | null = null;
  private currentSession: Session | null = null;

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(listener: AuthEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: AuthEventType, session: Session | null): void {
    this.listeners.forEach(listener => listener(event, session));
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return {
      user: this.currentUser,
      session: this.currentSession,
      isAuthenticated: this.currentUser !== null,
    };
  }

  /**
   * Initialize auth from stored session
   */
  async initialize(): Promise<AuthState> {
    const session = await storage.getSession();

    if (session?.access_token && session?.user) {
      this.currentSession = session;
      this.currentUser = session.user;
      return this.getAuthState();
    }

    return { user: null, session: null, isAuthenticated: false };
  }

  /**
   * Login with email and password
   */
  async login(credentials: AuthCredentials): Promise<ApiResponse<Session>> {
    const config = getConfig();
    if (!config) {
      return { error: { code: 'NO_CONFIG', message: 'Supabase not configured' } };
    }

    try {
      const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (data.error) {
        return {
          error: {
            code: data.error.code || 'AUTH_ERROR',
            message: data.error.message || 'Login failed',
            status: response.status,
          },
        };
      }

      // Save session
      const session: Session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        token_type: data.token_type,
        user: data.user,
      };

      await storage.setSession(session);
      this.currentSession = session;
      this.currentUser = data.user;

      // Ensure user record exists in users table
      await this.ensureUserRecord();

      this.emit('SIGNED_IN', session);

      return { data: session };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Connection error. Please check your internet.',
        },
      };
    }
  }

  /**
   * Sign up new user
   */
  async signup(signupData: SignupData): Promise<ApiResponse<Session>> {
    const config = getConfig();
    if (!config) {
      return { error: { code: 'NO_CONFIG', message: 'Supabase not configured' } };
    }

    try {
      const response = await fetch(`${config.supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
          data: { name: signupData.name },
        }),
      });

      const data = await response.json();

      if (data.error) {
        return {
          error: {
            code: data.error.code || 'SIGNUP_ERROR',
            message: data.error.message || 'Signup failed',
            status: response.status,
          },
        };
      }

      // Save session
      const session: Session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        token_type: data.token_type,
        user: data.user,
      };

      await storage.setSession(session);
      this.currentSession = session;
      this.currentUser = data.user;

      // Create user record
      await this.ensureUserRecord(signupData.name);

      this.emit('SIGNED_IN', session);

      return { data: session };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Connection error. Please check your internet.',
        },
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await storage.clearSession();
    this.currentUser = null;
    this.currentSession = null;
    this.emit('SIGNED_OUT', null);
  }

  /**
   * Refresh the access token
   */
  async refreshSession(): Promise<boolean> {
    const config = getConfig();
    if (!config || !this.currentSession?.refresh_token) {
      return false;
    }

    try {
      const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.currentSession.refresh_token,
        }),
      });

      const data = await response.json();

      if (data.error || !data.access_token) {
        this.emit('SESSION_EXPIRED', null);
        return false;
      }

      // Update session
      const session: Session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        token_type: data.token_type,
        user: data.user,
      };

      await storage.setSession(session);
      this.currentSession = session;
      this.currentUser = data.user;

      this.emit('TOKEN_REFRESHED', session);

      return true;
    } catch (error) {
      this.emit('SESSION_EXPIRED', null);
      return false;
    }
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.currentSession?.access_token || null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Ensure user record exists in users table
   */
  private async ensureUserRecord(name?: string): Promise<void> {
    if (!this.currentUser || !this.currentSession) return;

    const config = getConfig();
    if (!config) return;

    try {
      await fetch(`${config.supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseAnonKey,
          'Authorization': `Bearer ${this.currentSession.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          id: this.currentUser.id,
          email: this.currentUser.email,
          name: name || this.currentUser.email.split('@')[0],
        }),
      });
    } catch {
      // User might already exist, ignore error
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
