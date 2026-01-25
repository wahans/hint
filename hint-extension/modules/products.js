// Products module - Product CRUD, price tracking, charts
import * as state from './state.js';
import * as api from './api.js';
import * as ui from './ui.js';
import { awardPoints } from './leaderboard.js';

// Auto-fill product form with current page data
export async function autoFillCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) return;

    const url = tab.url;
    const title = tab.title || '';

    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return;
    }

    document.getElementById('productUrl').value = url;

    if (title && !document.getElementById('productName').value) {
      document.getElementById('productName').value = title;
    }

    // Try to extract price from the page
    try {
      const priceData = await chrome.tabs.sendMessage(tab.id, { action: 'extractPrice' });
      if (priceData && priceData.price) {
        window.extractedPrice = priceData.price;
        window.extractedInStock = priceData.inStock;

        const pricePreview = document.getElementById('pricePreview');
        if (pricePreview) {
          pricePreview.textContent = `Detected price: $${priceData.price}`;
          pricePreview.style.display = 'block';
        }
      }
    } catch (priceError) {
      console.log('Price extraction not available:', priceError.message);
      window.extractedPrice = null;
      window.extractedInStock = null;
    }
  } catch (error) {
    // Ignore errors on restricted pages
  }
}

// Load user data (re-export for convenience)
export { loadUserData, updateListsDropdown } from './lists.js';

// Create product preview dots for collapsed lists
export function createProductPreview(products, maxDots = 5) {
  const preview = document.createElement('div');
  preview.className = 'list-products-preview';

  const displayCount = Math.min(products.length, maxDots);
  for (let i = 0; i < displayCount; i++) {
    const dot = document.createElement('span');
    dot.className = 'preview-dot';
    if (products[i].claimed_by) {
      dot.classList.add('claimed');
    }
    preview.appendChild(dot);
  }

  if (products.length > maxDots) {
    const more = document.createElement('span');
    more.className = 'preview-more';
    more.textContent = `+${products.length - maxDots} more`;
    preview.appendChild(more);
  }

  return preview;
}

// Display products in a container
export function displayProducts(products, container, list) {
  container.innerHTML = '';

  products.forEach(product => {
    const productDiv = document.createElement('div');
    productDiv.className = 'product-item';

    // Thumbnail
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'product-thumbnail';
    if (product.image_url) {
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = product.name;
      img.onerror = () => {
        thumbnailDiv.innerHTML = '<div class="product-thumbnail-placeholder">📦</div>';
      };
      thumbnailDiv.appendChild(img);
    } else {
      thumbnailDiv.innerHTML = '<div class="product-thumbnail-placeholder">📦</div>';
    }
    productDiv.appendChild(thumbnailDiv);

    // Product details container
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'product-details';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'product-name';
    nameDiv.textContent = product.name;
    detailsDiv.appendChild(nameDiv);

    // Price with trend indicator
    if (product.current_price) {
      const priceContainer = document.createElement('div');
      priceContainer.style.display = 'flex';
      priceContainer.style.alignItems = 'center';
      priceContainer.style.gap = '8px';
      priceContainer.style.marginBottom = '4px';
      priceContainer.style.flexWrap = 'wrap';

      const currentPrice = parseFloat(product.current_price);
      const targetPrice = product.target_price ? parseFloat(product.target_price) : null;
      const hasAlert = targetPrice && targetPrice > 0;
      const isPriceDrop = hasAlert && currentPrice <= targetPrice;

      const priceDiv = document.createElement('span');
      priceDiv.className = 'product-meta product-price-display';
      priceDiv.style.fontWeight = '600';
      priceDiv.style.fontSize = '14px';
      priceDiv.style.color = isPriceDrop ? 'var(--success-text)' : 'var(--green-primary)';
      priceDiv.textContent = `$${product.current_price}`;
      priceContainer.appendChild(priceDiv);

      if (isPriceDrop) {
        const dropBadge = document.createElement('span');
        dropBadge.style.cssText = `
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; font-size: 10px; font-weight: 600;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white; border-radius: 10px;
          animation: pricePulse 2s ease-in-out infinite;
        `;
        dropBadge.textContent = '🎉 PRICE DROP!';
        dropBadge.title = `Target: $${targetPrice.toFixed(2)} - Now: $${currentPrice.toFixed(2)}`;
        priceContainer.appendChild(dropBadge);
      } else if (hasAlert) {
        const alertBadge = document.createElement('span');
        alertBadge.style.cssText = `
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 6px; font-size: 10px;
          background: var(--bg-tertiary); color: var(--text-secondary);
          border-radius: 10px; border: 1px solid var(--border-color);
        `;
        alertBadge.textContent = `🔔 $${targetPrice.toFixed(2)}`;
        alertBadge.title = `Alert when price drops to $${targetPrice.toFixed(2)}`;
        priceContainer.appendChild(alertBadge);
      }

      // Price history button
      const historyBtn = document.createElement('button');
      historyBtn.className = 'btn-tiny';
      historyBtn.style.padding = '2px 6px';
      historyBtn.style.fontSize = '10px';
      historyBtn.style.background = 'var(--bg-tertiary)';
      historyBtn.style.color = 'var(--text-secondary)';
      historyBtn.style.border = '1px solid var(--border-color)';
      historyBtn.textContent = '📈';
      historyBtn.title = 'View price history';
      historyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPriceHistory(product);
      });
      priceContainer.appendChild(historyBtn);

      detailsDiv.appendChild(priceContainer);
    }

    // Stock status indicator
    if (product.in_stock === false) {
      const stockDiv = document.createElement('div');
      stockDiv.style.display = 'inline-block';
      stockDiv.style.padding = '2px 8px';
      stockDiv.style.fontSize = '10px';
      stockDiv.style.fontWeight = '600';
      stockDiv.style.borderRadius = '4px';
      stockDiv.style.marginBottom = '4px';
      stockDiv.style.background = 'var(--error-bg)';
      stockDiv.style.color = 'var(--error-text)';
      stockDiv.textContent = '⚠️ Out of Stock';
      detailsDiv.appendChild(stockDiv);
    }

    if (product.url) {
      const urlDiv = document.createElement('div');
      urlDiv.className = 'product-url';
      urlDiv.textContent = product.url;
      detailsDiv.appendChild(urlDiv);
    }

    const productActionsDiv = document.createElement('div');
    productActionsDiv.className = 'product-actions';

    if (product.url) {
      const visitBtn = document.createElement('button');
      visitBtn.className = 'btn-icon';
      visitBtn.textContent = '🔗';
      visitBtn.setAttribute('data-tooltip', 'Visit page');
      visitBtn.addEventListener('click', () => window.open(product.url, '_blank'));
      productActionsDiv.appendChild(visitBtn);
    }

    // Refresh price button
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn-icon secondary';
    refreshBtn.textContent = '🔄';
    refreshBtn.setAttribute('data-tooltip', 'Refresh price');
    refreshBtn.addEventListener('click', () => refreshProductPrice(product, refreshBtn));
    productActionsDiv.appendChild(refreshBtn);

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon secondary';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('data-tooltip', 'Edit');
    editBtn.addEventListener('click', () => editProduct(product));
    productActionsDiv.appendChild(editBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon secondary danger';
    deleteBtn.textContent = '🗑️';
    deleteBtn.setAttribute('data-tooltip', 'Delete');
    deleteBtn.addEventListener('click', () => deleteProduct(product.id, product.name));
    productActionsDiv.appendChild(deleteBtn);

    detailsDiv.appendChild(productActionsDiv);
    productDiv.appendChild(detailsDiv);
    container.appendChild(productDiv);
  });
}

// Add a new product
export async function addProduct() {
  const listId = document.getElementById('listSelect').value;
  const name = document.getElementById('productName').value.trim();
  const url = document.getElementById('productUrl').value.trim();

  if (!listId) {
    ui.showMessage('addMessage', 'Please select a list', 'error');
    return;
  }

  if (!name) {
    ui.showMessage('addMessage', 'Please enter a product name', 'error');
    return;
  }

  try {
    const productData = {
      list_id: listId,
      name,
      url: url || null,
      current_price: window.extractedPrice || null,
      in_stock: window.extractedInStock !== false
    };

    await api.supabaseRequest('POST', '/rest/v1/products', productData);

    // Award points for adding product
    await awardPoints('add_product', 1, `Added ${name}`, null, listId);

    // Clear form
    document.getElementById('productName').value = '';
    document.getElementById('productUrl').value = '';
    window.extractedPrice = null;
    window.extractedInStock = null;
    const pricePreview = document.getElementById('pricePreview');
    if (pricePreview) pricePreview.style.display = 'none';

    // Reload data
    const { loadUserData } = await import('./lists.js');
    await loadUserData();
    ui.showMessage('addMessage', 'Product added!', 'success');
  } catch (error) {
    ui.showMessage('addMessage', 'Error adding product', 'error');
  }
}

// Delete a product
export async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;

  try {
    await api.supabaseRequest('DELETE', `/rest/v1/products?id=eq.${id}`);
    const { loadUserData } = await import('./lists.js');
    await loadUserData();
    ui.showMessage('addMessage', 'Product deleted', 'success');
  } catch (error) {
    ui.showMessage('addMessage', 'Error deleting product', 'error');
  }
}

// Edit a product
export function editProduct(product) {
  const targetPriceValue = product.target_price ? parseFloat(product.target_price).toFixed(2) : '';

  ui.showCustomModal(
    '✏️ Edit Product',
    `
      <div class="settings-item">
        <label class="settings-label">Name</label>
        <input type="text" id="editProductName" class="modal-input" value="${product.name || ''}">
      </div>
      <div class="settings-item">
        <label class="settings-label">URL</label>
        <input type="text" id="editProductUrl" class="modal-input" value="${product.url || ''}">
      </div>
      <div class="settings-item">
        <label class="settings-label">Current Price</label>
        <input type="number" id="editProductPrice" class="modal-input" step="0.01" value="${product.current_price || ''}">
      </div>
      <div class="settings-item">
        <label class="settings-label">Price Alert Target</label>
        <input type="number" id="editProductTarget" class="modal-input" step="0.01" placeholder="Alert me when price drops to..." value="${targetPriceValue}">
        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
          Leave empty for no price alert
        </div>
      </div>
    `,
    async () => {
      const name = document.getElementById('editProductName').value.trim();
      const url = document.getElementById('editProductUrl').value.trim();
      const price = document.getElementById('editProductPrice').value;
      const targetPrice = document.getElementById('editProductTarget').value;

      if (!name) {
        ui.showMessage('addMessage', 'Name is required', 'error');
        return;
      }

      try {
        await api.supabaseRequest('PATCH', `/rest/v1/products?id=eq.${product.id}`, {
          name,
          url: url || null,
          current_price: price ? parseFloat(price) : null,
          target_price: targetPrice ? parseFloat(targetPrice) : null
        });

        ui.hideModal();
        const { loadUserData } = await import('./lists.js');
        await loadUserData();
        ui.showMessage('addMessage', 'Product updated!', 'success');
      } catch (error) {
        ui.showMessage('addMessage', 'Error updating product', 'error');
      }
    }
  );
}

// Refresh product price
export async function refreshProductPrice(product, button) {
  if (!product.url) {
    ui.showMessage('addMessage', 'No URL to refresh', 'error');
    return;
  }

  const originalText = button.textContent;
  button.textContent = '⏳';
  button.disabled = true;

  try {
    // Open the URL in a background tab and extract price
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // We'll use the content script approach
    const newTab = await chrome.tabs.create({
      url: product.url,
      active: false
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const priceData = await chrome.tabs.sendMessage(newTab.id, { action: 'extractPrice' });

      if (priceData && priceData.price) {
        await api.supabaseRequest('PATCH', `/rest/v1/products?id=eq.${product.id}`, {
          current_price: priceData.price,
          in_stock: priceData.inStock !== false,
          price_updated_at: new Date().toISOString()
        });

        // Check for price drop alert
        if (product.target_price && priceData.price <= parseFloat(product.target_price)) {
          showPriceDropAlert(product, priceData.price, parseFloat(product.target_price));
        }

        const { loadUserData } = await import('./lists.js');
        await loadUserData();
        ui.showMessage('addMessage', `Price updated: $${priceData.price}`, 'success');
      }
    } finally {
      // Close the background tab
      chrome.tabs.remove(newTab.id);
    }
  } catch (error) {
    ui.showMessage('addMessage', 'Error refreshing price', 'error');
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
}

// Show price history modal
export async function showPriceHistory(product) {
  const modalContent = `
    <div class="modal-header">📈 Price History: ${product.name.substring(0, 30)}${product.name.length > 30 ? '...' : ''}</div>
    <div class="modal-body">
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button class="btn-small history-filter active" data-days="7">7 Days</button>
        <button class="btn-small history-filter secondary" data-days="30">30 Days</button>
        <button class="btn-small history-filter secondary" data-days="90">90 Days</button>
        <button class="btn-small history-filter secondary" data-days="all">All</button>
      </div>
      <div id="priceChartContainer" style="height: 200px; background: var(--bg-tertiary); border-radius: 8px; padding: 16px; display: flex; align-items: center; justify-content: center;">
        <div class="loading">Loading history...</div>
      </div>
      <div id="priceStats" style="margin-top: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
      </div>
    </div>
    <div class="modal-buttons">
      <button id="closePriceHistoryBtn" class="secondary">Close</button>
    </div>
  `;

  document.getElementById('modalContent').innerHTML = modalContent;
  document.getElementById('modalOverlay').classList.add('show');

  document.getElementById('closePriceHistoryBtn').addEventListener('click', ui.hideModal);

  // Store product for filter clicks
  window.currentPriceHistoryProduct = product;

  // Add filter listeners
  document.querySelectorAll('.history-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.history-filter').forEach(b => {
        b.classList.remove('active');
        b.classList.add('secondary');
      });
      btn.classList.add('active');
      btn.classList.remove('secondary');
      filterPriceHistory(btn.dataset.days);
    });
  });

  // Load initial data
  await filterPriceHistory(7);
}

// Filter price history by days
async function filterPriceHistory(days) {
  const container = document.getElementById('priceChartContainer');
  const statsContainer = document.getElementById('priceStats');
  const product = window.currentPriceHistoryProduct;

  container.innerHTML = '<div class="loading">Loading...</div>';

  try {
    let endpoint = `/rest/v1/price_history?product_id=eq.${product.id}&order=recorded_at.desc`;

    if (days !== 'all') {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days));
      endpoint += `&recorded_at=gte.${date.toISOString()}`;
    }

    const history = await api.supabaseRequest('GET', endpoint);

    if (!history || history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary);">
          <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
          <div>No price history yet</div>
          <div style="font-size: 12px; margin-top: 4px;">Prices are tracked when you refresh</div>
        </div>
      `;
      statsContainer.innerHTML = '';
      return;
    }

    // Calculate stats
    const prices = history.map(h => parseFloat(h.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const currentPrice = parseFloat(product.current_price) || prices[0];

    statsContainer.innerHTML = `
      <div style="text-align: center; padding: 8px; background: var(--bg-tertiary); border-radius: 6px;">
        <div style="font-size: 11px; color: var(--text-secondary);">Current</div>
        <div style="font-size: 16px; font-weight: 600; color: var(--green-primary);">$${currentPrice.toFixed(2)}</div>
      </div>
      <div style="text-align: center; padding: 8px; background: var(--bg-tertiary); border-radius: 6px;">
        <div style="font-size: 11px; color: var(--text-secondary);">Lowest</div>
        <div style="font-size: 16px; font-weight: 600; color: var(--success-text);">$${minPrice.toFixed(2)}</div>
      </div>
      <div style="text-align: center; padding: 8px; background: var(--bg-tertiary); border-radius: 6px;">
        <div style="font-size: 11px; color: var(--text-secondary);">Highest</div>
        <div style="font-size: 16px; font-weight: 600; color: var(--error-text);">$${maxPrice.toFixed(2)}</div>
      </div>
    `;

    // Draw simple chart
    drawPriceChart(history, container);
  } catch (error) {
    container.innerHTML = '<div style="text-align: center; color: var(--error-text);">Error loading history</div>';
  }
}

// Draw an enhanced price chart with tooltips, grid, and animations
function drawPriceChart(history, container) {
  const prices = history.map(h => parseFloat(h.price)).reverse();
  const dates = history.map(h => new Date(h.recorded_at)).reverse();

  if (prices.length < 2) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary);">
        <div>Only ${prices.length} data point(s)</div>
        <div style="font-size: 12px; margin-top: 4px;">Need more data for a chart</div>
      </div>
    `;
    return;
  }

  // Chart dimensions with padding for Y-axis labels
  const yAxisWidth = 45;
  const totalWidth = container.clientWidth - 16;
  const width = totalWidth - yAxisWidth;
  const height = 140;
  const padding = { top: 10, bottom: 25 };
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate price range with buffer
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceBuffer = (maxPrice - minPrice) * 0.1 || maxPrice * 0.05;
  const yMin = Math.max(0, minPrice - priceBuffer);
  const yMax = maxPrice + priceBuffer;
  const range = yMax - yMin || 1;

  // Calculate nice Y-axis tick values
  const numTicks = 4;
  const tickStep = range / (numTicks - 1);
  const yTicks = [];
  for (let i = 0; i < numTicks; i++) {
    yTicks.push(yMin + tickStep * i);
  }

  // Create data points
  const dataPoints = prices.map((price, i) => {
    const x = yAxisWidth + (i / (prices.length - 1)) * width;
    const y = padding.top + chartHeight - ((price - yMin) / range) * chartHeight;
    return { x, y, price, date: dates[i] };
  });

  // Build polyline points string
  const linePoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Build polygon points for gradient fill
  const fillPoints = `${yAxisWidth},${padding.top + chartHeight} ${linePoints} ${yAxisWidth + width},${padding.top + chartHeight}`;

  // Calculate total line length for animation
  let totalLength = 0;
  for (let i = 1; i < dataPoints.length; i++) {
    const dx = dataPoints[i].x - dataPoints[i-1].x;
    const dy = dataPoints[i].y - dataPoints[i-1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  // Format dates for X-axis
  const formatDate = (d) => {
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
  };

  // Build SVG
  const uniqueId = `chart-${Date.now()}`;

  container.innerHTML = `
    <style>
      @keyframes ${uniqueId}-drawLine {
        to { stroke-dashoffset: 0; }
      }
      @keyframes ${uniqueId}-fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes ${uniqueId}-pointPop {
        0% { transform: scale(0); opacity: 0; }
        70% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      .${uniqueId}-point {
        cursor: pointer;
        transition: r 0.15s ease, fill 0.15s ease;
      }
      .${uniqueId}-point:hover {
        r: 6;
        fill: var(--green-dark);
      }
      .${uniqueId}-tooltip {
        position: absolute;
        background: var(--text-primary);
        color: var(--bg-secondary);
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 500;
        pointer-events: none;
        opacity: 0;
        transform: translateX(-50%) translateY(-8px);
        transition: opacity 0.15s ease, transform 0.15s ease;
        white-space: nowrap;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      .${uniqueId}-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: var(--text-primary);
      }
      .${uniqueId}-tooltip.show {
        opacity: 1;
        transform: translateX(-50%) translateY(-12px);
      }
    </style>
    <div style="position: relative;">
      <svg width="${totalWidth}" height="${height}" style="overflow: visible;">
        <defs>
          <linearGradient id="${uniqueId}-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: var(--green-primary); stop-opacity: 0.35"/>
            <stop offset="50%" style="stop-color: var(--green-primary); stop-opacity: 0.15"/>
            <stop offset="100%" style="stop-color: var(--green-primary); stop-opacity: 0.02"/>
          </linearGradient>
          <filter id="${uniqueId}-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Y-axis labels -->
        ${yTicks.map((tick, i) => {
          const y = padding.top + chartHeight - ((tick - yMin) / range) * chartHeight;
          return `
            <text x="${yAxisWidth - 8}" y="${y + 3}"
                  text-anchor="end"
                  fill="var(--text-tertiary)"
                  font-size="9"
                  font-family="-apple-system, BlinkMacSystemFont, sans-serif">
              $${tick.toFixed(tick >= 100 ? 0 : 2)}
            </text>
          `;
        }).join('')}

        <!-- Grid lines -->
        ${yTicks.map((tick, i) => {
          const y = padding.top + chartHeight - ((tick - yMin) / range) * chartHeight;
          return `
            <line x1="${yAxisWidth}" y1="${y}" x2="${yAxisWidth + width}" y2="${y}"
                  stroke="var(--border-light)"
                  stroke-dasharray="3,3"
                  stroke-width="1"/>
          `;
        }).join('')}

        <!-- Area fill with animation -->
        <polygon
          points="${fillPoints}"
          fill="url(#${uniqueId}-gradient)"
          style="animation: ${uniqueId}-fadeIn 0.6s ease-out 0.3s both;"/>

        <!-- Line with draw animation -->
        <polyline
          points="${linePoints}"
          fill="none"
          stroke="var(--green-primary)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#${uniqueId}-glow)"
          style="stroke-dasharray: ${totalLength}; stroke-dashoffset: ${totalLength}; animation: ${uniqueId}-drawLine 1s ease-out forwards;"/>

        <!-- Data points -->
        ${dataPoints.map((point, i) => `
          <circle
            class="${uniqueId}-point"
            cx="${point.x}"
            cy="${point.y}"
            r="4"
            fill="var(--green-primary)"
            stroke="white"
            stroke-width="2"
            data-index="${i}"
            style="transform-origin: ${point.x}px ${point.y}px; animation: ${uniqueId}-pointPop 0.3s ease-out ${0.8 + i * 0.05}s both;"/>
        `).join('')}
      </svg>

      <!-- Tooltip -->
      <div class="${uniqueId}-tooltip" id="${uniqueId}-tooltip"></div>

      <!-- X-axis labels -->
      <div style="display: flex; justify-content: space-between; margin-top: 4px; margin-left: ${yAxisWidth}px; font-size: 9px; color: var(--text-tertiary);">
        <span>${formatDate(dates[0])}</span>
        ${dates.length > 2 ? `<span>${formatDate(dates[Math.floor(dates.length / 2)])}</span>` : ''}
        <span>${formatDate(dates[dates.length - 1])}</span>
      </div>
    </div>
  `;

  // Add tooltip interactivity
  const tooltip = document.getElementById(`${uniqueId}-tooltip`);
  const points = container.querySelectorAll(`.${uniqueId}-point`);

  points.forEach((point, i) => {
    point.addEventListener('mouseenter', () => {
      const dp = dataPoints[i];
      tooltip.innerHTML = `<strong>$${dp.price.toFixed(2)}</strong><br>${formatDate(dp.date)}`;
      tooltip.style.left = `${dp.x}px`;
      tooltip.style.top = `${dp.y - 4}px`;
      tooltip.classList.add('show');
    });

    point.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });
  });
}

// Show price drop alert notification
export function showPriceDropAlert(product, currentPrice, targetPrice) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
    z-index: 10001;
    max-width: 320px;
    animation: badgeSlideIn 0.3s ease-out;
  `;

  const productName = product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name;

  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="font-size: 32px;">🎉</span>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">Price Drop Alert!</div>
        <div style="font-size: 13px; opacity: 0.95; margin-bottom: 8px;">${productName}</div>
        <div style="display: flex; gap: 12px; font-size: 14px;">
          <span>Now: <strong>$${currentPrice.toFixed(2)}</strong></span>
          <span style="opacity: 0.8;">Target: $${targetPrice.toFixed(2)}</span>
        </div>
        ${product.url ? `
        <button onclick="window.open('${product.url}', '_blank'); this.parentElement.parentElement.parentElement.remove();"
          style="margin-top: 10px; padding: 8px 16px; background: white; color: #16a34a; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">
          🛒 Buy Now
        </button>
        ` : ''}
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; opacity: 0.7; cursor: pointer; font-size: 18px; padding: 0;">×</button>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'badgeSlideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, 10000);
}
