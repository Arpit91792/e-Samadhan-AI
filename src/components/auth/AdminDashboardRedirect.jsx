import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboardPath } from '../../utils/departmentMeta';
import PageLoader from '../ui/PageLoader';

/** /admin/dashboard → department-specific dashboard */
export default function AdminDashboardRedirect() {
      const { user, isAdminAuthenticated, initializing } = useAuth();
      const dept = user?.managedDepartment || user?.department || sessionStorage.getItem('adminDepartment');

      if (initializing) {
            return <PageLoader message="Loading admin dashboard..." timeoutMs={15000} />;
      }
      if (!isAdminAuthenticated) {
            return <Navigate to="/admin/login" replace />;
      }
      return <Navigate to={getAdminDashboardPath(dept)} replace />;
}
