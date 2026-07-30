import React, { createContext, useContext, useState, useEffect } from 'react';
import { BACKEND_API } from '../config';

const AuthContext = createContext();

// Parse JWT token payload safely without throwing
function parseJwt(tokenStr) {
  try {
    if (!tokenStr) return null;
    const base64Url = tokenStr.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    // Check expiration
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        localStorage.setItem('movie_match_jwt_token', urlToken);
        window.history.replaceState({}, '', window.location.pathname);
        return urlToken;
      }
    }
    return localStorage.getItem('movie_match_jwt_token') || '';
  });

  const [user, setUser] = useState(() => {
    const payload = parseJwt(token);
    if (payload) {
      return { id: payload.id, username: payload.username, email: payload.email };
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Check auth on mount or when token updates
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const decoded = parseJwt(token);
      if (!decoded) {
        // Token has expired
        logout();
        setLoading(false);
        return;
      }

      // Preserve decoded user payload immediately
      setUser(prev => prev || { id: decoded.id, username: decoded.username, email: decoded.email });

      // Verify token with backend candidates
      try {
        const candidateUrls = [];
        if (BACKEND_API) candidateUrls.push(`${BACKEND_API.replace(/\/$/, '')}/auth/me`);
        candidateUrls.push('/api/auth/me');
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          candidateUrls.push('http://localhost:5001/api/auth/me');
        }

        let verified = false;
        for (const url of candidateUrls) {
          try {
            const res = await fetch(url, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401 || res.status === 403) {
              // Token invalid according to server
              logout();
              return;
            }

            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                setUser(data.user);
              }
              verified = true;
              break;
            }
          } catch (netErr) {
            // Ignore single candidate network error and try next
          }
        }
      } catch (err) {
        console.warn('Auth verification check failed:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  // Helper for safe fetch handling with multi-endpoint resolution
  const safeAuthFetch = async (path, bodyData) => {
    const candidateUrls = [];

    // 1. Primary BACKEND_API endpoint
    if (BACKEND_API) {
      candidateUrls.push(`${BACKEND_API.replace(/\/$/, '')}${path}`);
    }

    // 2. Relative endpoint fallback (/api/auth/...)
    const relativeUrl = `/api${path}`;
    if (!candidateUrls.includes(relativeUrl)) {
      candidateUrls.push(relativeUrl);
    }

    // 3. Localhost fallback when running in browser
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const localUrl = `http://localhost:5001/api${path}`;
        if (!candidateUrls.includes(localUrl)) {
          candidateUrls.push(localUrl);
        }
      }
    }

    let lastError;

    for (const targetUrl of candidateUrls) {
      try {
        console.log(`[Auth] Executing fetch to candidate URL: ${targetUrl}`);
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });

        // Parse JSON response
        let data = {};
        try {
          data = await res.json();
        } catch (parseErr) {
          // If response was not JSON (e.g. static HTML 200 index.html), skip this candidate URL
          console.warn(`[Auth] Candidate URL ${targetUrl} returned non-JSON response, skipping.`);
          continue;
        }

        // If server responded with an error status (400, 401, 409, 500),
        // THROW the exact server error message immediately!
        if (!res.ok) {
          const serverErrorMessage = data.error || data.message || `Authentication failed (Status ${res.status})`;
          console.error(`[Auth] Server returned error (${res.status}):`, serverErrorMessage);
          throw new Error(serverErrorMessage);
        }

        // Verify that the response contains a valid token and user payload
        if (!data || !data.token) {
          console.warn(`[Auth] Candidate URL ${targetUrl} responded OK but missing token, skipping.`);
          continue;
        }

        return data;
      } catch (err) {
        lastError = err;

        // If this is an explicit server error message (from throw new Error(serverErrorMessage) above),
        // ALWAYS rethrow immediately so the UI displays the error feedback!
        const isNetworkError =
          !err.message ||
          err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError') ||
          err.message.includes('Network Error') ||
          err.message.includes('Load failed');

        if (!isNetworkError) {
          throw err;
        }
      }
    }

    throw new Error(
      lastError?.message || 'Unable to reach backend server. Please check your network connection or try again.'
    );
  };

  // Login action
  const login = async (usernameOrEmail, password) => {
    const data = await safeAuthFetch('/auth/login', { usernameOrEmail, password });
    if (!data || !data.token || !data.user) {
      throw new Error('Authentication failed: Missing token in response.');
    }
    localStorage.setItem('movie_match_jwt_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Register action
  const register = async (username, email, password) => {
    const data = await safeAuthFetch('/auth/register', { username, email, password });
    if (!data || !data.token || !data.user) {
      throw new Error('Registration failed: Missing token in response.');
    }
    localStorage.setItem('movie_match_jwt_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('movie_match_jwt_token');
    setToken('');
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user && token)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
