/**
 * Hint Mobile - List Detail Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Linking, Alert } from 'react-native';
import { Text, IconButton, Menu, Divider, Portal, Modal, Button } from 'react-native-paper';
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);

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
      title: listName,
      headerRight: () => (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
              style={styles.headerMenuButton}
            />
          }
          anchorPosition="bottom"
        >
          <Menu.Item
            leadingIcon="pencil"
            onPress={() => {
              setMenuVisible(false);
              Alert.alert('Edit List', 'Edit list functionality coming soon');
            }}
            title="Edit List"
          />
          <Menu.Item
            leadingIcon="share-variant"
            onPress={() => {
              setMenuVisible(false);
              Alert.alert('Share List', 'Share list functionality coming soon');
            }}
            title="Share List"
          />
          <Divider />
          <Menu.Item
            leadingIcon="delete"
            onPress={() => {
              setMenuVisible(false);
              Alert.alert(
                'Delete List',
                'Are you sure you want to delete this list?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => {} },
                ]
              );
            }}
            title="Delete List"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      ),
    });
  }, [navigation, menuVisible, listName]);

  const handleRefresh = () => loadProducts(true);

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setProductModalVisible(true);
  };

  const handleOpenUrl = async () => {
    if (selectedProduct?.url) {
      await Linking.openURL(selectedProduct.url);
      setProductModalVisible(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
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

      {/* Product Detail Modal */}
      <Portal>
        <Modal
          visible={productModalVisible}
          onDismiss={() => setProductModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          {selectedProduct && (
            <View>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {selectedProduct.name}
              </Text>

              {selectedProduct.current_price && (
                <Text variant="headlineMedium" style={{ color: theme.colors.primary, marginBottom: 8 }}>
                  ${selectedProduct.current_price.toFixed(2)}
                </Text>
              )}

              {selectedProduct.url && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                  {new URL(selectedProduct.url).hostname.replace('www.', '')}
                </Text>
              )}

              <View style={styles.modalActions}>
                {selectedProduct.url && (
                  <Button
                    mode="contained"
                    icon="open-in-new"
                    onPress={handleOpenUrl}
                    style={styles.modalButton}
                  >
                    Open in Browser
                  </Button>
                )}
                <Button
                  mode="outlined"
                  icon="close"
                  onPress={() => setProductModalVisible(false)}
                  style={styles.modalButton}
                >
                  Close
                </Button>
              </View>
            </View>
          )}
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
  },
  headerMenuButton: {
    marginRight: 4,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 12,
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    marginTop: 4,
  },
});
