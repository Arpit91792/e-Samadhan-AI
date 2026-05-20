import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
      // Load user from localStorage synchronously — no API call needed for initial render
      const [user, setUser] = useState(() => {
            try {
                  const stored = localStorage.getItem('user');
                  return stored ? JSON.parse(stored) : null;
            } catch {
                  return null;
            }
      });

      // initializing = false immediately if no token exists
      const hasToken = !!localStorage.getItem('token');
      const [initializing, setInitializing] = useState(hasToken);
      const [loading, setLoading] = useState(false);

      // Only verify token if one exists — and don't block the UI
      useEffect(() => {
            if (!hasToken) return;

            let cancelled = false;

            const timeoutId = setTimeout(() => {
                  if (!cancelled) setInitializing(false);
            }, 15000);

            const verifyAuth = async () => {
                  try {
                        const { data } = await api.get('/auth/me', { silent: true });
                        if (!cancelled) {
                              setUser(data.user);
                              localStorage.setItem('user', JSON.stringify(data.user));
                        }
                  } catch {
                        if (!cancelled) {
                              localStorage.removeItem('token');
                              localStorage.removeItem('user');
                              setUser(null);
                        }
                  } finally {
                        if (!cancelled) setInitializing(false);
                  }
            };

            verifyAuth();
            return () => {
                  cancelled = true;
                  clearTimeout(timeoutId);
            };
      }, []); // eslint-disable-line react-hooks/exhaustive-deps

      const login = useCallback(async (email, password) => {
            setLoading(true);
            try {
                  const { data } = await api.post('/auth/login', { email, password });
                  setUser(data.user);
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('user', JSON.stringify(data.user));
                  return data;
            } finally {
                  setLoading(false);
            }
      }, []);

      const register = useCallback(async (formData) => {
            setLoading(true);
            try {
                  const { data } = await api.post('/auth/register', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  setUser(data.user);
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('user', JSON.stringify(data.user));
                  return data;
            } finally {
                  setLoading(false);
            }
      }, []);

      const logout = useCallback(async () => {
            try {
                  await api.post('/auth/logout');
            } catch {
                  // ignore — clear locally regardless
            } finally {
                  setUser(null);
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
            }
      }, []);

      const forgotPassword = useCallback(async (email) => {
            const { data } = await api.post('/auth/forgot-password', { email });
            return data;
      }, []);

      const resetPassword = useCallback(async (token, password) => {
            const { data } = await api.post(`/auth/reset-password/${token}`, { password });
            setUser(data.user);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
      }, []);

      const getDashboardPath = useCallback((role) => {
            switch (role) {
                  case 'admin': return '/admin/dashboard';
                  case 'officer': return '/officer/dashboard';
                  default: return '/citizen/dashboard';
            }
      }, []);

      return (
            <AuthContext.Provider value={{
                  user,
                  loading,
                  initializing,
                  isAuthenticated: !!user,
                  login,
                  register,
                  logout,
                  forgotPassword,
                  resetPassword,
                  getDashboardPath,
            }}>
                  {children}
            </AuthContext.Provider>
      );
};

export const useAuth = () => {
      const ctx = useContext(AuthContext);
      if (!ctx) throw new Error('useAuth must be used within AuthProvider');
      return ctx;
};
