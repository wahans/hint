// Hint Web Viewer - Non-User Access
// Allows viewing and claiming from hintlists without an account

// Configuration - UPDATE THESE WITH YOUR SUPABASE CREDENTIALS
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let currentList = null;
let currentProducts = [];
let currentProductToClaim = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkURLForCode();
});

function setupEventListeners() {
  document.getElementById('loadHintlistBtn').addEventListener('click', loadHintlist);
  document.getElementById('accessCode').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadHintlist();
  });
  document.getElementById('cancelClaimBtn').addEventListener('click', closeClaimModal);
  document.getElementById('confirmClaimBtn').addEventListener('click', confirmClaim);
}

// Check if access code is in URL
function checkURLForCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  
  if (code) {
    document.getElementById('accessCode').value = code;
    loadHintlist();
  }
}

async function loadHintlist() {
  const code = document.getElementById('accessCode').value.trim();
  
  if (!code) {
    showMessage('formMessage', 'Please enter an access code', 'error');
    return;
  }
  
  showMessage('formMessage', 'Loading hintlist...', 'info');
  
  try {
    // Find list by access code
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/lists?access_code=eq.${code}&is_public=eq.true&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const lists = await response.json();
    
    if (!response.ok || lists.length === 0) {
      showMessage('formMessage', 'Invalid access code or hintlist not found', 'error');
      return;
    }
    
    currentList = lists[0];
    
    // Load products for this list
    const productsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/products?list_id=eq.${currentList.id}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    currentProducts = await productsResponse.json();
    
    // Display the hintlist
    displayHintlist();
    
  } catch (error) {
    console.error('Error loading hintlist:', error);
    showMessage('formMessage', 'Error loading hintlist. Please try again.', 'error');
  }
}

function displayHintlist() {
  // Hide form, show hintlist
  document.getElementById('accessForm').style.display = 'none';
  document.getElementById('hintlistView').style.display = 'block';
  
  // Update header
  document.getElementById('hintlistName').textContent = currentList.name;
  
  // Filter out claimed items (non-users can't see who claimed)
  const availableProducts = currentProducts.filter(p => !p.claimed_by);
  
  document.getElementById('itemCount').textContent = `${availableProducts.length} available items`;
  
  // Display products
  const container = document.getElementById('productsContainer');
  container.innerHTML = '';
  
  if (availableProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎁</div>
        <div style="font-size: 18px; margin-bottom: 8px;">All items have been claimed!</div>
        <div style="font-size: 14px;">Check back later for new additions.</div>
      </div>
    `;
    return;
  }
  
  availableProducts.forEach(product => {
    const productDiv = document.createElement('div');
    productDiv.className = 'product-item';
    
    let priceHTML = '';
    if (product.current_price) {
      priceHTML = `<div class="product-price">$${product.current_price}</div>`;
    }
    
    let urlHTML = '';
    if (product.url) {
      urlHTML = `<div class="product-url">${product.url}</div>`;
    }
    
    productDiv.innerHTML = `
      <div class="product-name">${product.name}</div>
      ${priceHTML}
      ${urlHTML}
      <div class="product-actions">
        ${product.url ? `<button class="btn-small btn-secondary" onclick="window.open('${product.url}', '_blank')">🔗 View Product</button>` : ''}
        <button class="btn-small" onclick="openClaimModal('${product.id}', '${product.name.replace(/'/g, "\\'")}')">🎁 I'll Buy This</button>
      </div>
    `;
    
    container.appendChild(productDiv);
  });
  
  // Update URL with access code (for easy sharing)
  const newURL = `${window.location.origin}${window.location.pathname}?code=${currentList.access_code}`;
  window.history.replaceState({}, '', newURL);
}

function openClaimModal(productId, productName) {
  currentProductToClaim = { id: productId, name: productName };
  document.getElementById('claimModal').classList.add('show');
  document.getElementById('claimerName').focus();
  
  // Clear previous inputs
  document.getElementById('claimerName').value = '';
  document.getElementById('claimerEmail').value = '';
  document.getElementById('claimMessage').innerHTML = '';
}

function closeClaimModal() {
  document.getElementById('claimModal').classList.remove('show');
  currentProductToClaim = null;
}

async function confirmClaim() {
  const name = document.getElementById('claimerName').value.trim();
  const email = document.getElementById('claimerEmail').value.trim();
  
  if (!name || !email) {
    showMessage('claimMessage', 'Please enter your name and email', 'error');
    return;
  }
  
  if (!validateEmail(email)) {
    showMessage('claimMessage', 'Please enter a valid email address', 'error');
    return;
  }
  
  showMessage('claimMessage', 'Claiming item...', 'info');
  
  try {
    // Update product directly with guest claim info
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${currentProductToClaim.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          guest_claimer_name: name,
          guest_claimer_email: email,
          claimed_at: new Date().toISOString()
        })
      }
    );
    
    if (response.ok) {
      showMessage('claimMessage', 'Item claimed successfully! The list owner has been notified.', 'success');
      
      setTimeout(() => {
        closeClaimModal();
        loadHintlist(); // Reload to hide claimed item
      }, 2000);
    } else {
      const error = await response.json();
      console.error('Claim error:', error);
      showMessage('claimMessage', error.message || 'Failed to claim item', 'error');
    }
    
  } catch (error) {
    console.error('Error claiming product:', error);
    showMessage('claimMessage', 'Error claiming item. Please try again.', 'error');
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (el) {
    el.className = `message ${type}`;
    el.textContent = text;
    
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        el.innerHTML = '';
      }, 4000);
    }
  }
}
