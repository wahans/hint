/**
 * Hint Mobile - Notification Center Screen
 * In-app notifications for viewing activity
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Avatar, IconButton, Chip, Surface, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import type { SettingsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { storage } from '../../services/init';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

// Notification type definitions
type NotificationType =
  | 'item_claimed'
  | 'price_drop'
  | 'back_in_stock'
  | 'friend_request'
  | 'due_date_reminder'
  | 'friend_activity';

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: {
    listId?: string;
    productId?: string;
    friendId?: string;
    friendName?: string;
    price?: number;
    daysUntilDue?: number;
  };
}

// Icon and color mapping for notification types
const getNotificationStyle = (type: NotificationType) => {
  switch (type) {
    case 'item_claimed':
      return { icon: 'gift', color: '#4CAF50' };
    case 'price_drop':
      return { icon: 'arrow-down-bold', color: '#2196F3' };
    case 'back_in_stock':
      return { icon: 'package-variant', color: '#9C27B0' };
    case 'friend_request':
      return { icon: 'account-plus', color: '#FF9800' };
    case 'due_date_reminder':
      return { icon: 'calendar-clock', color: '#F44336' };
    case 'friend_activity':
      return { icon: 'account-group', color: '#00BCD4' };
    default:
      return { icon: 'bell', color: '#757575' };
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationCenterScreen({ navigation }: SettingsScreenProps<'NotificationCenter'>) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // In a real app, this would fetch from an API
      // For now, we'll use local storage and mock data
      const stored = await storage.get<AppNotification[]>('appNotifications');

      if (stored && stored.length > 0) {
        setNotifications(stored);
      } else {
        // Set empty - no mock data
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const handleRefresh = () => loadNotifications(true);

  const markAsRead = async (notificationId: string) => {
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await storage.set('appNotifications', updated);
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await storage.set('appNotifications', updated);
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    await storage.set('appNotifications', []);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const style = getNotificationStyle(item.type);

    return (
      <Card
        style={[
          styles.notificationCard,
          !item.read && { backgroundColor: theme.colors.primaryContainer + '20' },
        ]}
        onPress={() => markAsRead(item.id)}
      >
        <Card.Content style={styles.notificationContent}>
          <Avatar.Icon
            size={40}
            icon={style.icon}
            style={{ backgroundColor: style.color + '20' }}
            color={style.color}
          />
          <View style={styles.notificationText}>
            <View style={styles.notificationHeader}>
              <Text variant="titleSmall" style={!item.read && styles.unreadTitle}>
                {item.title}
              </Text>
              {!item.read && (
                <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
              )}
            </View>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
              numberOfLines={2}
            >
              {item.message}
            </Text>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.outline, marginTop: 4 }}
            >
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderHeader = () => {
    if (notifications.length === 0) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {unreadCount > 0 && (
            <Chip compact icon="bell-badge" style={styles.unreadChip}>
              {unreadCount} unread
            </Chip>
          )}
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <Chip compact onPress={markAllAsRead} style={styles.actionChip}>
              Mark all read
            </Chip>
          )}
          <Chip compact onPress={clearAllNotifications} icon="delete" style={styles.actionChip}>
            Clear all
          </Chip>
        </View>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSkeleton count={5} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {notifications.length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title="No notifications yet"
          description="You'll see activity here when things happen with your wishlists"
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  unreadChip: {
    backgroundColor: '#E3F2FD',
  },
  actionChip: {
    backgroundColor: '#F5F5F5',
  },
  notificationCard: {
    marginBottom: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationText: {
    flex: 1,
    marginLeft: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  separator: {
    height: 4,
  },
});
