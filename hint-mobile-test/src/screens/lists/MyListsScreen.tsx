/**
 * Hint Mobile - My Lists Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Image } from 'react-native';
import { Text, FAB, Card, IconButton, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import type { ListsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { listService } from '../../../shared/services';
import type { List } from '../../../shared/types';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

export default function MyListsScreen({ navigation }: ListsScreenProps<'MyLists'>) {
  const { theme } = useTheme();
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      ),
    });
  }, [navigation]);

  const loadLists = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const result = await listService.getMyLists();
      if (result.data) {
        setLists(result.data);
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  const handleRefresh = () => loadLists(true);

  const renderList = ({ item }: { item: List }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name })}
      accessibilityLabel={`${item.name}, ${item.is_public ? 'public' : 'private'} list${item.key_date ? `, due ${item.key_date}` : ''}`}
      accessibilityRole="button"
      accessibilityHint="Opens list details"
    >
      <Card.Title
        title={item.name}
        subtitle={item.key_date ? `Due: ${item.key_date}` : 'No due date'}
        right={(props) => (
          <View style={styles.cardRight}>
            <Chip
              compact
              mode="flat"
              style={[
                styles.visibilityChip,
                { backgroundColor: item.is_public ? theme.colors.primaryContainer : theme.colors.surfaceVariant },
              ]}
            >
              {item.is_public ? 'public' : 'private'}
            </Chip>
            <IconButton icon="chevron-right" {...props} />
          </View>
        )}
      />
    </Card>
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
      {lists.length === 0 ? (
        <EmptyState
          icon="format-list-bulleted"
          title="No lists yet"
          description="Create your first wishlist to start tracking products"
          actionLabel="Create List"
          onAction={() => navigation.navigate('CreateList')}
        />
      ) : (
        <FlatList
          data={lists}
          renderItem={renderList}
          keyExtractor={(item) => item.id}
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

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('CreateList')}
        accessibilityLabel="Create new list"
        accessibilityRole="button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityChip: {
    marginRight: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
