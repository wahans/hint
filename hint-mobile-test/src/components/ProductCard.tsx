/**
 * Hint Mobile - Product Card Component
 * FIXED: Better spacing, alignment, and image handling
 */

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Button, Chip, IconButton } from 'react-native-paper';
import type { Product } from '../../shared/types';
import { useTheme } from '../context/ThemeContext';
import { formatPrice } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showClaimButton?: boolean;
  onClaimToggle?: () => void;
}

export default function ProductCard({
  product,
  onPress,
  showClaimButton = false,
  onClaimToggle,
}: ProductCardProps) {
  const { theme } = useTheme();

  // Check if price is below target (price alert)
  const isPriceAlertTriggered = product.target_price && product.current_price
    ? product.current_price <= product.target_price
    : false;
  const isClaimed = !!product.claimed_by || !!product.guest_claimer_name;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        {/* Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <IconButton
              icon="gift"
              size={28}
              iconColor={theme.colors.onSurfaceVariant}
              style={styles.placeholderIcon}
            />
          )}
        </View>

        {/* Product Info */}
        <View style={styles.info}>
          <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
            {product.name}
          </Text>

          {product.url && (
            <Text
              variant="bodySmall"
              style={[styles.hostname, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {(() => {
                try {
                  return new URL(product.url).hostname.replace('www.', '');
                } catch {
                  return '';
                }
              })()}
            </Text>
          )}

          {/* Price */}
          {product.current_price != null && (
            <Text variant="titleLarge" style={[styles.price, { color: theme.colors.primary }]}>
              ${product.current_price.toFixed(2)}
            </Text>
          )}

          {/* Status Chips Row */}
          <View style={styles.chipsRow}>
            {/* Stock Status */}
            {product.in_stock === false && (
              <Chip
                compact
                mode="flat"
                style={[styles.chip, { backgroundColor: theme.colors.errorContainer }]}
                textStyle={[styles.chipText, { color: theme.colors.error }]}
              >
                Out of Stock
              </Chip>
            )}

            {/* Price Alert */}
            {isPriceAlertTriggered && (
              <Chip
                compact
                mode="flat"
                icon="bell-ring"
                style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
                textStyle={[styles.chipText, { color: theme.colors.onPrimaryContainer }]}
              >
                Target reached!
              </Chip>
            )}

            {/* Claimed Status */}
            {isClaimed && (
              <Chip
                compact
                mode="flat"
                icon="check"
                style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
                textStyle={[styles.chipText, { color: theme.colors.onPrimaryContainer }]}
              >
                Claimed
              </Chip>
            )}
          </View>
        </View>
      </View>

      {/* Claim Button */}
      {showClaimButton && (
        <Card.Actions style={styles.actions}>
          <Button
            mode={isClaimed ? 'outlined' : 'contained'}
            onPress={onClaimToggle}
            icon={isClaimed ? 'close' : 'gift'}
            compact
          >
            {isClaimed ? 'Unclaim' : 'Claim Item'}
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    margin: 0,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    lineHeight: 22,
  },
  hostname: {
    marginTop: 2,
  },
  price: {
    marginTop: 6,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    height: 26,
  },
  chipText: {
    fontSize: 11,
    marginVertical: 0,
  },
  actions: {
    paddingTop: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
