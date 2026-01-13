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
import { leaderboardService } from '../../../shared/services';
import type { LeaderboardEntry as LeaderboardEntryType, LeaderboardTimeframe } from '../../../shared/types';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

// Extended interface for display
interface LeaderboardEntry extends LeaderboardEntryType {
  display_name: string;
}

export default function LeaderboardScreen({ navigation }: LeaderboardScreenProps<'Leaderboard'>) {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLeaderboard = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Map UI period to API timeframe
      const timeframeMap: Record<string, LeaderboardTimeframe> = {
        weekly: 'week',
        monthly: 'month',
        allTime: 'all',
      };
      const timeframe: LeaderboardTimeframe = timeframeMap[period];

      const result = await leaderboardService.getLeaderboard(timeframe, 20, false);

      if (result.data) {
        // Map API response to display format
        const displayEntries: LeaderboardEntry[] = result.data.map((entry) => ({
          ...entry,
          display_name: entry.name || entry.email?.split('@')[0] || 'Anonymous',
        }));
        setEntries(displayEntries);
      } else {
        console.error('Failed to load leaderboard:', result.error?.message);
        setEntries([]);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setEntries([]);
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
              <Chip compact icon="fire" style={styles.statChip}>
                {item.streak_days} day streak
              </Chip>
              {item.badges && item.badges.length > 0 && (
                <Chip compact icon="trophy" style={styles.statChip}>
                  {item.badges.length} badges
                </Chip>
              )}
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
              { value: 'weekly', label: 'This Week' },
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
            { value: 'weekly', label: 'This Week' },
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
          keyExtractor={(item, index) => item.user_id || item.email || `entry-${index}`}
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
