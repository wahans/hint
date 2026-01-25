// UI helpers - Modals, toasts, skeletons, messages

// Show a toast notification
export function showToast(message, type = 'info', duration = 3000) {
  // Remove any existing toasts
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10002;
    animation: toastSlideUp 0.3s ease-out;
    background: ${type === 'success' ? 'var(--green-primary)' : type === 'error' ? 'var(--error-bg)' : 'var(--bg-secondary)'};
    color: ${type === 'success' ? 'white' : type === 'error' ? 'var(--error-text)' : 'var(--text-primary)'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideDown 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Show a message in a specific element
export function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (el) {
    // Clear any existing timeout
    if (el._messageTimeout) clearTimeout(el._messageTimeout);

    el.className = `message ${type}`;
    el.textContent = text;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';

    // Auto-hide with fade
    el._messageTimeout = setTimeout(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => {
        el.textContent = '';
        el.className = '';
        el.style.opacity = '';
        el.style.transform = '';
      }, 300);
    }, 4000);
  }

  // Also show as toast for success messages
  if (type === 'success' && text.length < 50) {
    showToast(text, 'success', 2500);
  }
}

// Show skeleton loading for lists
export function showListsSkeleton(container, count = 3) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="list-item skeleton-item" style="animation-delay: ${i * 0.1}s">
        <div class="skeleton skeleton-title" style="width: 60%; height: 18px; margin-bottom: 8px;"></div>
        <div class="skeleton skeleton-text" style="width: 40%; height: 14px;"></div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// Show skeleton loading for products
export function showProductsSkeleton(container, count = 3) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="product-item skeleton-item" style="animation-delay: ${i * 0.1}s">
        <div class="skeleton" style="width: 48px; height: 48px; border-radius: 6px;"></div>
        <div class="product-details">
          <div class="skeleton skeleton-title" style="width: 70%; height: 16px; margin-bottom: 6px;"></div>
          <div class="skeleton skeleton-text" style="width: 40%; height: 12px;"></div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// Set button loading state
export function setButtonLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = '<span class="spinner"></span>';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}

// Shake element animation (for errors)
export function shakeElement(element) {
  element.style.animation = 'shake 0.4s ease';
  setTimeout(() => {
    element.style.animation = '';
  }, 400);
}

// Animate list items appearing
export function animateListItems(container, selector = '.list-item') {
  const items = container.querySelectorAll(selector);
  items.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(10px)';
    setTimeout(() => {
      item.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, index * 50);
  });
}

// Show a custom modal
export function showCustomModal(title, bodyHtml, onConfirm) {
  const modal = document.getElementById('modalContent');
  modal.innerHTML = `
    <div class="modal-header">${title}</div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-buttons">
      <button id="modalCancelBtn" class="secondary">Cancel</button>
      <button id="modalConfirmBtn">Confirm</button>
    </div>
  `;

  document.getElementById('modalOverlay').classList.add('show');

  document.getElementById('modalCancelBtn').addEventListener('click', hideModal);
  document.getElementById('modalConfirmBtn').addEventListener('click', onConfirm);

  // Auto-focus first input
  setTimeout(() => {
    const firstInput = modal.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 100);
}

// Hide modal
export function hideModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}

// Hide all main sections
export function hideAllSections() {
  document.getElementById('configSection').classList.add('hidden');
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('appSection').classList.add('hidden');
}

// Initialize dropdown menu functionality
export function initDropdowns() {
  // Close all dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    const dropdowns = document.querySelectorAll('.dropdown-container.open');
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  });

  // Toggle dropdown on button click
  document.querySelectorAll('.dropdown-container').forEach(container => {
    const trigger = container.querySelector('.btn-more');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other dropdowns
        document.querySelectorAll('.dropdown-container.open').forEach(d => {
          if (d !== container) d.classList.remove('open');
        });
        container.classList.toggle('open');
      });
    }
  });
}

// Set refresh button loading state
export function setRefreshLoading(button, loading) {
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}
