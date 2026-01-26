/**
 * Hint Mobile - Add Product Screen
 * Manual entry form for adding products to a list
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, IconButton, Surface, Chip } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import type { ListsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { productService } from '../../../shared/services';

export default function AddProductScreen({ route, navigation }: ListsScreenProps<'AddProduct'>) {
  const { listId, barcode } = route.params;
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [price, setPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notes, setNotes] = useState(barcode || '');
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos to add product images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow camera access to take product photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleScanBarcode = () => {
    navigation.replace('ScanProduct', { listId });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a product name.');
      return;
    }

    setIsLoading(true);

    try {
      const priceNum = price ? parseFloat(price) : undefined;
      const targetPriceNum = targetPrice ? parseFloat(targetPrice) : undefined;

      const result = await productService.createProduct({
        list_id: listId,
        name: name.trim(),
        url: url.trim() || undefined,
        image_url: imageUri || undefined,
        current_price: priceNum,
        target_price: targetPriceNum,
      });

      if (result.error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', result.error.message);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate back to list detail
      navigation.navigate('ListDetail', { listId });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Barcode Info */}
        {barcode && (
          <Surface style={[styles.barcodeInfo, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
            <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              Barcode Scanned
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontFamily: 'monospace' }}>
              {barcode}
            </Text>
          </Surface>
        )}

        {/* Image Section */}
        <View style={styles.imageSection}>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.productImage} />
              <IconButton
                icon="close-circle"
                size={28}
                iconColor={theme.colors.error}
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              />
            </View>
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                Add Product Image
              </Text>
              <View style={styles.imageButtons}>
                <Button
                  mode="outlined"
                  icon="camera"
                  onPress={handleTakePhoto}
                  compact
                >
                  Camera
                </Button>
                <Button
                  mode="outlined"
                  icon="image"
                  onPress={handlePickImage}
                  compact
                >
                  Gallery
                </Button>
              </View>
            </View>
          )}
        </View>

        {/* Form Fields */}
        <TextInput
          label="Product Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., Sony WH-1000XM5 Headphones"
        />

        <TextInput
          label="Product URL"
          value={url}
          onChangeText={setUrl}
          mode="outlined"
          style={styles.input}
          placeholder="https://..."
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.priceRow}>
          <TextInput
            label="Current Price"
            value={price}
            onChangeText={setPrice}
            mode="outlined"
            style={styles.priceInput}
            placeholder="0.00"
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="$" />}
          />
          <TextInput
            label="Target Price"
            value={targetPrice}
            onChangeText={setTargetPrice}
            mode="outlined"
            style={styles.priceInput}
            placeholder="0.00"
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="$" />}
          />
        </View>

        {/* Scan Barcode Button */}
        {!barcode && (
          <Button
            mode="outlined"
            icon="barcode-scan"
            onPress={handleScanBarcode}
            style={styles.scanButton}
          >
            Scan Barcode
          </Button>
        )}

        {/* Notes/Barcode */}
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          style={styles.input}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={3}
        />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isLoading}
          disabled={isLoading || !name.trim()}
        >
          Add Product
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  barcodeInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    width: 160,
    height: 160,
    alignSelf: 'center',
  },
  productImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  imagePlaceholder: {
    height: 140,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  priceInput: {
    flex: 1,
  },
  scanButton: {
    marginBottom: 16,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
});
