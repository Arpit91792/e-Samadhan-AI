import React from 'react';
import ErrorPage from './ErrorPage';
import { logError } from '../../utils/monitoring';

function getDashboardHref() {
      try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (!user?.role) return null;
            switch (user.role) {
                  case 'admin': return '/admin/dashboard';
                  case 'officer': return '/officer/dashboard';
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
