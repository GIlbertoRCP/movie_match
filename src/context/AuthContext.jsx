import React, { createContext, useContext, useState, useEffect } from 'react';
import { BACKEND_API } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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
  const [loading, setLoading] = useState(true);

  // Check auth on mount if token exists
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BACKEND_API}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  // Helper for safe fetch handling with multi-endpoint resolution & automatic retries
  const safeAuthFetch = async (path, bodyData, retriesPerUrl = 2) => {
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
      for (let attempt = 1; attempt <= retriesPerUrl; attempt++) {
        try {
          const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
          });

          let data = {};
          try {
            data = await res.json();
          } catch (parseErr) {
            // Non-JSON response
          }

          if (!res.ok) {
            throw new Error(data.error || data.message || `Authentication failed (Status ${res.status})`);
          }

          return data;
        } catch (err) {
          lastError = err;
          console.warn(`Auth attempt ${attempt}/${retriesPerUrl} failed for ${targetUrl}:`, err.message);

          // Validation or user exists errors should fail immediately and notify user
          if (
            err.message.includes('already exists') ||
            err.message.includes('required') ||
            err.message.includes('must be at least') ||
            err.message.includes('Invalid')
          ) {
            throw err;
          }

          if (attempt < retriesPerUrl) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }
    }

    throw new Error(
      lastError?.message || 'Unable to reach backend server. Please verify network connection or try again in a few seconds.'
    );
  };

  // Login action
  const login = async (usernameOrEmail, password) => {
    const data = await safeAuthFetch('/auth/login', { usernameOrEmail, password });
    localStorage.setItem('movie_match_jwt_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Register action
  const register = async (username, email, password) => {
    const data = await safeAuthFetch('/auth/register', { username, email, password });
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
