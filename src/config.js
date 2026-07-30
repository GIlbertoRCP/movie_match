let rawUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || 'http://localhost:5001';
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}

export const BACKEND_URL = rawUrl.replace(/\/$/, '');
export const BACKEND_API = `${BACKEND_URL}/api`;
