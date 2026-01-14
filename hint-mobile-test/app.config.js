/**
 * Hint Mobile - Expo Configuration
 * Dynamic configuration with environment variables
 */

export default {
  expo: {
    name: 'Hint',
    slug: 'hint-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'hint',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#228855',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.wahans.hint',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription: 'Used to save product images',
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['hint'],
          },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#228855',
      },
      package: 'com.wahans.hint',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            { scheme: 'hint' },
            { scheme: 'https', host: 'hint.com', pathPrefix: '/list' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'android.intent.action.SEND',
          category: ['android.intent.category.DEFAULT'],
          data: {
            mimeType: 'text/plain',
          },
        },
      ],
    },
    plugins: [
      '@react-native-community/datetimepicker',
      // OneSignal plugin requires native build - uncomment when building for production
      // [
      //   'onesignal-expo-plugin',
      //   {
      //     mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      //   },
      // ],
    ],
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      onesignalAppId: process.env.ONESIGNAL_APP_ID,
      eas: {
        projectId: '8a0f6e96-2ac1-471c-964a-cfa7d5b53393',
      },
    },
  },
};
