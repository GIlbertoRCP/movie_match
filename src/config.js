/**
 * Dynamic Application Configuration
 */

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');
export const BACKEND_API = `${BACKEND_URL}/api`;
