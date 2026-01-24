// Claims module - My Claims tab, claiming
import * as state from './state.js';
import * as api from './api.js';
import * as ui from './ui.js';

// Load user's claimed items
export async function loadMyClaims() {
  const container = document.getElementById('myClaimsContainer');

  // Show skeleton loading
  ui.showListsSkeleton(container, 2);

  try {
    const claims = await api.supabaseRPC('get_my_claimed_products', {});

    if (claims.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎁</div>
          <div>No claimed items yet</div>
          <div style="font-size: 12px; margin-top: 8px;">Items you claim from friends' hintlists will appear here</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    // Group by list
    const groupedByList = {};
    claims.forEach(claim => {
      const key = claim.list_name;
      if (!groupedByList[key]) {
        groupedByList[key] = {
          listName: claim.list_name,
          ownerName: claim.list_owner_name,
          products: []
        };
      }
      groupedByList[key].products.push(claim);
    });

    // Display each list group
    Object.values(groupedByList).forEach(group => {
      const listDiv = document.createElement('div');
      listDiv.className = 'list-item';

      listDiv.innerHTML = `
        <div class="list-header">
          <div class="list-name">${group.listName}</div>
          <div class="list-badges">
            <span class="badge count">${group.products.length} claimed</span>
          </div>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
          From ${group.ownerName}'s hintlist
        </div>
      `;

      group.products.forEach(claim => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-item claimed';

        // Thumbnail
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'product-thumbnail';
        if (claim.image_url) {
          const img = document.createElement('img');
          img.src = claim.image_url;
          img.alt = claim.product_name;
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
        nameDiv.textContent = claim.product_name;
        detailsDiv.appendChild(nameDiv);

        if (claim.current_price) {
          const priceDiv = document.createElement('div');
          priceDiv.className = 'product-meta';
          priceDiv.textContent = `$${claim.current_price}`;
          detailsDiv.appendChild(priceDiv);
        }

        const claimedDiv = document.createElement('div');
        claimedDiv.className = 'product-meta claimed-status';
        claimedDiv.textContent = `✓ Claimed ${new Date(claim.claimed_at).toLocaleDateString()}`;
        detailsDiv.appendChild(claimedDiv);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'product-actions';
        actionsDiv.classList.add('show');

        if (claim.product_url) {
          const visitBtn = document.createElement('button');
          visitBtn.className = 'btn-icon';
          visitBtn.textContent = '🛒';
          visitBtn.title = 'Buy now';
          visitBtn.addEventListener('click', () => window.open(claim.product_url, '_blank'));
          actionsDiv.appendChild(visitBtn);
        }

        const unclaimBtn = document.createElement('button');
        unclaimBtn.className = 'btn-icon secondary';
        unclaimBtn.textContent = '↩️';
        unclaimBtn.title = 'Unclaim item';
        unclaimBtn.addEventListener('click', async () => {
          if (!confirm(`Unclaim "${claim.product_name}"?`)) return;
          try {
            const result = await api.supabaseRPC('unclaim_product', { product_id: claim.product_id });
            if (result.success) {
              ui.showMessage('addMessage', 'Item unclaimed', 'success');
              await loadMyClaims();
            } else {
              ui.showMessage('addMessage', result.error || 'Error unclaiming', 'error');
            }
          } catch (error) {
            ui.showMessage('addMessage', 'Error unclaiming item', 'error');
          }
        });
        actionsDiv.appendChild(unclaimBtn);

        detailsDiv.appendChild(actionsDiv);
        productDiv.appendChild(detailsDiv);
        listDiv.appendChild(productDiv);
      });

      container.appendChild(listDiv);
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error loading claims</div>';
  }
}

// Load a hintlist by code
export async function loadHintlist() {
  const code = document.getElementById('hintlistCode').value.trim();

  if (!code) {
    ui.showMessage('hintlistMessage', 'Please enter an access code', 'error');
    return;
  }

  const container = document.getElementById('hintlistContainer');
  container.innerHTML = '<div class="loading">Loading hintlist...</div>';

  try {
    // Join by code first
    const joinResult = await api.supabaseRPC('join_hintlist_by_code', { code });

    if (!joinResult || !joinResult.success) {
      container.innerHTML = '<div class="empty-state">Invalid access code</div>';
      ui.showMessage('hintlistMessage', joinResult?.error || 'Invalid code', 'error');
      return;
    }

    // Get the list details
    const lists = await api.supabaseRequest('GET', `/rest/v1/lists?access_code=eq.${code}&select=*`);

    if (!lists || lists.length === 0) {
      container.innerHTML = '<div class="empty-state">Hintlist not found</div>';
      return;
    }

    const list = lists[0];
    const products = await api.supabaseRequest('GET', `/rest/v1/products?list_id=eq.${list.id}&select=*`);

    displayHintlist(list, products);

  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error loading hintlist</div>';
    ui.showMessage('hintlistMessage', 'Error loading hintlist', 'error');
  }
}

// Display a hintlist (shared view)
export function displayHintlist(list, products) {
  const container = document.getElementById('hintlistContainer');
  container.innerHTML = '';

  // Header
  const headerDiv = document.createElement('div');
  headerDiv.innerHTML = `
    <div class="list-header" style="margin-bottom: 16px;">
      <div>
        <div class="list-name">${list.name}</div>
        <div style="font-size: 12px; color: var(--text-secondary);">
          ${products.length} items
        </div>
      </div>
    </div>
  `;
  container.appendChild(headerDiv);

  if (products.length === 0) {
    container.innerHTML += `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div>This hintlist is empty</div>
      </div>
    `;
    return;
  }

  // Separate claimed and available
  const claimed = products.filter(p => p.claimed_by);
  const available = products.filter(p => !p.claimed_by);

  // Show claimed count
  if (claimed.length > 0) {
    const claimedInfo = document.createElement('div');
    claimedInfo.style.cssText = 'padding: 8px 12px; background: var(--green-light); border-radius: 6px; margin-bottom: 16px; font-size: 13px;';
    claimedInfo.innerHTML = `<strong>${claimed.length}</strong> of ${products.length} items have been claimed`;
    container.appendChild(claimedInfo);
  }

  // Hintlist products
  const hintlistDiv = document.createElement('div');
  hintlistDiv.className = 'hintlist-products';

  // Show available first, then claimed
  const sortedProducts = [...available, ...claimed];

  if (sortedProducts.length === 0) {
    container.innerHTML += `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <div>All items have been claimed!</div>
      </div>
    `;
    return;
  }

  sortedProducts.forEach(product => {
    const isMine = product.claimed_by === state.currentUser.id;
    const isClaimed = !!product.claimed_by;

    const productDiv = document.createElement('div');
    productDiv.className = `product-item ${isMine ? 'claimed' : ''} ${isClaimed && !isMine ? 'claimed-other' : ''}`;

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

    // Product details
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'product-details';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'product-name';
    nameDiv.textContent = product.name;
    if (isClaimed && !isMine) {
      nameDiv.style.textDecoration = 'line-through';
      nameDiv.style.opacity = '0.6';
    }
    detailsDiv.appendChild(nameDiv);

    if (isMine) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'product-meta';
      metaDiv.textContent = '✓ You claimed this';
      detailsDiv.appendChild(metaDiv);
    } else if (isClaimed) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'product-meta';
      metaDiv.textContent = '✓ Claimed by someone';
      metaDiv.style.color = 'var(--text-tertiary)';
      detailsDiv.appendChild(metaDiv);
    }

    if (product.current_price) {
      const priceDiv = document.createElement('div');
      priceDiv.className = 'product-meta';
      priceDiv.style.fontWeight = '600';
      priceDiv.style.color = 'var(--green-primary)';
      priceDiv.textContent = `$${product.current_price}`;
      detailsDiv.appendChild(priceDiv);
    }

    if (product.url) {
      const urlDiv = document.createElement('div');
      urlDiv.className = 'product-url';
      urlDiv.textContent = product.url;
      detailsDiv.appendChild(urlDiv);
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'product-actions';

    if (product.url) {
      const visitBtn = document.createElement('button');
      visitBtn.className = 'btn-small';
      visitBtn.textContent = 'Visit';
      visitBtn.addEventListener('click', () => window.open(product.url, '_blank'));
      actionsDiv.appendChild(visitBtn);
    }

    if (isMine) {
      const unclaimBtn = document.createElement('button');
      unclaimBtn.className = 'btn-small danger';
      unclaimBtn.textContent = 'Unclaim';
      unclaimBtn.addEventListener('click', async () => {
        if (!confirm('Unclaim this item?')) return;
        try {
          const result = await api.supabaseRPC('unclaim_product', { product_id: product.id });
          if (result.success) {
            ui.showMessage('hintlistMessage', 'Item unclaimed', 'success');
            setTimeout(() => loadHintlist(), 500);
          } else {
            ui.showMessage('hintlistMessage', result.error || 'Error unclaiming', 'error');
          }
        } catch (error) {
          ui.showMessage('hintlistMessage', 'Error unclaiming', 'error');
        }
      });
      actionsDiv.appendChild(unclaimBtn);
    } else if (!isClaimed) {
      const claimBtn = document.createElement('button');
      claimBtn.className = 'btn-small';
      claimBtn.textContent = "I'll buy this!";
      claimBtn.addEventListener('click', async () => {
        if (!confirm('Claim this item?')) return;
        try {
          const result = await api.supabaseRPC('claim_product', { product_id: product.id });
          if (result.success) {
            ui.showMessage('hintlistMessage', 'Item claimed!', 'success');

            // Award points for claiming
            const { awardPoints } = await import('./leaderboard.js');
            await awardPoints('claim_product', 10, `Claimed ${product.name}`, product.id, list.id);

            setTimeout(() => loadHintlist(), 500);
          } else {
            ui.showMessage('hintlistMessage', result.error || 'Error claiming', 'error');
          }
        } catch (error) {
          ui.showMessage('hintlistMessage', 'Error claiming', 'error');
        }
      });
      actionsDiv.appendChild(claimBtn);
    }

    detailsDiv.appendChild(actionsDiv);
    productDiv.appendChild(detailsDiv);
    hintlistDiv.appendChild(productDiv);
  });

  container.appendChild(hintlistDiv);
}
