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
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#228855',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.hint.mobile',
      infoPlist: {
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
      package: 'com.hint.mobile',
      intentFilters: [
        {
          action: 'android.intent.action.SEND',
          category: ['android.intent.category.DEFAULT'],
          data: {
            mimeType: 'text/plain',
          },
        },
      ],
    },
    // OneSignal plugin requires native build - uncomment when building for production
    // plugins: [
    //   [
    //     'onesignal-expo-plugin',
    //     {
    //       mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    //     },
    //   ],
    // ],
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      onesignalAppId: process.env.ONESIGNAL_APP_ID,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'your-project-id',
      },
    },
  },
};
