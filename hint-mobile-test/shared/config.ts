/**
 * Hint - Centralized Configuration
 * Environment configuration for all platforms
 */

import type { AppConfig } from './types/models';

// Environment detection
export type Platform = 'extension' | 'web' | 'mobile';

export function detectPlatform(): Platform {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return 'extension';
  }
  if (typeof window !== 'undefined' && 'ReactNative' in window) {
    return 'mobile';
  }
  return 'web';
}

// Default configuration (can be overridden per-platform)
const DEFAULT_CONFIG: Partial<AppConfig> = {
  // These will be loaded from storage/environment
  supabaseUrl: '',
  supabaseAnonKey: '',
};

// Configuration storage
let currentConfig: AppConfig | null = null;

/**
 * Initialize configuration from storage or environment
 */
export async function initConfig(platform: Platform): Promise<AppConfig | null> {
  switch (platform) {
    case 'extension':
      return loadExtensionConfig();
    case 'mobile':
      return loadMobileConfig();
    case 'web':
      return loadWebConfig();
    default:
      return null;
  }
}

/**
 * Load config from Chrome extension storage
 */
async function loadExtensionConfig(): Promise<AppConfig | null> {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return null;
  }

  const stored = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey']);

  if (stored.supabaseUrl && stored.supabaseKey) {
    currentConfig = {
      supabaseUrl: stored.supabaseUrl,
      supabaseAnonKey: stored.supabaseKey,
    };
    return currentConfig;
  }

  return null;
}

/**
 * Load config for React Native mobile app
 * Reads from AsyncStorage where init.ts stores the env variables
 */
async function loadMobileConfig(): Promise<AppConfig | null> {
  // Mobile config is stored in AsyncStorage by the init.ts service
  // Try to read from global AsyncStorage if available
  try {
    const AsyncStorage = (global as any).__hintAsyncStorage;
    if (AsyncStorage) {
      const supabaseUrl = await AsyncStorage.getItem('supabaseUrl');
      const supabaseKey = await AsyncStorage.getItem('supabaseKey');

      if (supabaseUrl && supabaseKey) {
        currentConfig = {
          supabaseUrl,
          supabaseAnonKey: supabaseKey,
        };
        return currentConfig;
      }
    }
  } catch (error) {
    console.warn('Failed to load mobile config from AsyncStorage:', error);
  }

  return null;
}

/**
 * Load config for web viewer
 */
async function loadWebConfig(): Promise<AppConfig | null> {
  // Web viewer uses hardcoded public values (read-only access)
  // These should be set via environment variables at build time
  const config: AppConfig = {
    supabaseUrl: (window as any).SUPABASE_URL || '',
    supabaseAnonKey: (window as any).SUPABASE_ANON_KEY || '',
  };

  if (config.supabaseUrl && config.supabaseAnonKey) {
    currentConfig = config;
    return currentConfig;
  }

  return null;
}

/**
 * Get current configuration
 */
export function getConfig(): AppConfig | null {
  return currentConfig;
}

/**
 * Set configuration manually (useful for extension setup flow)
 */
export async function setConfig(config: AppConfig, platform: Platform): Promise<void> {
  currentConfig = config;

  if (platform === 'extension' && typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.local.set({
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseAnonKey,
    });
  }
}

/**
 * Check if configuration is valid
 */
export function isConfigured(): boolean {
  return currentConfig !== null &&
         currentConfig.supabaseUrl !== '' &&
         currentConfig.supabaseAnonKey !== '';
}

/**
 * Clear configuration (for logout)
 */
export async function clearConfig(platform: Platform): Promise<void> {
  currentConfig = null;

  if (platform === 'extension' && typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.local.remove(['supabaseUrl', 'supabaseKey']);
  }
}
