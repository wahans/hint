/**
 * Hint Mobile - Auth Context
 * Manages authentication state across the app
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { authService, AuthState } from '../../shared/services';
import type { User } from '../../shared/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // Initialize auth from stored session
        await authService.initialize();
        const currentUser = authService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user || null);
      }
    });

    initAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);
      const result = await authService.login({ email, password });
      if (result.error) {
        return { error: result.error.message };
      }
      setUser(result.data?.user || null);
      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to sign in' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);
      const result = await authService.signup({ email, password, name: displayName });
      if (result.error) {
        return { error: result.error.message };
      }
      setUser(result.data?.user || null);
      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to sign up' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
