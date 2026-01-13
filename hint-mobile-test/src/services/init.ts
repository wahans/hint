/**
 * Hint Mobile - Service Initialization
 * Sets up shared services for React Native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { storage, initConfig } from '../../shared/index';

// Environment variables from app.config.js
const ENV = {
  SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl || '',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey || '',
  ONESIGNAL_APP_ID: Constants.expoConfig?.extra?.onesignalAppId || '',
};

/**
 * Initialize all services for the mobile app
 */
export async function initializeServices(): Promise<boolean> {
  try {
    // 0. Store AsyncStorage globally for shared config module to access
    (global as any).__hintAsyncStorage = AsyncStorage;

    // 1. Initialize storage with AsyncStorage adapter
    storage.initialize('mobile');
    storage.setMobileStorage(AsyncStorage);

    // 2. Store config in AsyncStorage for shared services
    if (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
      await AsyncStorage.setItem('supabaseUrl', ENV.SUPABASE_URL);
      await AsyncStorage.setItem('supabaseKey', ENV.SUPABASE_ANON_KEY);
    }

    // 3. Initialize config from storage
    const config = await initConfig('mobile');

    if (!config) {
      console.warn('Configuration not loaded - check environment variables');
      return false;
    }

    console.log('Services initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize services:', error);
    return false;
  }
}

/**
 * Get environment configuration
 */
export function getEnv() {
  return ENV;
}

export { storage };
