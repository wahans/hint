/**
 * Hint - Product Service
 * Handles all product-related operations
 */

import type {
  Product,
  CreateProductData,
  UpdateProductData,
  PriceHistoryEntry,
  ApiResponse,
} from '../types/models';
import { getConfig } from '../config';
import { authService } from './auth.service';

class ProductService {
  private baseUrl = '/rest/v1/products';

  /**
   * Make authenticated request to Supabase
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T | null> {
    const config = getConfig();
    const token = authService.getAccessToken();

    if (!config || !token) {
      throw new Error('Not authenticated');
    }

    const headers: Record<string, string> = {
      'apikey': config.supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (method === 'POST') {
      headers['Prefer'] = 'return=representation';
    }

    const options: RequestInit = { method, headers };

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${config.supabaseUrl}${endpoint}`, options);

    if (response.status === 401) {
      const refreshed = await authService.refreshSession();
      if (refreshed) {
        return this.request(method, endpoint, body);
      }
      throw new Error('Session expired');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * Get all products for a list
   */
  async getProductsByListId(listId: string): Promise<ApiResponse<Product[]>> {
    try {
      const products = await this.request<Product[]>(
        'GET',
        `${this.baseUrl}?list_id=eq.${listId}&select=*&order=created_at.desc`
      );

      return { data: products || [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load products',
        },
      };
    }
  }

  /**
   * Get products for multiple lists (batch load)
   */
  async getProductsForLists(listIds: string[]): Promise<ApiResponse<Product[]>> {
    if (listIds.length === 0) {
      return { data: [] };
    }

    try {
      const products = await this.request<Product[]>(
        'GET',
        `${this.baseUrl}?list_id=in.(${listIds.join(',')})`
      );

      return { data: products || [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load products',
        },
      };
    }
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<ApiResponse<Product>> {
    try {
      const products = await this.request<Product[]>(
        'GET',
        `${this.baseUrl}?id=eq.${productId}&select=*`
      );

      if (!products || products.length === 0) {
        return { error: { code: 'NOT_FOUND', message: 'Product not found' } };
      }

      return { data: products[0] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load product',
        },
      };
    }
  }

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    try {
      const result = await this.request<Product[]>('POST', this.baseUrl, {
        list_id: data.list_id,
        name: data.name,
        url: data.url || null,
        image_url: data.image_url || null,
        current_price: data.current_price || null,
        target_price: data.target_price || null,
        in_stock: true,
      });

      if (!result || result.length === 0) {
        return { error: { code: 'CREATE_ERROR', message: 'Failed to create product' } };
      }

      return { data: result[0] };
    } catch (error) {
      return {
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create product',
        },
      };
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, data: UpdateProductData): Promise<ApiResponse<Product>> {
    try {
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      const response = await fetch(
        `${config.supabaseUrl}${this.baseUrl}?id=eq.${productId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            ...data,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (response.status === 401) {
        const refreshed = await authService.refreshSession();
        if (refreshed) {
          return this.updateProduct(productId, data);
        }
        return { error: { code: 'SESSION_EXPIRED', message: 'Session expired' } };
      }

      const result = await response.json();

      if (!result || result.length === 0) {
        return { error: { code: 'UPDATE_ERROR', message: 'Failed to update product' } };
      }

      return { data: result[0] };
    } catch (error) {
      return {
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update product',
        },
      };
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<ApiResponse<void>> {
    try {
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      const response = await fetch(
        `${config.supabaseUrl}${this.baseUrl}?id=eq.${productId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        const refreshed = await authService.refreshSession();
        if (refreshed) {
          return this.deleteProduct(productId);
        }
        return { error: { code: 'SESSION_EXPIRED', message: 'Session expired' } };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete product',
        },
      };
    }
  }

  /**
   * Update product price and stock status
   */
  async updatePrice(
    productId: string,
    price: number | null,
    inStock: boolean
  ): Promise<ApiResponse<Product>> {
    return this.updateProduct(productId, {
      current_price: price ?? undefined,
      in_stock: inStock,
    });
  }

  /**
   * Set price alert target
   */
  async setPriceAlert(productId: string, targetPrice: number | null): Promise<ApiResponse<Product>> {
    return this.updateProduct(productId, {
      target_price: targetPrice ?? undefined,
    });
  }

  /**
   * Check if price alert is triggered
   */
  isPriceAlertTriggered(product: Product): boolean {
    if (!product.target_price || !product.current_price) {
      return false;
    }
    return product.current_price <= product.target_price;
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(productId: string): Promise<ApiResponse<PriceHistoryEntry[]>> {
    try {
      const history = await this.request<PriceHistoryEntry[]>(
        'GET',
        `/rest/v1/price_history?product_id=eq.${productId}&order=checked_at.asc`
      );

      return { data: history || [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load price history',
        },
      };
    }
  }

  /**
   * Record a price check in history
   */
  async recordPriceCheck(
    productId: string,
    price: number,
    inStock: boolean
  ): Promise<ApiResponse<PriceHistoryEntry>> {
    try {
      const result = await this.request<PriceHistoryEntry[]>(
        'POST',
        '/rest/v1/price_history',
        {
          product_id: productId,
          price,
          in_stock: inStock,
          checked_at: new Date().toISOString(),
        }
      );

      if (!result || result.length === 0) {
        return { error: { code: 'CREATE_ERROR', message: 'Failed to record price' } };
      }

      return { data: result[0] };
    } catch (error) {
      return {
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to record price',
        },
      };
    }
  }

  /**
   * Get products with triggered price alerts
   */
  async getTriggeredAlerts(): Promise<ApiResponse<Product[]>> {
    try {
      const config = getConfig();
      const token = authService.getAccessToken();

      if (!config || !token) {
        return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
      }

      // Use the RPC function to check price alerts
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/rpc/check_price_alerts`,
        {
          method: 'POST',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      return { data: data || [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to check alerts',
        },
      };
    }
  }
}

// Export singleton instance
export const productService = new ProductService();
