import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

import api, { setAxiosAuthToken } from '../api/axios';

import { getAdminDashboardPath } from '../utils/departmentMeta';

import {

      readStoredToken,

      readStoredAuth,

      persistAuthSession,

      persistAdminSession,

      clearAuthSession,

      normalizeAuthUser,

      hasValidSession,

      hasValidAdminSession,

      isAuthFresh,

      debugAuthStorage,

} from '../utils/authStorage';



const AuthContext = createContext(null);



const AUTH_FRESH_MS = 120000;



export const AuthProvider = ({ children }) => {

      const [token, setToken] = useState(readStoredToken);

      const [user, setUser] = useState(readStoredAuth);

      const [initializing, setInitializing] = useState(() => Boolean(readStoredToken() && !sessionStorage.getItem('authFresh')));

      const [loading, setLoading] = useState(false);



      const syncFromStorage = useCallback(() => {

            const t = readStoredToken();

            const u = readStoredAuth();

            if (t) setToken(t);

            if (u) setUser(u);

            return Boolean(t && u?.role);

      }, []);



      const applySession = useCallback((newToken, userData, options = {}) => {

            const isAdmin = userData?.role === 'admin' || options.asAdmin;

            const saved = isAdmin

                  ? persistAdminSession(newToken, userData, options)

                  : persistAuthSession(newToken, userData, options);

            if (!saved) return false;

            setToken(saved.token);

            setUser(saved.user);

            setAxiosAuthToken(saved.token);

            setInitializing(false);

            if (options.debug) debugAuthStorage();

            return true;

      }, []);



      const setAdminSession = useCallback((newToken, adminData) => {

            return applySession(newToken, adminData, { asAdmin: true, debug: import.meta.env.DEV });

      }, [applySession]);



      const clearSession = useCallback(() => {

            clearAuthSession();

            setAxiosAuthToken(null);

            setToken(null);

            setUser(null);

      }, []);

      // Sync Bearer header from localStorage on app load
      useEffect(() => {
            const t = readStoredToken();
            if (t) setAxiosAuthToken(t);
      }, []);



      // Verify session once on app load only (not when token state changes after login)

      useEffect(() => {

            const storedToken = readStoredToken();

            if (!storedToken) {

                  setInitializing(false);

                  return;

            }



            syncFromStorage();



            const freshAt = sessionStorage.getItem('authFresh');

            if (freshAt && Date.now() - Number(freshAt) < AUTH_FRESH_MS) {

                  setInitializing(false);

                  return;

            }



            let cancelled = false;

            const timeoutId = setTimeout(() => {

                  if (!cancelled) setInitializing(false);

            }, 10000);



            const verifyAuth = async () => {

                  const storedUser = readStoredAuth();



                  try {

                        if (storedUser?.role === 'admin') {

                              const { data } = await api.get('/admin/profile', {

                                    silent: true,

                                    skipSessionClear: true,

                              });

                              const profile = data.data || data.admin || data.user || {};

                              const adminUser = normalizeAuthUser({

                                    ...storedUser,

                                    ...profile,

                                    id: profile.id || profile._id || storedUser.id,

                                    role: 'admin',

                                    department: profile.department || storedUser.department,

                                    managedDepartment: profile.department || storedUser.managedDepartment || storedUser.department,

                              });

                              if (!cancelled && adminUser?.id) {

                                    persistAdminSession(storedToken, adminUser);

                                    setUser(adminUser);

                                    setToken(storedToken);

                              }

                        } else {

                              const { data } = await api.get('/auth/me', {

                                    silent: true,

                                    skipSessionClear: true,

                              });

                              const verified = normalizeAuthUser(data.user);

                              if (!cancelled && verified?.role) {

                                    persistAuthSession(storedToken, verified);

                                    setUser(verified);

                                    setToken(storedToken);

                              }

                        }

                  } catch (err) {

                        const status = err.response?.status;

                        if (import.meta.env.DEV) {

                              console.warn('Auth verify failed:', status, err.response?.data?.message);

                        }

                        // Keep admin logged in if verify fails (dashboard APIs may still work; avoid redirect loop)
                        if (!cancelled && status === 401 && storedUser?.role !== 'admin') {

                              clearSession();

                        } else if (!cancelled && storedUser?.role) {

                              setUser(storedUser);

                              setToken(storedToken);

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

      }, [clearSession, syncFromStorage]);



      useEffect(() => {

            const onExpired = () => {

                  if (isAuthFresh() || (readStoredToken() && window.location.pathname.startsWith('/admin/'))) {

                        return;

                  }

                  clearSession();

            };

            window.addEventListener('auth:session-expired', onExpired);

            return () => window.removeEventListener('auth:session-expired', onExpired);

      }, [clearSession]);



      const login = useCallback(async (email, password) => {

            setLoading(true);

            try {

                  const { data } = await api.post('/auth/login', { email, password });

                  if (!data?.token || !data?.user) {

                        throw new Error('Invalid login response');

                  }

                  const ok = applySession(data.token, data.user, { debug: import.meta.env.DEV });

                  if (!ok) throw new Error('Could not save session');

                  return data;

            } finally {

                  setLoading(false);

            }

      }, [applySession]);



      const register = useCallback(async (formData) => {

            setLoading(true);

            try {

                  const { data } = await api.post('/auth/register', formData, {

                        headers: { 'Content-Type': 'multipart/form-data' },

                  });

                  if (!data?.token || !data?.user) {

                        throw new Error('Invalid registration response');

                  }

                  const ok = applySession(data.token, data.user, { debug: import.meta.env.DEV });

                  if (!ok) throw new Error('Could not save session');

                  return data;

            } finally {

                  setLoading(false);

            }

      }, [applySession]);



      const logout = useCallback(async () => {

            try {

                  await api.post('/auth/logout');

            } catch {

                  // ignore

            } finally {

                  clearSession();

            }

      }, [clearSession]);



      const forgotPassword = useCallback(async (email) => {

            const { data } = await api.post('/auth/forgot-password', { email });

            return data;

      }, []);



      const resetPassword = useCallback(async (resetToken, password) => {

            const { data } = await api.post(`/auth/reset-password/${resetToken}`, { password });

            applySession(data.token, data.user, { debug: import.meta.env.DEV });

            return data;

      }, [applySession]);



      const setSession = useCallback((newToken, userData) => {

            const asAdmin = userData?.role === 'admin';

            return applySession(newToken, userData, { asAdmin, debug: import.meta.env.DEV });

      }, [applySession]);



      const getDashboardPath = useCallback((role, department) => {

            const u = readStoredAuth();

            const dept = department || u?.managedDepartment || u?.department;

            switch (role) {

                  case 'admin':

                        return getAdminDashboardPath(dept);

                  case 'officer':

                        return '/officer/dashboard';

                  default:

                        return '/citizen/dashboard';

            }

      }, []);



      const admin = useMemo(() => (user?.role === 'admin' ? user : readStoredAuth()?.role === 'admin' ? readStoredAuth() : null), [user]);



      const isAuthenticated = useMemo(

            () => hasValidSession() || Boolean(token && user?.role),

            [token, user]

      );



      const isAdminAuthenticated = useMemo(

            () => hasValidAdminSession() || Boolean(token && user?.role === 'admin'),

            [token, user]

      );



      return (

            <AuthContext.Provider value={{

                  user: user || readStoredAuth(),

                  admin,

                  token: token || readStoredToken(),

                  loading,

                  initializing,

                  isAuthenticated,

                  isAdminAuthenticated,

                  login,

                  register,

                  logout,

                  forgotPassword,

                  resetPassword,

                  setSession,

                  setAdminSession,

                  getDashboardPath,

                  syncFromStorage,

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

