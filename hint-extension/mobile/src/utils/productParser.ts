/**
 * Hint Mobile - Product URL Parser
 * Extracts product information from retailer URLs
 */

export interface ParsedProduct {
  name?: string;
  price?: number;
  imageUrl?: string;
  retailer: string;
}

/**
 * Parse a product URL and extract information
 * Note: Full parsing requires fetching the page, which we can't do from mobile
 * This provides basic retailer detection and URL normalization
 */
export async function parseProductUrl(url: string): Promise<ParsedProduct | null> {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');

    // Detect retailer from hostname
    const retailer = detectRetailer(hostname);
    if (!retailer) {
      return null;
    }

    // Basic product info from URL patterns
    const productInfo: ParsedProduct = {
      retailer,
    };

    // Try to extract product name from URL path
    const name = extractNameFromUrl(urlObj, retailer);
    if (name) {
      productInfo.name = name;
    }

    return productInfo;
  } catch (error) {
    console.error('Failed to parse product URL:', error);
    return null;
  }
}

/**
 * Detect retailer from hostname
 */
function detectRetailer(hostname: string): string | null {
  const retailers: Record<string, string> = {
    'amazon.com': 'Amazon',
    'target.com': 'Target',
    'walmart.com': 'Walmart',
    'bestbuy.com': 'Best Buy',
    'ebay.com': 'eBay',
    'etsy.com': 'Etsy',
    'homedepot.com': 'Home Depot',
    'wayfair.com': 'Wayfair',
    'costco.com': 'Costco',
    'nordstrom.com': 'Nordstrom',
    'macys.com': "Macy's",
    'kohls.com': "Kohl's",
    'rei.com': 'REI',
    'crateandbarrel.com': 'Crate & Barrel',
    'potterybarn.com': 'Pottery Barn',
    'nike.com': 'Nike',
    'adidas.com': 'Adidas',
    'patagonia.com': 'Patagonia',
    'williams-sonoma.com': 'Williams Sonoma',
    'hanes.com': 'Hanes',
  };

  for (const [domain, name] of Object.entries(retailers)) {
    if (hostname.endsWith(domain)) {
      return name;
    }
  }

  return null;
}

/**
 * Try to extract a product name from the URL path
 */
function extractNameFromUrl(url: URL, retailer: string): string | null {
  const path = url.pathname;

  // Amazon: /dp/ASIN/product-name or /gp/product/ASIN
  if (retailer === 'Amazon') {
    const match = path.match(/\/(?:dp|gp\/product)\/[A-Z0-9]+\/([^/?]+)/);
    if (match) {
      return formatProductName(match[1]);
    }
  }

  // Target: /p/product-name/-/A-12345678
  if (retailer === 'Target') {
    const match = path.match(/\/p\/([^/-]+)/);
    if (match) {
      return formatProductName(match[1]);
    }
  }

  // Walmart: /ip/product-name/12345678
  if (retailer === 'Walmart') {
    const match = path.match(/\/ip\/([^/]+)/);
    if (match) {
      return formatProductName(match[1]);
    }
  }

  // Best Buy: /site/product-name/1234567.p
  if (retailer === 'Best Buy') {
    const match = path.match(/\/site\/([^/]+)\/\d+\.p/);
    if (match) {
      return formatProductName(match[1]);
    }
  }

  // Generic: Try to get the last meaningful path segment
  const segments = path.split('/').filter((s) => s && !s.match(/^\d+$/));
  if (segments.length > 0) {
    return formatProductName(segments[segments.length - 1]);
  }

  return null;
}

/**
 * Format a URL slug into a readable product name
 */
function formatProductName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 100); // Limit length
}

/**
 * Normalize a product URL (remove tracking parameters, etc.)
 */
export function normalizeProductUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove common tracking parameters
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'tag',
      'linkCode',
      'ref_',
      'pf_rd_',
      'pd_rd_',
    ];

    trackingParams.forEach((param) => {
      urlObj.searchParams.delete(param);
      // Also remove params that start with these prefixes
      for (const key of urlObj.searchParams.keys()) {
        if (key.startsWith(param)) {
          urlObj.searchParams.delete(key);
        }
      }
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}
