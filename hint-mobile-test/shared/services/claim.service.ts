/**
 * Hint - Claim Service
 * Handles product claiming/unclaiming operations
 */

import type {
  Claim,
  ClaimProductData,
  ApiResponse,
  RpcResponse,
} from '../types/models';
import { getConfig } from '../config';
import { authService } from './auth.service';

class ClaimService {
  /**
   * Make RPC call to Supabase
   */
  private async rpc<T>(functionName: string, params: Record<string, any>): Promise<T> {
    const config = getConfig();
    const token = authService.getAccessToken();

    if (!config) {
      throw new Error('Not configured');
    }

    const headers: Record<string, string> = {
      'apikey': config.supabaseAnonKey,
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/rpc/${functionName}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      }
    );

    if (response.status === 401 && token) {
      const refreshed = await authService.refreshSession();
      if (refreshed) {
        return this.rpc(functionName, params);
      }
      throw new Error('Session expired');
    }

    const data = await response.json();
    return data;
  }

  /**
   * Claim a product (authenticated user)
   */
  async claimProduct(productId: string): Promise<ApiResponse<RpcResponse<void>>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      const result = await this.rpc<RpcResponse<void>>('claim_product', {
        product_id: productId,
        claimer_user_id: user.id,
      });

      if (!result.success) {
        return {
          error: {
            code: 'CLAIM_ERROR',
            message: result.error || 'Failed to claim product',
          },
        };
      }

      return { data: result };
    } catch (error) {
      return {
        error: {
          code: 'CLAIM_ERROR',
          message: error instanceof Error ? error.message : 'Failed to claim product',
        },
      };
    }
  }

  /**
   * Claim a product as a guest (no authentication required)
   */
  async claimProductAsGuest(
    productId: string,
    claimerName: string,
    claimerEmail?: string
  ): Promise<ApiResponse<RpcResponse<{ unclaim_token: string }>>> {
    try {
      const result = await this.rpc<RpcResponse<{ unclaim_token: string }>>(
        'claim_product_guest',
        {
          product_id: productId,
          claimer_name: claimerName,
          claimer_email: claimerEmail || null,
        }
      );

      if (!result.success) {
        return {
          error: {
            code: 'CLAIM_ERROR',
            message: result.error || 'Failed to claim product',
          },
        };
      }

      return { data: result };
    } catch (error) {
      return {
        error: {
          code: 'CLAIM_ERROR',
          message: error instanceof Error ? error.message : 'Failed to claim product',
        },
      };
    }
  }

  /**
   * Unclaim a product (authenticated user)
   */
  async unclaimProduct(productId: string): Promise<ApiResponse<RpcResponse<void>>> {
    try {
      const result = await this.rpc<RpcResponse<void>>('unclaim_product', {
        product_id: productId,
      });

      if (!result.success) {
        return {
          error: {
            code: 'UNCLAIM_ERROR',
            message: result.error || 'Failed to unclaim product',
          },
        };
      }

      return { data: result };
    } catch (error) {
      return {
        error: {
          code: 'UNCLAIM_ERROR',
          message: error instanceof Error ? error.message : 'Failed to unclaim product',
        },
      };
    }
  }

  /**
   * Unclaim a product as guest (using unclaim token)
   */
  async unclaimProductAsGuest(
    productId: string,
    unclaimToken: string
  ): Promise<ApiResponse<RpcResponse<void>>> {
    try {
      const result = await this.rpc<RpcResponse<void>>('unclaim_product_guest', {
        product_id: productId,
        unclaim_token: unclaimToken,
      });

      if (!result.success) {
        return {
          error: {
            code: 'UNCLAIM_ERROR',
            message: result.error || 'Failed to unclaim product',
          },
        };
      }

      return { data: result };
    } catch (error) {
      return {
        error: {
          code: 'UNCLAIM_ERROR',
          message: error instanceof Error ? error.message : 'Failed to unclaim product',
        },
      };
    }
  }

  /**
   * Get all products claimed by the current user
   */
  async getMyClaims(): Promise<ApiResponse<Claim[]>> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' } };
    }

    try {
      const claims = await this.rpc<Claim[]>('get_my_claimed_products', {});
      return { data: claims || [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load claims',
        },
      };
    }
  }

  /**
   * Get claims grouped by list
   */
  async getClaimsGroupedByList(): Promise<ApiResponse<Map<string, Claim[]>>> {
    const result = await this.getMyClaims();

    if (result.error) {
      return { error: result.error };
    }

    const grouped = new Map<string, Claim[]>();

    result.data?.forEach(claim => {
      const key = claim.list_name;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(claim);
    });

    return { data: grouped };
  }

  /**
   * Check if a product is claimed by the current user
   */
  async isClaimedByMe(productId: string): Promise<boolean> {
    const user = authService.getCurrentUser();
    if (!user) {
      return false;
    }

    const result = await this.getMyClaims();
    if (result.error || !result.data) {
      return false;
    }

    return result.data.some(claim => claim.product_id === productId);
  }

  /**
   * Get claim statistics for current user
   */
  async getClaimStats(): Promise<ApiResponse<{ totalClaimed: number; totalValue: number }>> {
    const result = await this.getMyClaims();

    if (result.error) {
      return { error: result.error };
    }

    const claims = result.data || [];
    const totalClaimed = claims.length;
    const totalValue = claims.reduce(
      (sum, claim) => sum + (claim.current_price || 0),
      0
    );

    return {
      data: { totalClaimed, totalValue },
    };
  }
}

// Export singleton instance
export const claimService = new ClaimService();
