/**
 * Hint Mobile - Friends' Lists Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Share, Alert, Keyboard } from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Chip,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  IconButton,
  Divider,
  Badge,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import type { FriendsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { friendsService, type FriendWithLists } from '../../../shared/services';
import type { FriendRequest } from '../../../shared/types';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

export default function FriendsListsScreen({ navigation }: FriendsScreenProps<'FriendsLists'>) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [friendsData, setFriendsData] = useState<FriendWithLists[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal states
  const [fabOpen, setFabOpen] = useState(false);
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');

  const loadFriendsLists = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError(null);

    try {
      const friendsResult = await friendsService.getFriendsWithLists();
      if (friendsResult.data) {
        // Filter out any invalid entries
        const validFriends = (friendsResult.data || []).filter(
          (f) => f && f.friendId && typeof f.friendId === 'string'
        );
        setFriendsData(validFriends);
      } else {
        console.error('Failed to load friends lists:', friendsResult.error?.message);
        setFriendsData([]);
      }
    } catch (error) {
      console.error('Failed to load friends lists:', error);
      setFriendsData([]);
      setLoadError('Failed to load friends');
    }

    try {
      const requestsResult = await friendsService.getPendingRequests();
      if (requestsResult.data) {
        // Filter out any invalid entries
        const validRequests = (requestsResult.data || []).filter(
          (r) => r && r.id && typeof r.id === 'string'
        );
        setPendingRequests(validRequests);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Failed to load pending requests:', error);
      setPendingRequests([]);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadFriendsLists();
    }, [])
  );

  const handleRefresh = () => loadFriendsLists(true);

  const handleAddFriend = async () => {
    const email = friendEmail.trim().toLowerCase();
    if (!email) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setRequestError('Please enter an email address');
      return;
    }

    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setRequestError('Please enter a valid email address');
      return;
    }

    setRequestError('');
    setIsSendingRequest(true);
    Keyboard.dismiss();

    try {
      const result = await friendsService.sendFriendRequest(email);
      if (result.error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setRequestError(result.error.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAddFriendModalVisible(false);
        setFriendEmail('');
        Alert.alert('Request Sent', `Friend request sent to ${email}!`);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setRequestError('Failed to send friend request. Please try again.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleInviteFriend = async () => {
    setFabOpen(false);
    try {
      const userName = user?.name || user?.user_metadata?.name || 'A friend';
      const inviteMessage = `${userName} is inviting you to join Hint - the smarter way to share your wishlist!\n\nDownload the app: https://hint.com/download`;

      await Share.share({
        message: inviteMessage,
      });
    } catch (error) {
      // User cancelled or error
      console.log('Share cancelled or failed:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, fromName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await friendsService.acceptFriendRequest(requestId);
      if (result.error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', result.error.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Friend Added', `You are now friends with ${fromName}!`);
        loadFriendsLists(true);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await friendsService.rejectFriendRequest(requestId);
      if (result.error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', result.error.message);
      } else {
        loadFriendsLists(true);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) return null;

    return (
      <View style={styles.pendingSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Friend Requests ({pendingRequests.length})
        </Text>
        {pendingRequests.map((request) => {
          const displayName = request.from_user_name || request.from_user_email?.split('@')[0] || 'User';
          return (
            <Card key={request.id} style={styles.requestCard}>
              <Card.Content style={styles.requestContent}>
                <View style={styles.requestInfo}>
                  <Avatar.Text
                    size={40}
                    label={displayName.charAt(0).toUpperCase()}
                    style={{ backgroundColor: theme.colors.secondaryContainer }}
                    labelStyle={{ color: theme.colors.onSecondaryContainer }}
                  />
                  <View style={styles.requestText}>
                    <Text variant="titleSmall">{displayName}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {request.from_user_email || ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <IconButton
                    icon="check"
                    mode="contained"
                    containerColor={theme.colors.primaryContainer}
                    iconColor={theme.colors.primary}
                    size={24}
                    onPress={() => handleAcceptRequest(request.id, displayName)}
                    accessibilityLabel={`Accept friend request from ${displayName}`}
                    accessibilityRole="button"
                  />
                  <IconButton
                    icon="close"
                    mode="contained"
                    containerColor={theme.colors.errorContainer}
                    iconColor={theme.colors.error}
                    size={24}
                    onPress={() => handleRejectRequest(request.id)}
                    accessibilityLabel={`Reject friend request from ${displayName}`}
                    accessibilityRole="button"
                  />
                </View>
              </Card.Content>
            </Card>
          );
        })}
        <Divider style={styles.divider} />
      </View>
    );
  };

  const renderFriend = ({ item }: { item: FriendWithLists }) => {
    const friendName = item.friendName || 'Friend';
    return (
      <View style={styles.friendSection}>
        <View style={styles.friendHeader}>
          <Avatar.Text
            size={40}
            label={friendName.charAt(0).toUpperCase()}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.onPrimaryContainer }}
          />
          <Text variant="titleMedium" style={styles.friendName}>
            {friendName}
          </Text>
        </View>

        {(item.lists || []).map((list) => (
          <Card
            key={list.id}
            style={styles.listCard}
            onPress={() =>
              navigation.navigate('FriendListDetail', {
                listId: list.id,
                listName: list.name || 'List',
                ownerName: friendName,
              })
            }
          >
            <Card.Title
              title={list.name || 'Untitled List'}
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
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSkeleton count={4} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="alert-circle"
          title="Something went wrong"
          description={loadError}
          actionLabel="Try Again"
          onAction={() => loadFriendsLists()}
        />
      </View>
    );
  }

  const hasContent = friendsData.length > 0 || pendingRequests.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!hasContent ? (
        <EmptyState
          icon="account-group"
          title="No friends yet"
          description="Add friends to see their wishlists and share yours with them"
          actionLabel="Add a Friend"
          onAction={() => setAddFriendModalVisible(true)}
        />
      ) : (
        <FlatList
          data={friendsData}
          renderItem={renderFriend}
          keyExtractor={(item) => item.friendId}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderPendingRequests}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            pendingRequests.length === 0 ? null : (
              <Text
                variant="bodyMedium"
                style={[styles.noListsText, { color: theme.colors.onSurfaceVariant }]}
              >
                No friends' lists to show yet
              </Text>
            )
          }
        />
      )}

      {/* FAB Group for Add Friend / Invite */}
      <FAB.Group
        open={fabOpen}
        visible={true}
        icon={fabOpen ? 'close' : 'account-plus'}
        actions={[
          {
            icon: 'email-plus',
            label: 'Add by Email',
            onPress: () => {
              setFabOpen(false);
              setAddFriendModalVisible(true);
            },
          },
          {
            icon: 'share-variant',
            label: 'Invite Friend',
            onPress: handleInviteFriend,
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        fabStyle={{ backgroundColor: theme.colors.primary }}
        color={theme.colors.onPrimary}
      />

      {/* Pending requests badge */}
      {pendingRequests.length > 0 && !fabOpen && (
        <Badge style={[styles.badge, { backgroundColor: theme.colors.error }]} size={20}>
          {pendingRequests.length}
        </Badge>
      )}

      {/* Add Friend Modal */}
      <Portal>
        <Modal
          visible={addFriendModalVisible}
          onDismiss={() => {
            setAddFriendModalVisible(false);
            setFriendEmail('');
            setRequestError('');
          }}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Add Friend
          </Text>
          <Text variant="bodyMedium" style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}>
            Enter your friend's email address to send them a friend request
          </Text>

          <TextInput
            label="Friend's Email"
            value={friendEmail}
            onChangeText={setFriendEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="friend@example.com"
            style={styles.emailInput}
            error={!!requestError}
          />

          {requestError ? (
            <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
              {requestError}
            </Text>
          ) : null}

          <View style={styles.modalActions}>
            <Button
              mode="contained"
              onPress={handleAddFriend}
              loading={isSendingRequest}
              disabled={isSendingRequest}
              style={styles.modalButton}
            >
              Send Request
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                setAddFriendModalVisible(false);
                setFriendEmail('');
                setRequestError('');
              }}
              disabled={isSendingRequest}
              style={styles.modalButton}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  pendingSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  requestCard: {
    marginBottom: 8,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestText: {
    marginLeft: 16,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  divider: {
    marginTop: 16,
  },
  friendSection: {
    marginBottom: 24,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  friendName: {
    marginLeft: 16,
  },
  listCard: {
    marginBottom: 8,
    marginLeft: 52,
  },
  countChip: {
    marginRight: 16,
  },
  noListsText: {
    textAlign: 'center',
    marginTop: 24,
  },
  badge: {
    position: 'absolute',
    bottom: 100,
    right: 16,
  },
  modalContainer: {
    margin: 24,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 8,
  },
  modalDescription: {
    marginBottom: 24,
  },
  emailInput: {
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 16,
  },
  modalActions: {
    gap: 16,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 4,
  },
});
