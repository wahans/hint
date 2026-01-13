/**
 * Hint Mobile - Friends' Lists Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, SectionList } from 'react-native';
import { Text, Card, Avatar, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import type { FriendsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { friendsService, type FriendWithLists } from '../../../shared/services';
import type { List } from '../../../shared/types';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

export default function FriendsListsScreen({ navigation }: FriendsScreenProps<'FriendsLists'>) {
  const { theme } = useTheme();
  const [friendsData, setFriendsData] = useState<FriendWithLists[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFriendsLists = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const result = await friendsService.getFriendsWithLists();
      if (result.data) {
        setFriendsData(result.data);
      } else {
        console.error('Failed to load friends lists:', result.error?.message);
        setFriendsData([]);
      }
    } catch (error) {
      console.error('Failed to load friends lists:', error);
      setFriendsData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFriendsLists();
    }, [])
  );

  const handleRefresh = () => loadFriendsLists(true);

  const renderFriend = ({ item }: { item: FriendWithLists }) => (
    <View style={styles.friendSection}>
      <View style={styles.friendHeader}>
        <Avatar.Text
          size={40}
          label={item.friendName.charAt(0).toUpperCase()}
          style={{ backgroundColor: theme.colors.primaryContainer }}
          labelStyle={{ color: theme.colors.onPrimaryContainer }}
        />
        <Text variant="titleMedium" style={styles.friendName}>
          {item.friendName}
        </Text>
      </View>

      {item.lists.map((list) => (
        <Card
          key={list.id}
          style={styles.listCard}
          onPress={() =>
            navigation.navigate('FriendListDetail', {
              listId: list.id,
              listName: list.name,
              ownerName: item.friendName,
            })
          }
        >
          <Card.Title
            title={list.name}
            subtitle={list.key_date ? `Due: ${list.key_date}` : 'Wishlist'}
            right={() => (
              <Chip compact mode="flat" style={styles.countChip}>
                View
              </Chip>
            )}
          />
        </Card>
      ))}
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSkeleton count={4} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {friendsData.length === 0 ? (
        <EmptyState
          icon="account-group"
          title="No friends' lists yet"
          description="When friends share their wishlists with you, they'll appear here"
        />
      ) : (
        <FlatList
          data={friendsData}
          renderItem={renderFriend}
          keyExtractor={(item) => item.friendId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
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
  friendSection: {
    marginBottom: 24,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendName: {
    marginLeft: 12,
  },
  listCard: {
    marginBottom: 8,
    marginLeft: 52,
  },
  countChip: {
    marginRight: 12,
  },
});
