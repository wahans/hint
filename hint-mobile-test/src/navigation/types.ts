/**
 * Hint Mobile - Navigation Types
 * Type definitions for React Navigation
 */

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth stack params
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

// Lists stack params
export type ListsStackParamList = {
  MyLists: undefined;
  ListDetail: { listId: string; listName: string };
  CreateList: undefined;
};

// Friends stack params
export type FriendsStackParamList = {
  FriendsLists: undefined;
  FriendListDetail: { listId: string; listName: string; ownerName: string };
};

// Leaderboard stack params
export type LeaderboardStackParamList = {
  Leaderboard: undefined;
};

// Settings stack params
export type SettingsStackParamList = {
  Settings: undefined;
  Notifications: undefined;
  Account: undefined;
};

// Main tab params
export type MainTabParamList = {
  ListsTab: NavigatorScreenParams<ListsStackParamList>;
  FriendsTab: NavigatorScreenParams<FriendsStackParamList>;
  LeaderboardTab: NavigatorScreenParams<LeaderboardStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

// Root stack params
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen props types
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type ListsScreenProps<T extends keyof ListsStackParamList> = NativeStackScreenProps<
  ListsStackParamList,
  T
>;

export type FriendsScreenProps<T extends keyof FriendsStackParamList> = NativeStackScreenProps<
  FriendsStackParamList,
  T
>;

export type LeaderboardScreenProps<T extends keyof LeaderboardStackParamList> = NativeStackScreenProps<
  LeaderboardStackParamList,
  T
>;

export type SettingsScreenProps<T extends keyof SettingsStackParamList> = NativeStackScreenProps<
  SettingsStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

// Extend navigation to add global types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
