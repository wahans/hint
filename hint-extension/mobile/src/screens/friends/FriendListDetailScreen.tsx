/**
 * Hint Mobile - Friend List Detail Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Snackbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import type { FriendsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { productService, claimService } from '../../../../shared/services';
import type { Product } from '../../../../shared/types';
import ProductCard from '../../components/ProductCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

export default function FriendListDetailScreen({
  route,
  navigation,
}: FriendsScreenProps<'FriendListDetail'>) {
  const { listId, listName, ownerName } = route.params;
  const { theme } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const loadProducts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const result = await productService.getProductsByListId(listId);
      if (result.data) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [listId])
  );

  const handleRefresh = () => loadProducts(true);

  const handleClaimToggle = async (product: Product) => {
    const isClaimed = !!product.claimed_by;

    try {
      if (isClaimed) {
        const result = await claimService.unclaimProduct(product.id);
        if (result.error) {
          setSnackbar({ visible: true, message: result.error.message });
          return;
        }
        setSnackbar({ visible: true, message: 'Item unclaimed' });
      } else {
        const result = await claimService.claimProduct(product.id);
        if (result.error) {
          setSnackbar({ visible: true, message: result.error.message });
          return;
        }
        setSnackbar({ visible: true, message: 'Item claimed! Others won\'t see this.' });
      }
      loadProducts(true);
    } catch (error: any) {
      setSnackbar({ visible: true, message: error.message || 'Failed to update claim' });
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      showClaimButton
      onClaimToggle={() => handleClaimToggle(item)}
      onPress={() => {
        // TODO: Navigate to product detail or open URL
      }}
    />
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSkeleton count={3} type="product" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {products.length === 0 ? (
        <EmptyState
          icon="gift-off"
          title="No items in this list"
          description={`${ownerName} hasn't added any items yet`}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
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

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
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
});
