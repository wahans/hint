// Navigation module - Tab switching
import { autoFillCurrentPage } from './products.js';
import { displayMyLists } from './lists.js';
import { loadMyClaims } from './claims.js';

// Switch between main tabs
export function switchTab(tab) {
  document.querySelectorAll('.tab-buttons button').forEach(btn => btn.classList.remove('active'));

  const views = ['addView', 'myListsView', 'myClaimsView', 'viewHintlistView'];
  let targetView = null;

  // Hide all views with fade out
  views.forEach(viewId => {
    const view = document.getElementById(viewId);
    if (view && !view.classList.contains('hidden')) {
      view.style.opacity = '0';
      view.style.transform = 'translateY(-4px)';
      setTimeout(() => {
        view.classList.add('hidden');
        view.style.opacity = '';
        view.style.transform = '';
      }, 150);
    }
  });

  // Determine target view
  if (tab === 'add') {
    document.getElementById('addTab').classList.add('active');
    targetView = document.getElementById('addView');
    setTimeout(() => autoFillCurrentPage(), 200);
  } else if (tab === 'myLists') {
    document.getElementById('myListsTab').classList.add('active');
    targetView = document.getElementById('myListsView');
    setTimeout(() => displayMyLists(), 200);
  } else if (tab === 'myClaims') {
    document.getElementById('myClaimsTab').classList.add('active');
    targetView = document.getElementById('myClaimsView');
    setTimeout(() => loadMyClaims(), 200);
  } else if (tab === 'viewHintlist') {
    document.getElementById('viewHintlistTab').classList.add('active');
    targetView = document.getElementById('viewHintlistView');
  }

  // Show target view with fade in
  if (targetView) {
    setTimeout(() => {
      targetView.classList.remove('hidden');
      targetView.style.opacity = '0';
      targetView.style.transform = 'translateY(4px)';
      requestAnimationFrame(() => {
        targetView.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        targetView.style.opacity = '1';
        targetView.style.transform = 'translateY(0)';
      });
    }, 160);
  }
}
