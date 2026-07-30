// Resolve Backend Base URL automatically across environments
function getBackendUrl() {
  // 1. Check explicit environment variable (VITE_BACKEND_URL)
  let url = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || '';

  if (url) {
    url = url.trim().replace(/\/$/, '');

    // If Render host property provided short hostname (e.g. movie-match-backend-tzu9), append .onrender.com
    if (!url.includes('.') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      url = `${url}.onrender.com`;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url;
  }

  // 2. Browser Environment Detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');

    if (isLocal) {
      // Local development -> express backend runs on port 5001
      return 'http://localhost:5001';
    }

    // Hosted Render static site deployment:
    // Automatically map movie-match-frontend-tzu9.onrender.com -> movie-match-backend-tzu9.onrender.com
    if (hostname.includes('onrender.com')) {
      let derivedHost = hostname.replace('-frontend', '-backend');
      if (!derivedHost.endsWith('.onrender.com')) {
        derivedHost = `${derivedHost}.onrender.com`;
      }
      return `https://${derivedHost}`;
    }

    // Fallback if hostname is short Render hostname
    if (!hostname.includes('.')) {
      return `https://${hostname.replace('-frontend', '-backend')}.onrender.com`;
    }

    // Default origin fallback
    return window.location.origin.replace(/\/$/, '');
  }

  return 'http://localhost:5001';
}

export const BACKEND_URL = getBackendUrl();
export const BACKEND_API = `${BACKEND_URL}/api`;
