/**
 * Hint Mobile - Main Tab Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import type {
  MainTabParamList,
  ListsStackParamList,
  FriendsStackParamList,
  LeaderboardStackParamList,
  SettingsStackParamList,
} from './types';
import { useTheme } from '../context/ThemeContext';

// Screens
import MyListsScreen from '../screens/lists/MyListsScreen';
import ListDetailScreen from '../screens/lists/ListDetailScreen';
import CreateListScreen from '../screens/lists/CreateListScreen';
import EditListScreen from '../screens/lists/EditListScreen';
import FriendsListsScreen from '../screens/friends/FriendsListsScreen';
import FriendListDetailScreen from '../screens/friends/FriendListDetailScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';
import NotificationCenterScreen from '../screens/settings/NotificationCenterScreen';
import AccountScreen from '../screens/settings/AccountScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Lists Stack
const ListsStack = createNativeStackNavigator<ListsStackParamList>();
function ListsStackNavigator() {
  const { theme } = useTheme();
  return (
    <ListsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <ListsStack.Screen
        name="MyLists"
        component={MyListsScreen}
        options={{ title: 'My Lists' }}
      />
      <ListsStack.Screen
        name="ListDetail"
        component={ListDetailScreen}
        options={({ route }) => ({ title: route.params.listName })}
      />
      <ListsStack.Screen
        name="CreateList"
        component={CreateListScreen}
        options={{ title: 'New List', presentation: 'modal' }}
      />
      <ListsStack.Screen
        name="EditList"
        component={EditListScreen}
        options={{ title: 'Edit List', presentation: 'modal' }}
      />
    </ListsStack.Navigator>
  );
}

// Friends Stack
const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();
function FriendsStackNavigator() {
  const { theme } = useTheme();
  return (
    <FriendsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <FriendsStack.Screen
        name="FriendsLists"
        component={FriendsListsScreen}
        options={{ title: "Friends' Lists" }}
      />
      <FriendsStack.Screen
        name="FriendListDetail"
        component={FriendListDetailScreen}
        options={({ route }) => ({
          title: route.params.listName,
          headerBackTitle: route.params.ownerName,
        })}
      />
    </FriendsStack.Navigator>
  );
}

// Leaderboard Stack
const LeaderboardStack = createNativeStackNavigator<LeaderboardStackParamList>();
function LeaderboardStackNavigator() {
  const { theme } = useTheme();
  return (
    <LeaderboardStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <LeaderboardStack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
    </LeaderboardStack.Navigator>
  );
}

// Settings Stack
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
function SettingsStackNavigator() {
  const { theme } = useTheme();
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notification Settings' }}
      />
      <SettingsStack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{ title: 'Activity' }}
      />
      <SettingsStack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Account' }}
      />
    </SettingsStack.Navigator>
  );
}

export default function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
      }}
    >
      <Tab.Screen
        name="ListsTab"
        component={ListsStackNavigator}
        options={{
          tabBarLabel: 'My Lists',
          tabBarIcon: ({ color, size }) => (
            <Icon source="format-list-bulleted" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FriendsTab"
        component={FriendsStackNavigator}
        options={{
          tabBarLabel: 'Friends',
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardStackNavigator}
        options={{
          tabBarLabel: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Icon source="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon source="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
