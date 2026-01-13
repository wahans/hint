// Hint Web Viewer - Non-User Access
// Allows viewing and claiming from hintlists without an account

// Configuration - UPDATE THESE WITH YOUR SUPABASE CREDENTIALS
const SUPABASE_URL = 'https://whbqyxtjmbordcjtqyoq.supabase.co'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoYnF5eHRqbWJvcmRjanRxeW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzY0MDksImV4cCI6MjA4MjYxMjQwOX0.GiTCNNNcMVuGdd45AJbXFB6eS0a5enXoUW7nfkZPD3k';

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
    console.log('Fetching list with code:', code);
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/lists?access_code=eq.${code}&is_public=eq.true&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Lists response status:', response.status);
    const lists = await response.json();
    console.log('Lists found:', lists);
    
    if (!response.ok || lists.length === 0) {
      showMessage('formMessage', 'Invalid access code or hintlist not found', 'error');
      return;
    }
    
    currentList = lists[0];
    
    // Load products for this list
    console.log('Fetching products for list:', currentList.id);
    const productsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/products?list_id=eq.${currentList.id}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Products response status:', productsResponse.status);
    currentProducts = await productsResponse.json();
    console.log('Products loaded:', currentProducts);
    
    // Display the hintlist
    displayHintlist();
    
  } catch (error) {
    console.error('Error loading hintlist:', error);
    showMessage('formMessage', `Error loading hintlist: ${error.message}`, 'error');
  }
}

function displayHintlist() {
  // Hide form, show hintlist
  document.getElementById('accessForm').style.display = 'none';
  document.getElementById('hintlistView').style.display = 'block';
  
  // Update header
  document.getElementById('hintlistName').textContent = currentList.name;
  
  // Filter out claimed items (check both claimed_by and guest_claimer_email)
  const availableProducts = currentProducts.filter(p => {
    return !p.claimed_by && !p.guest_claimer_email && p.guest_claimer_email !== '';
  });
  
  console.log('Total products:', currentProducts.length);
  console.log('Available products:', availableProducts.length);
  console.log('Products data:', currentProducts);
  
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
    
    let imageHTML = '';
    if (product.image_url) {
      imageHTML = `
        <div class="product-image">
          <img src="${product.image_url}" alt="${product.name}" onerror="this.parentElement.style.display='none'">
        </div>
      `;
    }
    
    let priceHTML = '';
    if (product.current_price) {
      priceHTML = `<div class="product-price">$${product.current_price}</div>`;
    }
    
    let urlHTML = '';
    if (product.url) {
      const domain = new URL(product.url).hostname.replace('www.', '');
      urlHTML = `<div class="product-url">${domain}</div>`;
    }
    
    productDiv.innerHTML = `
      ${imageHTML}
      <div class="product-details">
        <div class="product-name">${product.name}</div>
        ${priceHTML}
        ${urlHTML}
        <div class="product-actions">
          ${product.url ? `<button class="btn-small btn-secondary" onclick="window.open('${product.url}', '_blank')">🔗 View Product</button>` : ''}
          <button class="btn-small" onclick="openClaimModal('${product.id}', '${product.name.replace(/'/g, "\\'")}')">🎁 I'll Buy This</button>
        </div>
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
    // Claim the product as guest
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/claim_product_as_guest`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: currentProductToClaim.id,
          guest_name: name,
          guest_email: email
        })
      }
    );
    
    const result = await response.json();
    console.log('Claim result:', result);
    
    if (result.success) {
      // If owner wants notifications, send email
      if (result.notification_level && result.notification_level !== 'none') {
        try {
          // Call Edge Function to send email
          await fetch(`${SUPABASE_URL}/functions/v1/claim-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              owner_email: result.owner_email,
              owner_name: result.owner_name,
              list_name: result.list_name,
              product_name: result.product_name,
              claimer_name: name,
              notification_level: result.notification_level
            })
          });
        } catch (emailError) {
          console.error('Error sending notification email:', emailError);
          // Don't fail the claim if email fails
        }
      }
      
      showMessage('claimMessage', 'Item claimed successfully! The list owner has been notified.', 'success');
      
      setTimeout(() => {
        closeClaimModal();
        loadHintlist(); // Reload to hide claimed item
      }, 2000);
    } else {
      showMessage('claimMessage', result.error || 'Failed to claim item', 'error');
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