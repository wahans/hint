// API layer - Supabase client, requests, session
import * as state from './state.js';

// Supabase request wrapper
export async function supabaseRequest(method, endpoint, body = null, customToken = null) {
  const token = customToken || await chrome.storage.local.get('session_token').then(r => r.session_token);

  const headers = {
    'apikey': state.supabaseKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${state.supabaseUrl}${endpoint}`, options);

  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshed = await refreshSession();
    if (refreshed) {
      // Retry with new token
      return supabaseRequest(method, endpoint, body);
    } else {
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `Request failed: ${response.status}`);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Helper function for RPC calls
export async function supabaseRPC(functionName, params) {
  return await supabaseRequest('POST', `/rest/v1/rpc/${functionName}`, params);
}

// Refresh the session token
export async function refreshSession() {
  try {
    const { refresh_token } = await chrome.storage.local.get('refresh_token');

    if (!refresh_token) {
      return false;
    }

    const response = await fetch(`${state.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': state.supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token })
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    await chrome.storage.local.set({
      session_token: data.access_token,
      refresh_token: data.refresh_token
    });

    return true;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return false;
  }
}
