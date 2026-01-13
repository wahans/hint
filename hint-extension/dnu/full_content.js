// Content script - runs on all pages
// Extracts product information from pages

// Product info extraction
function extractProductInfo() {
  const info = {
    title: document.title,
    url: window.location.href,
    price: null,
    image: null
  };
  
  // Try to extract price
  const priceSelectors = [
    '[itemprop="price"]',
    '[data-price]',
    '#priceblock_ourprice', // Amazon
    '#priceblock_dealprice', // Amazon
    '.price',
    '.product-price',
    '[class*="price" i]'
  ];
  
  for (const selector of priceSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = el.textContent || el.getAttribute('content') || el.getAttribute('data-price');
      if (text) {
        // Extract numeric price
        const match = text.match(/[\d,]+\.?\d*/);
        if (match) {
          info.price = parseFloat(match[0].replace(',', ''));
          break;
        }
      }
    }
  }
  
  // Try to extract main product image
  const imageSelectors = [
    '[itemprop="image"]',
    '#landingImage', // Amazon
    '.product-image img',
    '[class*="product" i] img',
    'meta[property="og:image"]'
  ];
  
  for (const selector of imageSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      info.image = el.src || el.content || el.getAttribute('data-src');
      if (info.image) break;
    }
  }
  
  return info;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProductInfo') {
    sendResponse(extractProductInfo());
  }
  return true;
});

// Future enhancement: Add floating "Add to SmartList" button on product pages
// This would detect product pages and show a convenient button to add items