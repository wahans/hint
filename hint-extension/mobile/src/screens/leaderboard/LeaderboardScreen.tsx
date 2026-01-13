/**
 * Hint Mobile - Leaderboard Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Chip, SegmentedButtons, Surface } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import type { LeaderboardScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  points: number;
  rank: number;
  claims_count: number;
  lists_count: number;
}

export default function LeaderboardScreen({ navigation }: LeaderboardScreenProps<'Leaderboard'>) {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'monthly' | 'allTime'>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLeaderboard = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // TODO: Implement leaderboard API call
      // For now, using placeholder data
      const mockData: LeaderboardEntry[] = [
        { user_id: '1', display_name: 'Sarah', points: 1250, rank: 1, claims_count: 15, lists_count: 5 },
        { user_id: '2', display_name: 'Mike', points: 980, rank: 2, claims_count: 12, lists_count: 4 },
        { user_id: '3', display_name: 'Emma', points: 875, rank: 3, claims_count: 10, lists_count: 3 },
      ];
      setEntries(mockData);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [period])
  );

  const handleRefresh = () => loadLeaderboard(true);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.user_id === user?.id;

    return (
      <Card
        style={[
          styles.entryCard,
          isCurrentUser && { borderColor: theme.colors.primary, borderWidth: 2 },
        ]}
      >
        <Card.Content style={styles.entryContent}>
          <View style={styles.rankContainer}>
            <Surface
              style={[styles.rankBadge, { backgroundColor: getRankColor(item.rank) }]}
              elevation={1}
            >
              <Text variant="titleMedium" style={styles.rankText}>
                {item.rank}
              </Text>
            </Surface>
          </View>

          <Avatar.Text
            size={48}
            label={item.display_name.charAt(0).toUpperCase()}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.onPrimaryContainer }}
          />

          <View style={styles.entryInfo}>
            <Text variant="titleMedium">
              {item.display_name}
              {isCurrentUser && ' (You)'}
            </Text>
            <View style={styles.stats}>
              <Chip compact icon="gift" style={styles.statChip}>
                {item.claims_count} claimed
              </Chip>
              <Chip compact icon="format-list-bulleted" style={styles.statChip}>
                {item.lists_count} lists
              </Chip>
            </View>
          </View>

          <View style={styles.pointsContainer}>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
              {item.points}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              pts
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <SegmentedButtons
            value={period}
            onValueChange={(value) => setPeriod(value as typeof period)}
            buttons={[
              { value: 'monthly', label: 'This Month' },
              { value: 'allTime', label: 'All Time' },
            ]}
          />
        </View>
        <LoadingSkeleton count={5} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <SegmentedButtons
          value={period}
          onValueChange={(value) => setPeriod(value as typeof period)}
          buttons={[
            { value: 'monthly', label: 'This Month' },
            { value: 'allTime', label: 'All Time' },
          ]}
        />
      </View>

      {entries.length === 0 ? (
        <EmptyState
          icon="trophy"
          title="No rankings yet"
          description="Start claiming items and sharing lists to earn points!"
        />
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.user_id}
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  entryCard: {
    marginBottom: 12,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    marginRight: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontWeight: '700',
    color: '#fff',
  },
  entryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  statChip: {
    height: 24,
  },
  pointsContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
});
