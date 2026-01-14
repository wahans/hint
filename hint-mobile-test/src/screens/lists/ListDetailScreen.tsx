/**
 * Hint Mobile - List Detail Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Linking, Alert, Image, Share, Clipboard } from 'react-native';
import { Text, IconButton, Portal, Modal, Button, Surface, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import type { ListsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { productService, claimService, listService } from '../../../shared/services';
import type { Product, List } from '../../../shared/types';
import ProductCard from '../../components/ProductCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

export default function ListDetailScreen({ route, navigation }: ListsScreenProps<'ListDetail'>) {
  const { listId, listName } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [listData, setListData] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const loadProducts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [productsResult, listResult] = await Promise.all([
        productService.getProductsByListId(listId),
        listService.getList(listId),
      ]);
      if (productsResult.data) {
        setProducts(productsResult.data);
      }
      if (listResult.data) {
        setListData(listResult.data);
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
        <View style={styles.headerButtons}>
          <IconButton
            icon="share-variant"
            onPress={() => setShareModalVisible(true)}
          />
          <IconButton
            icon="pencil"
            onPress={() => navigation.navigate('EditList', { listId })}
          />
        </View>
      ),
    });
  }, [navigation, listName, listId]);

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

  const handleClaimProduct = async () => {
    if (!selectedProduct) return;

    // Check if already claimed
    if (selectedProduct.claimed_by || selectedProduct.guest_claimer_name) {
      Alert.alert('Already Claimed', 'This item has already been claimed by someone.');
      return;
    }

    setIsClaiming(true);
    try {
      const result = await claimService.claimProduct(selectedProduct.id);
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        Alert.alert('Success', 'You have claimed this item!', [
          {
            text: 'OK',
            onPress: () => {
              setProductModalVisible(false);
              loadProducts(true); // Refresh to show claim status
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to claim item. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleShareList = async () => {
    const shareCode = listData?.share_code || listData?.access_code;
    const shareUrl = `https://hint.com/list/${shareCode}`;

    try {
      await Share.share({
        message: `Check out my wishlist "${listName}" on Hint!\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handleCopyShareCode = () => {
    const shareCode = listData?.share_code || listData?.access_code;
    if (shareCode) {
      Clipboard.setString(shareCode);
      Alert.alert('Copied!', 'Share code copied to clipboard');
    }
  };

  const handleCopyShareLink = () => {
    const shareCode = listData?.share_code || listData?.access_code;
    const shareUrl = `https://hint.com/list/${shareCode}`;
    Clipboard.setString(shareUrl);
    Alert.alert('Copied!', 'Share link copied to clipboard');
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
              {/* Product Image */}
              {selectedProduct.image_url && (
                <Image
                  source={{ uri: selectedProduct.image_url }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}

              <Text variant="titleLarge" style={styles.modalTitle}>
                {selectedProduct.name}
              </Text>

              {selectedProduct.current_price && (
                <Text variant="headlineMedium" style={{ color: theme.colors.primary, marginBottom: 8 }}>
                  ${selectedProduct.current_price.toFixed(2)}
                </Text>
              )}

              {selectedProduct.url && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                  {new URL(selectedProduct.url).hostname.replace('www.', '')}
                </Text>
              )}

              {/* Claim Status */}
              {(selectedProduct.claimed_by || selectedProduct.guest_claimer_name) && (
                <View style={[styles.claimedBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                    ✓ Claimed{selectedProduct.guest_claimer_name ? ` by ${selectedProduct.guest_claimer_name}` : ''}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                {/* Claim Button - only show if not already claimed and user is logged in */}
                {!selectedProduct.claimed_by && !selectedProduct.guest_claimer_name && user && (
                  <Button
                    mode="contained"
                    icon="gift"
                    onPress={handleClaimProduct}
                    loading={isClaiming}
                    disabled={isClaiming}
                  >
                    Mark as Claimed
                  </Button>
                )}

                {selectedProduct.url && (
                  <Button
                    mode={selectedProduct.claimed_by || selectedProduct.guest_claimer_name ? "contained" : "outlined"}
                    icon="open-in-new"
                    onPress={handleOpenUrl}
                  >
                    Open in Browser
                  </Button>
                )}
              </View>

              <Button
                mode="text"
                onPress={() => setProductModalVisible(false)}
                style={styles.closeButton}
              >
                Close
              </Button>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Share List Modal */}
      <Portal>
        <Modal
          visible={shareModalVisible}
          onDismiss={() => setShareModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Share List
          </Text>

          {listData?.share_code || listData?.access_code ? (
            <View>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                Share this code with friends so they can view your wishlist
              </Text>

              <Surface style={[styles.shareCodeBox, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                <Text variant="headlineMedium" style={[styles.shareCodeText, { color: theme.colors.onPrimaryContainer }]}>
                  {listData?.share_code || listData?.access_code}
                </Text>
              </Surface>

              <View style={styles.shareActions}>
                <Button
                  mode="contained"
                  icon="share"
                  onPress={handleShareList}
                  style={styles.shareButton}
                >
                  Share Link
                </Button>

                <View style={styles.shareRow}>
                  <Button
                    mode="outlined"
                    icon="content-copy"
                    onPress={handleCopyShareCode}
                    style={styles.shareHalfButton}
                  >
                    Copy Code
                  </Button>
                  <Button
                    mode="outlined"
                    icon="link"
                    onPress={handleCopyShareLink}
                    style={styles.shareHalfButton}
                  >
                    Copy Link
                  </Button>
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                This list is private. Make it public to share with others.
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  setShareModalVisible(false);
                  navigation.navigate('EditList', { listId });
                }}
              >
                Edit List Settings
              </Button>
            </View>
          )}

          <Divider style={styles.modalDivider} />

          <Button
            mode="text"
            onPress={() => setShareModalVisible(false)}
          >
            Close
          </Button>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  modalTitle: {
    marginBottom: 12,
  },
  claimedBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  modalDivider: {
    marginVertical: 16,
  },
  closeButton: {
    marginTop: 24,
  },
  shareCodeBox: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  shareCodeText: {
    fontWeight: '700',
    letterSpacing: 4,
  },
  shareActions: {
    gap: 12,
  },
  shareButton: {
    marginBottom: 4,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shareHalfButton: {
    flex: 1,
  },
});
