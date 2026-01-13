/**
 * Hint Mobile - Share Sheet Handler
 * Handles incoming URLs shared from other apps
 */

import { Linking } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { parseProductUrl } from '../utils/productParser';
import { productService, listService } from '../../../shared/services';
import type { List } from '../../../shared/types';

export interface SharedProduct {
  url: string;
  name?: string;
  price?: number;
  imageUrl?: string;
  retailer?: string;
}

/**
 * Parse a shared URL and extract product information
 */
export async function handleSharedUrl(url: string): Promise<SharedProduct | null> {
  try {
    // Validate URL
    if (!url || !url.startsWith('http')) {
      return null;
    }

    // Parse the URL to extract product info
    const productInfo = await parseProductUrl(url);

    return {
      url,
      name: productInfo?.name,
      price: productInfo?.price,
      imageUrl: productInfo?.imageUrl,
      retailer: productInfo?.retailer,
    };
  } catch (error) {
    console.error('Failed to parse shared URL:', error);
    return { url };
  }
}

/**
 * Add a shared product to a list
 */
export async function addSharedProductToList(
  product: SharedProduct,
  listId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await productService.createProduct({
      list_id: listId,
      url: product.url,
      name: product.name || 'Product',
      current_price: product.price,
      image_url: product.imageUrl,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add product' };
  }
}

/**
 * Get user's lists for the share sheet list picker
 */
export async function getListsForPicker(): Promise<List[]> {
  try {
    const result = await listService.getMyLists();
    return result.data || [];
  } catch (error) {
    console.error('Failed to get lists for picker:', error);
    return [];
  }
}

/**
 * Set up URL listeners for deep linking
 */
export function setupDeepLinking(onUrl: (url: string) => void): () => void {
  // Handle URL when app is already open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    onUrl(url);
  });

  // Check for initial URL when app opens
  Linking.getInitialURL().then((url) => {
    if (url) {
      onUrl(url);
    }
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Check if URL is from a supported retailer
 */
export function isSupportedRetailer(url: string): boolean {
  const supportedDomains = [
    'amazon.com',
    'target.com',
    'walmart.com',
    'bestbuy.com',
    'ebay.com',
    'etsy.com',
    'homedepot.com',
    'wayfair.com',
    'costco.com',
    'nordstrom.com',
    'macys.com',
    'kohls.com',
    'rei.com',
    'crateandbarrel.com',
    'potterybarn.com',
    'nike.com',
    'adidas.com',
    'patagonia.com',
    'williams-sonoma.com',
    'hanes.com',
  ];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    return supportedDomains.some((domain) => hostname.endsWith(domain));
  } catch {
    return false;
  }
}
