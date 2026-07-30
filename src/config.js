// Resolve Backend Base URL automatically across environments
function getBackendUrl() {
  // 1. Check explicit environment variable (VITE_BACKEND_URL)
  let url = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || '';

  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/$/, '');
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
    // Automatically map movie-match-frontend -> movie-match-backend
    if (hostname.includes('onrender.com')) {
      const derivedHost = hostname.replace('-frontend', '-backend');
      return `https://${derivedHost}`;
    }

    // Default origin fallback
    return window.location.origin.replace(/\/$/, '');
  }

  return 'http://localhost:5001';
}

export const BACKEND_URL = getBackendUrl();
export const BACKEND_API = `${BACKEND_URL}/api`;
