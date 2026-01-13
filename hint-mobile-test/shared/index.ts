/**
 * Hint - Shared Module Index
 * Main entry point for shared code across platforms
 */

// Types
export * from './types';

// Configuration
export {
  initConfig,
  getConfig,
  setConfig,
  isConfigured,
  clearConfig,
  detectPlatform,
  type Platform,
} from './config';

// Services
export {
  authService,
  listService,
  productService,
  claimService,
  storage,
  STORAGE_KEYS,
  type AuthState,
  type AuthEventType,
  type AuthEventListener,
  type StorageAdapter,
} from './services';
