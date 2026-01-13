// content.js - Content script for extracting prices from product pages
// This runs in the context of the web page

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPrice') {
    const priceData = extractPriceFromPage();
    sendResponse(priceData);
  }
  return true; // Keep the message channel open for async response
});

function extractPriceFromPage() {
  const url = window.location.href;
  let price = null;
  let inStock = true;
  
  // Parse a single price from text, extracting just the dollar amount
  function parseSinglePrice(text) {
    if (!text) return null;
    // Match a price pattern like $XX.XX or $X,XXX.XX
    const match = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (match) {
      const p = parseFloat(match[1].replace(/,/g, ''));
      if (p && p > 0 && p < 100000) {
        return Math.round(p * 100) / 100;
      }
    }
    return null;
  }
  
  // Check if an element or its parent has strikethrough styling (original/old price)
  function isStrikethrough(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.textDecoration.includes('line-through') || 
        style.textDecorationLine.includes('line-through')) {
      return true;
    }
    // Check parent too
    if (el.parentElement) {
      const parentStyle = window.getComputedStyle(el.parentElement);
      if (parentStyle.textDecoration.includes('line-through') || 
          parentStyle.textDecorationLine.includes('line-through')) {
        return true;
      }
    }
    // Check for common "was price" class names
    const className = (el.className + ' ' + (el.parentElement?.className || '')).toLowerCase();
    if (className.includes('was') || className.includes('original') || 
        className.includes('old') || className.includes('strike') ||
        className.includes('list-price') || className.includes('rrp')) {
      return true;
    }
    return false;
  }
  
  try {
    // Amazon - very specific selectors for current/sale price
    if (url.includes('amazon.com')) {
      const priceSelectors = [
        '.a-price:not(.a-text-price) .a-offscreen',
        '.apexPriceToPay .a-offscreen',
        '#corePrice_feature_div .a-price:not(.a-text-price) .a-offscreen',
        '.priceToPay .a-offscreen',
        '#priceblock_dealprice',
        '#priceblock_saleprice',
        '#priceblock_ourprice'
      ];
      
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
      inStock = !document.body.innerText.includes('Currently unavailable');
    }
    // Target
    else if (url.includes('target.com')) {
      // Method 1: Try JSON-LD schema first
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = data['@graph'] || (Array.isArray(data) ? data : [data]);
          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
              for (const offer of offers) {
                if (offer.price) {
                  price = parseFloat(offer.price);
                  if (price) break;
                }
              }
            }
            if (price) break;
          }
        } catch (e) {}
      }
      
      // Method 2: Look for price in various Target layouts
      if (!price) {
        const priceSelectors = [
          '[data-test="product-price"] span[data-test="current-price"]',
          '[data-test="product-price"] > span:first-child',
          'span[data-test="current-price"]',
          '[data-test="product-price"]',
          '[class*="CurrentPrice"]',
          '[class*="styles__CurrentPriceFontSize"]',
          '[class*="SalePrice"]',
          'div[data-test="product-price"] span',
          '[data-test="big-price"]'
        ];
        
        for (const sel of priceSelectors) {
          try {
            const el = document.querySelector(sel);
            if (el) {
              const text = el.textContent.trim();
              if (text.toLowerCase().includes('was') || 
                  text.toLowerCase().includes('reg') ||
                  text.toLowerCase().includes('original')) {
                continue;
              }
              const match = text.match(/\$\s*(\d+(?:\.\d{2})?)/);
              if (match) {
                const p = parseFloat(match[1]);
                if (p && p > 0 && p < 10000) {
                  price = p;
                  break;
                }
              }
            }
          } catch (e) {}
        }
      }
      
      // Method 3: Scan ALL elements for standalone price text
      if (!price) {
        const allPrices = [];
        const allElements = document.querySelectorAll('span, div, p');
        for (const el of allElements) {
          if (el.children.length === 0 || el.childNodes.length === 1) {
            const text = el.textContent.trim();
            if (/^\$\d+(\.\d{2})?$/.test(text)) {
              const style = window.getComputedStyle(el);
              const parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
              const isStruck = style.textDecoration.includes('line-through') || 
                              (parentStyle && parentStyle.textDecoration.includes('line-through'));
              if (!isStruck) {
                const p = parseFloat(text.replace('$', ''));
                if (p && p > 0) allPrices.push(p);
              }
            }
          }
        }
        if (allPrices.length > 0) {
          price = Math.min(...allPrices);
        }
      }
      
      inStock = !document.body.innerText.includes('Out of stock') && 
                !document.body.innerText.includes('Sold out');
    }
    // Walmart - handle multi-option pages
    else if (url.includes('walmart.com')) {
      const priceSelectors = [
        '[data-testid="price-wrap"] [itemprop="price"]',
        '.price-group [itemprop="price"]',
        '[itemprop="price"]',
        '[data-automation-id="product-price"] .f2',
        '.price-characteristic',
        '.inline-flex [itemprop="price"]',
        '.prod-PriceSection .price-main .visuallyhidden'
      ];
      
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const content = el.getAttribute('content');
          if (content) {
            const p = parseFloat(content);
            if (p && p > 0) { price = p; break; }
          }
          if (!isStrikethrough(el)) {
            const p = parseSinglePrice(el.textContent);
            if (p) { price = p; break; }
          }
        }
      }
      
      // Fallback: JSON-LD schema
      if (!price) {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data.offers?.price) {
              price = parseFloat(data.offers.price);
              break;
            } else if (data['@graph']) {
              for (const item of data['@graph']) {
                if (item.offers?.price) {
                  price = parseFloat(item.offers.price);
                  break;
                }
              }
            }
          } catch (e) {}
        }
      }
      
      inStock = !document.body.innerText.includes('Out of stock');
    }
    // Best Buy - enhanced extraction
    else if (url.includes('bestbuy.com')) {
      const selectors = [
        '.priceView-customer-price span[aria-hidden="true"]',
        '.priceView-customer-price span:first-child',
        '[data-testid="customer-price"] span:first-child',
        '.priceView-hero-price span:first-child',
        '[class*="priceView"] [class*="customer-price"]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
      // Fallback: JSON-LD
      if (!price) {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data['@type'] === 'Product' && data.offers) {
              const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
              price = parseFloat(offers[0]?.price);
              if (price) break;
            }
          } catch (e) {}
        }
      }
      inStock = !document.body.innerText.includes('Sold Out') &&
                !document.querySelector('[data-button-state="SOLD_OUT"]');
    }
    // eBay - enhanced extraction
    else if (url.includes('ebay.com')) {
      // Try itemprop price first
      const priceEl = document.querySelector('[itemprop="price"]');
      if (priceEl) {
        const content = priceEl.getAttribute('content');
        price = content ? parseFloat(content) : parseSinglePrice(priceEl.textContent);
      }
      // Fallback selectors
      if (!price) {
        const selectors = [
          '.x-price-primary span[itemprop="price"]',
          '.x-price-primary .ux-textspans',
          '[data-testid="x-price-primary"] span',
          '.vi-price .notranslate',
          '#prcIsum'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && !isStrikethrough(el)) {
            price = parseSinglePrice(el.textContent);
            if (price) break;
          }
        }
      }
      // Check for auction vs buy-it-now
      const binPrice = document.querySelector('[data-testid="x-bin-price"] span');
      if (binPrice) {
        const binP = parseSinglePrice(binPrice.textContent);
        if (binP) price = binP;
      }
    }
    // Etsy - enhanced extraction
    else if (url.includes('etsy.com')) {
      const selectors = [
        '[data-buy-box-region="price"] p[class*="Price"]',
        '[data-buy-box-region="price"] p',
        '.wt-text-title-03',
        '[data-selector="price-only"] p',
        '.wt-text-title-larger'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
      // Fallback: JSON-LD
      if (!price) {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data['@type'] === 'Product' && data.offers) {
              const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
              price = parseFloat(offers[0]?.price);
              if (price) break;
            }
          } catch (e) {}
        }
      }
    }
    // Home Depot
    else if (url.includes('homedepot.com')) {
      const selectors = [
        '[data-testid="price-format"] span.sui-font-bold',
        '.price-format__main-price',
        '[id*="price"] .price-format__large',
        '.price__dollars',
        '[data-automation-id="productPrice"]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
      // Combine dollars and cents if separate
      if (!price) {
        const dollars = document.querySelector('.price__dollars');
        const cents = document.querySelector('.price__cents');
        if (dollars) {
          const d = parseInt(dollars.textContent.replace(/\D/g, ''));
          const c = cents ? parseInt(cents.textContent.replace(/\D/g, '')) : 0;
          if (d > 0) price = d + (c / 100);
        }
      }
      // Fallback: JSON-LD
      if (!price) {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data['@type'] === 'Product' && data.offers) {
              const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
              price = parseFloat(offers[0]?.price);
              if (price) break;
            }
          } catch (e) {}
        }
      }
      inStock = !document.body.innerText.includes('Out of Stock') &&
                !document.body.innerText.includes('Unavailable');
    }
    // Wayfair
    else if (url.includes('wayfair.com')) {
      const selectors = [
        '[data-cypress-id="price-summary-current-price"]',
        '.SFPrice .SFPrice-module_currentPrice__H_SFM',
        '[class*="BasePriceBlock"] [class*="currentPrice"]',
        '.ProductDetailInfoBlock-module_price__1DLvG'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
      // Fallback: JSON-LD
      if (!price) {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data['@type'] === 'Product' && data.offers) {
              const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
              price = parseFloat(offers[0]?.price);
              if (price) break;
            }
          } catch (e) {}
        }
      }
      inStock = !document.body.innerText.includes('Out of Stock');
    }
    // Costco
    else if (url.includes('costco.com')) {
      const selectors = [
        '[automation-id="productPriceOutput"]',
        '.price-wrapper .price',
        '#pull-right-price span[class*="value"]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
    }
    // Nordstrom
    else if (url.includes('nordstrom.com')) {
      const selectors = [
        '[name="price"]',
        'span[itemprop="price"]',
        '[class*="Price"] span[class*="current"]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          const content = el.getAttribute('content');
          price = content ? parseFloat(content) : parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
    }
    // Macy's
    else if (url.includes('macys.com')) {
      const selectors = [
        '.price .lowest-sale-price',
        '[data-auto="product-price"] .lowest-sale-price',
        '.price .discount'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
    }
    // Kohl's
    else if (url.includes('kohls.com')) {
      const selectors = [
        '.prod_price_amount',
        '[class*="sale-price"]',
        '.pdpPage-price .sale'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
    }
    // REI
    else if (url.includes('rei.com')) {
      const selectors = [
        '[data-ui="sale-price"]',
        '.price-value',
        '#buy-box-product-price'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
    }
    // Crate & Barrel
    else if (url.includes('crateandbarrel.com')) {
      const el = document.querySelector('.price-current, [data-testid="price-current"]');
      if (el && !isStrikethrough(el)) {
        price = parseSinglePrice(el.textContent);
      }
    }
    // Pottery Barn
    else if (url.includes('potterybarn.com')) {
      const el = document.querySelector('.price-state--current .price-amount');
      if (el && !isStrikethrough(el)) {
        price = parseSinglePrice(el.textContent);
      }
    }
    // Nike
    else if (url.includes('nike.com')) {
      const selectors = [
        '[data-test="product-price"]',
        '.product-price',
        '[class*="productPrice"] [class*="currentPrice"]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !isStrikethrough(el)) {
          price = parseSinglePrice(el.textContent);
          if (price) break;
        }
      }
    }
    // Adidas
    else if (url.includes('adidas.com')) {
      const el = document.querySelector('[data-testid="product-price"], .gl-price-item');
      if (el && !isStrikethrough(el)) {
        price = parseSinglePrice(el.textContent);
      }
    }
    // Hanes - sale price is in the main product area only
    else if (url.includes('hanes.com')) {
      // First try JSON-LD schema - but get MAIN product only, not recommendations
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers) {
              const productUrl = item.url || item['@id'] || '';
              const currentPath = window.location.pathname;
              
              if (!price && (productUrl.includes(currentPath) || !productUrl || items.indexOf(item) === 0)) {
                const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
                if (offers[0]?.price) {
                  price = parseFloat(offers[0].price);
                  break;
                }
              }
            }
          }
          if (price) break;
        } catch (e) {}
      }
      
      // Fallback: Look in main product area only, exclude recommendations
      if (!price) {
        const mainProduct = document.querySelector('.product-detail, .pdp-main, #product-content, [data-component="product-detail"]') 
                           || document.querySelector('main') 
                           || document.body;
        
        const priceSelectors = [
          '.product-price .sales .value',
          '.price-sales .value', 
          '.sales-price',
          '.price .sale',
          '.product-price .value'
        ];
        
        for (const sel of priceSelectors) {
          const els = mainProduct.querySelectorAll(sel);
          for (const el of els) {
            if (el.closest('.recommendations, .complete-the-look, .carousel, .product-carousel, .slick-slider, .slick-track, [class*="recommend"], [class*="upsell"], [class*="cross-sell"], [class*="related"], [class*="also-like"]')) {
              continue;
            }
            if (!isStrikethrough(el)) {
              const content = el.getAttribute('content');
              if (content) {
                const p = parseFloat(content);
                if (p && p > 0) { price = p; break; }
              }
              const p = parseSinglePrice(el.textContent);
              if (p) { price = p; break; }
            }
          }
          if (price) break;
        }
      }
    }
    // Patagonia
    else if (url.includes('patagonia.com')) {
      const salePrice = document.querySelector('.price--sale, .sales-price');
      if (salePrice) {
        price = parseSinglePrice(salePrice.textContent);
      }
      if (!price) {
        const priceEl = document.querySelector('.price');
        if (priceEl && !isStrikethrough(priceEl)) {
          price = parseSinglePrice(priceEl.textContent);
        }
      }
    }
    // Williams Sonoma
    else if (url.includes('williams-sonoma.com')) {
      const salePrice = document.querySelector('.product-price .sale-price, .price-sale');
      if (salePrice) {
        price = parseSinglePrice(salePrice.textContent);
      }
      if (!price) {
        const priceEl = document.querySelector('.product-price');
        if (priceEl && !isStrikethrough(priceEl)) {
          price = parseSinglePrice(priceEl.textContent);
        }
      }
    }
    // Generic fallback - comprehensive extraction
    else {
      // 1. Try JSON-LD schema first (most reliable)
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          let data = JSON.parse(script.textContent);

          // Handle @graph arrays
          if (data['@graph']) {
            data = data['@graph'];
          }

          // Normalize to array
          const items = Array.isArray(data) ? data : [data];

          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
              for (const offer of offers) {
                // Prefer lowPrice for aggregates, otherwise use price
                const offerPrice = offer.lowPrice || offer.price;
                if (offerPrice) {
                  const p = parseFloat(offerPrice);
                  if (p > 0 && p < 100000) {
                    price = p;
                    // Check stock from schema
                    if (offer.availability) {
                      inStock = offer.availability.includes('InStock') ||
                                offer.availability.includes('PreOrder');
                    }
                    break;
                  }
                }
              }
            }
            if (price) break;
          }
        } catch (e) {}
        if (price) break;
      }

      // 2. Try Open Graph meta tags
      if (!price) {
        const ogPrice = document.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"]');
        if (ogPrice) {
          const p = parseFloat(ogPrice.getAttribute('content'));
          if (p > 0 && p < 100000) price = p;
        }
      }

      // 3. Try schema.org microdata
      if (!price) {
        const schemaPrice = document.querySelector('[itemprop="price"]');
        if (schemaPrice) {
          const content = schemaPrice.getAttribute('content');
          if (content) {
            price = parseFloat(content);
          } else if (!isStrikethrough(schemaPrice)) {
            price = parseSinglePrice(schemaPrice.textContent);
          }
        }
      }

      // 4. Look for sale/current price classes (prioritize sale prices)
      if (!price) {
        const saleSelectors = [
          '.sale-price', '.current-price', '.price--sale', '.price-sale',
          '.special-price', '.promo-price', '.discount-price', '.now-price',
          '[class*="salePrice"]', '[class*="currentPrice"]', '[class*="finalPrice"]'
        ];
        for (const sel of saleSelectors) {
          const el = document.querySelector(sel);
          if (el && !isStrikethrough(el)) {
            price = parseSinglePrice(el.textContent);
            if (price) break;
          }
        }
      }

      // 5. Generic price class, but skip strikethrough and "was" prices
      if (!price) {
        const priceEls = document.querySelectorAll('.price, .product-price, [class*="price"], [class*="Price"]');
        for (const el of priceEls) {
          // Skip if it's clearly an old/was price
          const classes = (el.className || '').toLowerCase();
          const text = (el.textContent || '').toLowerCase();
          if (classes.includes('was') || classes.includes('old') || classes.includes('original') ||
              classes.includes('compare') || classes.includes('regular') || classes.includes('list') ||
              text.includes('was') || text.includes('reg.') || text.includes('originally')) {
            continue;
          }
          if (!isStrikethrough(el)) {
            const p = parseSinglePrice(el.textContent);
            if (p) { price = p; break; }
          }
        }
      }

      // 6. Last resort: look for any price-like text in buy button area
      if (!price) {
        const buyArea = document.querySelector('[class*="buy"], [class*="add-to-cart"], [class*="addToCart"], [class*="purchase"]');
        if (buyArea) {
          const priceMatch = buyArea.textContent.match(/\$\s*(\d+(?:\.\d{2})?)/);
          if (priceMatch) {
            const p = parseFloat(priceMatch[1]);
            if (p > 0 && p < 100000) price = p;
          }
        }
      }
    }
  } catch (error) {
    console.log('Price extraction error:', error);
  }
  
  return { price, inStock };
}