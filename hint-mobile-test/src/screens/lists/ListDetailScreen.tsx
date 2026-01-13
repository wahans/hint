/**
 * Hint Mobile - List Detail Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, IconButton, Menu, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import type { ListsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { productService } from '../../../shared/services';
import type { Product } from '../../../shared/types';
import ProductCard from '../../components/ProductCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

export default function ListDetailScreen({ route, navigation }: ListsScreenProps<'ListDetail'>) {
  const { listId, listName } = route.params;
  const { theme } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

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

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            leadingIcon="pencil"
            onPress={() => {
              setMenuVisible(false);
              // TODO: Edit list
            }}
            title="Edit List"
          />
          <Menu.Item
            leadingIcon="share-variant"
            onPress={() => {
              setMenuVisible(false);
              // TODO: Share list
            }}
            title="Share List"
          />
          <Divider />
          <Menu.Item
            leadingIcon="delete"
            onPress={() => {
              setMenuVisible(false);
              // TODO: Delete list
            }}
            title="Delete List"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      ),
    });
  }, [navigation, menuVisible]);

  const handleRefresh = () => loadProducts(true);

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => {
        // TODO: Navigate to product detail
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
          icon="gift"
          title="No items yet"
          description="Add products to this list using the share button in your browser"
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
