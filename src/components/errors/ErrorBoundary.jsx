import React from 'react';
import ErrorPage from './ErrorPage';
import { logError } from '../../utils/monitoring';
import { readStoredAuth, readStoredOfficer } from '../../utils/authStorage';

function getDashboardHref() {
      try {
            // Check officer session first (isolated keys)
            const officer = readStoredOfficer();
            if (officer?.role === 'officer') return '/officer/dashboard';
            // Then admin/citizen
            const user = readStoredAuth();
            if (!user?.role) return null;
            switch (user.role) {
                  case 'admin': return '/admin/dashboard';
                  case 'citizen': return '/citizen/dashboard';
                  default: return null;
            }
      } catch {
            return null;
      }
}

export default class ErrorBoundary extends React.Component {
      state = { hasError: false, error: null };

      static getDerivedStateFromError(error) {
            return { hasError: true, error };
      }

      componentDidCatch(error, info) {
            logError(error, {
                  type: 'react_render',
                  componentStack: info?.componentStack,
            });
      }

      handleReset = () => {
            this.setState({ hasError: false, error: null });
      };

      render() {
            if (this.state.hasError) {
                  return (
                        <ErrorPage
                              title="Something went wrong while loading the page"
                              message="An unexpected error occurred. Please reload or return home. If the problem persists, try signing in again."
                              error={this.state.error}
                              showDetails={import.meta.env.DEV}
                              onReload={() => window.location.reload()}
                              dashboardHref={getDashboardHref()}
                        />
                  );
            }
            return this.props.children;
      }
}
