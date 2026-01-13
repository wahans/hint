/**
 * Hint Mobile - Product Card Component
 */

import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Card, Text, Button, Chip, IconButton } from 'react-native-paper';
import type { Product } from '../../shared/types';
import { useTheme } from '../context/ThemeContext';
import { formatPrice, formatPriceChange } from '../utils/formatters';

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
  const isClaimed = !!product.claimed_by;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
              <IconButton icon="gift" size={32} iconColor={theme.colors.onSurfaceVariant} />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.info}>
          <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
            {product.name}
          </Text>

          {product.url && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
              {new URL(product.url).hostname.replace('www.', '')}
            </Text>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
              {formatPrice(product.current_price)}
            </Text>

            {isPriceAlertTriggered && (
              <Chip
                compact
                mode="flat"
                icon="bell-ring"
                style={[styles.priceChip, { backgroundColor: theme.colors.primaryContainer }]}
              >
                Target reached!
              </Chip>
            )}
          </View>

          {/* Stock Status */}
          {product.in_stock === false && (
            <Chip
              compact
              mode="flat"
              style={[styles.stockChip, { backgroundColor: theme.colors.errorContainer }]}
              textStyle={{ color: theme.colors.error }}
            >
              Out of Stock
            </Chip>
          )}

          {/* Claimed Status */}
          {isClaimed && (
            <Chip
              compact
              mode="flat"
              icon="check"
              style={[styles.claimedChip, { backgroundColor: theme.colors.primaryContainer }]}
            >
              Claimed
            </Chip>
          )}
        </View>
      </View>

      {/* Claim Button */}
      {showClaimButton && (
        <Card.Actions>
          <Button
            mode={isClaimed ? 'outlined' : 'contained'}
            onPress={onClaimToggle}
            icon={isClaimed ? 'close' : 'gift'}
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
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  priceChip: {
    height: 24,
  },
  stockChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  claimedChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
