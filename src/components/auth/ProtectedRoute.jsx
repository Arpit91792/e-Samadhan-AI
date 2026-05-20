import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../ui/PageLoader';

// Requires authentication
export const ProtectedRoute = ({ children }) => {
      const { isAuthenticated, initializing } = useAuth();
      const location = useLocation();
      if (initializing) return <PageLoader message="Verifying your session..." timeoutMs={15000} />;
      if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
      return children;
};

// Requires specific role(s)
export const RoleRoute = ({ children, roles }) => {
      const { user, isAuthenticated, initializing } = useAuth();
      const location = useLocation();
      if (initializing) return <PageLoader message="Verifying your session..." timeoutMs={15000} />;
      if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
      if (!roles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;
      return children;
};

// Redirect already-authenticated users away from auth pages
export const PublicRoute = ({ children }) => {
      const { isAuthenticated, user, initializing, getDashboardPath } = useAuth();
      // Don't redirect while verifying — just show the auth page
      if (initializing) return children;
      if (isAuthenticated) return <Navigate to={getDashboardPath(user?.role)} replace />;
      return children;
};
