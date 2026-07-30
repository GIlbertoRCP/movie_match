let rawUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || '';

if (typeof window !== 'undefined') {
  if (rawUrl) {
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = `https://${rawUrl}`;
    }
    // Force HTTPS when host page is loaded over HTTPS to eliminate Mixed Content blocking
    if (window.location.protocol === 'https:' && rawUrl.startsWith('http://') && !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1')) {
      rawUrl = rawUrl.replace('http://', 'https://');
    }
  } else {
    // When VITE_BACKEND_URL is not set, use relative endpoints.
    // In local Vite dev mode, Vite automatically proxies /api -> http://localhost:5001.
    // In production, relative /api hits the backend on the current origin.
    rawUrl = '';
  }
} else if (!rawUrl) {
  rawUrl = 'http://localhost:5001';
}

export const BACKEND_URL = rawUrl ? rawUrl.replace(/\/$/, '') : '';
export const BACKEND_API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';
