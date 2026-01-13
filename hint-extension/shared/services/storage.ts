/**
 * Hint - Storage Abstraction Layer
 * Provides unified storage API across Chrome extension, React Native, and web
 */

import type { Session, UserPreferences } from '../types/models';
import type { Platform } from '../config';

// Storage interface that all implementations must follow
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Chrome Extension Storage Adapter
class ChromeStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return null;
    }
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }
    await chrome.storage.local.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }
    await chrome.storage.local.remove(key);
  }

  async clear(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }
    await chrome.storage.local.clear();
  }
}

// React Native AsyncStorage Adapter (for mobile app)
class ReactNativeStorageAdapter implements StorageAdapter {
  private AsyncStorage: any = null;

  constructor() {
    // AsyncStorage will be injected when mobile app initializes
  }

  setAsyncStorage(asyncStorage: any): void {
    this.AsyncStorage = asyncStorage;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.AsyncStorage) {
      return null;
    }
    try {
      const value = await this.AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.AsyncStorage) {
      return;
    }
    await this.AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    if (!this.AsyncStorage) {
      return;
    }
    await this.AsyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    if (!this.AsyncStorage) {
      return;
    }
    await this.AsyncStorage.clear();
  }
}

// Web LocalStorage Adapter (for web viewer)
class WebStorageAdapter implements StorageAdapter {
  private prefix = 'hint_';

  async get<T>(key: string): Promise<T | null> {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }
    // Only clear hint_ prefixed items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// Storage key constants
export const STORAGE_KEYS = {
  SESSION: 'session',
  USER: 'user',
  THEME: 'theme',
  PREFERENCES: 'preferences',
  SUPABASE_URL: 'supabaseUrl',
  SUPABASE_KEY: 'supabaseKey',
  CACHED_LISTS: 'cachedLists',
  CACHED_PRODUCTS: 'cachedProducts',
  LAST_SYNC: 'lastSync',
} as const;

// Storage service singleton
class StorageService {
  private adapter: StorageAdapter | null = null;
  private platform: Platform = 'web';

  initialize(platform: Platform): void {
    this.platform = platform;

    switch (platform) {
      case 'extension':
        this.adapter = new ChromeStorageAdapter();
        break;
      case 'mobile':
        this.adapter = new ReactNativeStorageAdapter();
        break;
      case 'web':
      default:
        this.adapter = new WebStorageAdapter();
        break;
    }
  }

  // Inject AsyncStorage for React Native
  setMobileStorage(asyncStorage: any): void {
    if (this.adapter instanceof ReactNativeStorageAdapter) {
      this.adapter.setAsyncStorage(asyncStorage);
    }
  }

  // Session management
  async getSession(): Promise<Session | null> {
    return this.adapter?.get<Session>(STORAGE_KEYS.SESSION) || null;
  }

  async setSession(session: Session): Promise<void> {
    await this.adapter?.set(STORAGE_KEYS.SESSION, session);
  }

  async clearSession(): Promise<void> {
    await this.adapter?.remove(STORAGE_KEYS.SESSION);
    await this.adapter?.remove(STORAGE_KEYS.USER);
  }

  // Theme management
  async getTheme(): Promise<'light' | 'dark' | 'system' | null> {
    return this.adapter?.get<'light' | 'dark' | 'system'>(STORAGE_KEYS.THEME) || null;
  }

  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.adapter?.set(STORAGE_KEYS.THEME, theme);
  }

  // User preferences
  async getPreferences(): Promise<UserPreferences | null> {
    return this.adapter?.get<UserPreferences>(STORAGE_KEYS.PREFERENCES) || null;
  }

  async setPreferences(prefs: UserPreferences): Promise<void> {
    await this.adapter?.set(STORAGE_KEYS.PREFERENCES, prefs);
  }

  // Generic storage methods
  async get<T>(key: string): Promise<T | null> {
    return this.adapter?.get<T>(key) || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.adapter?.set(key, value);
  }

  async remove(key: string): Promise<void> {
    await this.adapter?.remove(key);
  }

  async clear(): Promise<void> {
    await this.adapter?.clear();
  }

  // Cache management for offline support
  async getCachedData<T>(key: string): Promise<{ data: T; timestamp: number } | null> {
    return this.adapter?.get<{ data: T; timestamp: number }>(key) || null;
  }

  async setCachedData<T>(key: string, data: T): Promise<void> {
    await this.adapter?.set(key, { data, timestamp: Date.now() });
  }

  isCacheValid(timestamp: number, maxAgeMs: number = 5 * 60 * 1000): boolean {
    return Date.now() - timestamp < maxAgeMs;
  }
}

// Export singleton instance
export const storage = new StorageService();
