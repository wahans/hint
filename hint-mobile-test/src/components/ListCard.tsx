/**
 * Hint Mobile - List Card Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import type { List } from '../../shared/types';
import { useTheme } from '../context/ThemeContext';

interface ListCardProps {
  list: List;
  onPress?: () => void;
  onOptionsPress?: () => void;
}

export default function ListCard({
  list,
  onPress,
  onOptionsPress,
}: ListCardProps) {
  const { theme } = useTheme();

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Title
        title={list.name}
        subtitle={list.key_date ? `Due: ${list.key_date}` : 'Wishlist'}
        left={(props) => (
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <IconButton
              icon="format-list-bulleted"
              size={20}
              iconColor={theme.colors.primary}
            />
          </View>
        )}
        right={(props) => (
          <View style={styles.rightContainer}>
            <Chip
              compact
              mode="flat"
              icon={list.is_public ? 'earth' : 'lock'}
              style={[
                styles.visibilityChip,
                {
                  backgroundColor: list.is_public
                    ? theme.colors.primaryContainer
                    : theme.colors.surfaceVariant,
                },
              ]}
            >
              {list.is_public ? 'public' : 'private'}
            </Chip>
            {onOptionsPress ? (
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={onOptionsPress}
              />
            ) : (
              <IconButton icon="chevron-right" size={20} />
            )}
          </View>
        )}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  iconContainer: {
    borderRadius: 20,
    margin: -8,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityChip: {
    marginRight: 4,
  },
});
