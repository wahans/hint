/**
 * Hint Mobile - Scan Product Screen
 * Camera viewfinder for scanning product barcodes
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ListsScreenProps } from '../../navigation/types';
import BarcodeScanner from '../../components/BarcodeScanner';

export default function ScanProductScreen({ route, navigation }: ListsScreenProps<'ScanProduct'>) {
  const { listId } = route.params;

  const handleBarcodeScanned = (barcode: string, type: string) => {
    console.log('Scanned barcode:', barcode, 'Type:', type);

    // Navigate to AddProduct with the scanned barcode
    navigation.replace('AddProduct', {
      listId,
      barcode,
    });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
