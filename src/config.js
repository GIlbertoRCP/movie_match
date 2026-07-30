let rawUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || '';

if (typeof window !== 'undefined') {
  // If no env variable set, resolve backend URL based on host environment
  if (!rawUrl) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      rawUrl = 'http://localhost:5001';
    } else if (window.location.hostname.endsWith('.onrender.com')) {
      // Default to render backend service on Render deployments
      rawUrl = 'https://movie-match-backend.onrender.com';
    } else {
      rawUrl = window.location.origin;
    }
  }

  // Always force HTTPS when page is loaded over HTTPS to eliminate Mixed Content blocking
  if (window.location.protocol === 'https:' && rawUrl.startsWith('http://')) {
    rawUrl = rawUrl.replace('http://', 'https://');
  }
} else if (!rawUrl) {
  rawUrl = 'http://localhost:5001';
}

if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}

export const BACKEND_URL = rawUrl.replace(/\/$/, '');
export const BACKEND_API = `${BACKEND_URL}/api`;
