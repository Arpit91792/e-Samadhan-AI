import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
      readStoredToken,
      readStoredAuth,
      readStoredOfficer,
      readStoredOfficerToken,
      hasValidSession,
      hasValidAdminSession,
      hasValidOfficerSession,
      isAuthFresh,
      isOfficerAuthFresh,
} from '../../utils/authStorage';
import { getAdminDashboardPath, isValidAdminDepartment } from '../../utils/departmentMeta';
import PageLoader from '../ui/PageLoader';

const loginPathForRole = (role) => {
      if (role === 'admin') return '/admin/login';
      return '/login';
};

const effectiveUser = (ctxUser) => ctxUser || readStoredAuth();

export const ProtectedRoute = ({ children }) => {
      const { initializing, user } = useAuth();
      const location = useLocation();
      const token = readStoredToken();
      const sessionOk = Boolean(token) && (hasValidSession() || isAuthFresh());

      if (initializing && token && !isAuthFresh()) {
            return <PageLoader message="Verifying your session..." timeoutMs={15000} />;
      }
      if (!sessionOk) {
            return <Navigate to={loginPathForRole(effectiveUser(user)?.role)} state={{ from: location }} replace />;
      }
      return children;
};

export const RoleRoute = ({ children, roles }) => {
      const { user, initializing, getDashboardPath } = useAuth();
      const location = useLocation();

      // ── Officer role: use completely isolated officer storage ─────────────────
      if (roles.includes('officer')) {
            const officerToken = readStoredOfficerToken();
            const officer = readStoredOfficer();
            const officerSessionOk = Boolean(officerToken) && (hasValidOfficerSession() || isOfficerAuthFresh());

            if (!officerSessionOk) {
                  return <Navigate to="/login" state={{ from: location }} replace />;
            }
            if (!officer || officer.role !== 'officer') {
                  return <Navigate to="/login" state={{ from: location }} replace />;
            }
            return children;
      }

      // ── Citizen / other roles: use standard auth storage ──────────────────────
      const token = readStoredToken();
      const u = effectiveUser(user);
      const sessionOk = Boolean(token) && (hasValidSession() || isAuthFresh());
      const roleOk = u?.role && roles.includes(u.role);

      if (initializing && token && !isAuthFresh()) {
            return <PageLoader message="Verifying your session..." timeoutMs={15000} />;
      }
      if (!sessionOk) {
            return <Navigate to="/login" state={{ from: location }} replace />;
      }
      if (!roleOk) {
            if (u?.role === 'admin') return <Navigate to={getDashboardPath('admin')} replace />;
            return <Navigate to="/unauthorized" replace />;
      }
      return children;
};

export const PublicRoute = ({ children }) => {
      const { user, initializing, getDashboardPath } = useAuth();
      const u = effectiveUser(user);
      // Only check admin/citizen sessions — never redirect based on officer session
      const sessionOk = hasValidSession() || isAuthFresh();

      if (initializing && readStoredToken() && !isAuthFresh()) return children;
      // Only redirect if admin or citizen is logged in — officers have their own login page
      if (sessionOk && u?.role && u.role !== 'officer') {
            return <Navigate to={getDashboardPath(u.role)} replace />;
      }
      return children;
};

export const AdminPublicRoute = ({ children }) => {
      const { initializing, getDashboardPath } = useAuth();
      const token = readStoredToken();

      if (token && (hasValidAdminSession() || isAuthFresh())) {
            return <Navigate to={getDashboardPath('admin')} replace />;
      }
      if (initializing && token && !isAuthFresh()) {
            return <PageLoader message="Checking admin session..." timeoutMs={10000} />;
      }
      return children;
};

/**
 * Admin dashboard guard — token in localStorage is the source of truth.
 * Prevents redirect loop when dashboard APIs fail but login succeeded.
 */
export const AdminRoleRoute = ({ children }) => {
      const { initializing } = useAuth();
      const location = useLocation();
      const { department: routeDept } = useParams();
      const token = readStoredToken();

      if (!token) {
            return <Navigate to="/admin/login" state={{ from: location }} replace />;
      }

      if (initializing && !isAuthFresh()) {
            return <PageLoader message="Verifying admin session..." timeoutMs={15000} />;
      }

      const u = readStoredAuth();
      const adminDept = u?.managedDepartment || u?.department || sessionStorage.getItem('adminDepartment');
      if (routeDept && isValidAdminDepartment(routeDept) && adminDept && routeDept !== adminDept) {
            return <Navigate to={getAdminDashboardPath(adminDept)} replace />;
      }

      return children;
};
