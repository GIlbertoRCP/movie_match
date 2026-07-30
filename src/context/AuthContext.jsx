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

  // Helper for safe fetch handling
  const safeAuthFetch = async (url, bodyData) => {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
    } catch (networkErr) {
      console.error('Network connection error during auth fetch:', networkErr);
      throw new Error(
        'Unable to reach server. The backend may be waking up from sleep mode (~30s on free hosting)—please wait a few seconds and try again.'
      );
    }

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
  };

  // Login action
  const login = async (usernameOrEmail, password) => {
    const data = await safeAuthFetch(`${BACKEND_API}/auth/login`, { usernameOrEmail, password });
    localStorage.setItem('movie_match_jwt_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Register action
  const register = async (username, email, password) => {
    const data = await safeAuthFetch(`${BACKEND_API}/auth/register`, { username, email, password });
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
