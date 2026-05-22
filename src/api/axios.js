import axios from 'axios';
import toast from 'react-hot-toast';
import { retry, isRetryableError } from '../utils/retry';
import { getErrorMessage, isAuthError, isNetworkError, parseApiResponse } from '../utils/apiErrors';
import { logError } from '../utils/monitoring';
import { isAuthFresh } from '../utils/authStorage';

const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/admin/login', '/admin/register'];
const SILENT_PATHS = ['/auth/me', '/health', '/complaints/citizen/stats', '/admin/', '/officer/'];

const isAuthPage = () => {
      const path = window.location.pathname;
      return AUTH_PATHS.some((p) => path.startsWith(p)) || path === '/';
};

const isSilentRequest = (config) => {
      const url = config?.url || '';
      return SILENT_PATHS.some((p) => url.includes(p)) || config?.silent === true;
};

const api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
});

api.interceptors.request.use(
      (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                  config.headers.Authorization = `Bearer ${token}`;
            }
            config._retryCount = config._retryCount ?? 0;
            return config;
      },
      (error) => Promise.reject(error)
);

// Keep default Authorization header in sync when token is saved
export function setAxiosAuthToken(token) {
      if (token) {
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
      } else {
            delete api.defaults.headers.common.Authorization;
      }
}

api.interceptors.response.use(
      (response) => {
            if (response.data != null && typeof response.data === 'string') {
                  const parsed = parseApiResponse(response.data);
                  if (parsed === null && response.data.trim().startsWith('{')) {
                        return Promise.reject(
                              Object.assign(new Error('Invalid JSON response from server'), {
                                    config: response.config,
                                    response,
                              })
                        );
                  }
                  if (parsed !== null) response.data = parsed;
            }
            return response;
      },
      async (error) => {
            const config = error.config;

            if (!config) return Promise.reject(error);

            const shouldRetry =
                  config._retryCount < 3 &&
                  isRetryableError(error) &&
                  !['post', 'put', 'patch', 'delete'].includes((config.method || '').toLowerCase());

            if (shouldRetry) {
                  config._retryCount += 1;
                  const delay = 1000 * Math.pow(2, config._retryCount - 1);
                  await new Promise((r) => setTimeout(r, delay));
                  return api(config);
            }

            if (error.response?.status === 401) {
                  const url = config?.url || '';
                  const isAdminApi = url.includes('/admin/');
                  // Do NOT wipe session on silent/admin API failures (common after login when dashboard loads)
                  const skipClear =
                        config?.skipSessionClear === true
                        || isSilentRequest(config)
                        || isAdminApi
                        || isAuthFresh();

                  if (!skipClear) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        localStorage.removeItem('admin');
                        sessionStorage.removeItem('authFresh');
                        sessionStorage.removeItem('adminDepartment');
                        window.dispatchEvent(new CustomEvent('auth:session-expired', {
                              detail: { path: window.location.pathname },
                        }));
                  }
                  if (!isAuthPage() && !skipClear && !isSilentRequest(config)) {
                        toast.error(getErrorMessage(error, 'Session expired. Please sign in again.'));
                  }
            } else if (!isSilentRequest(config) && !isAuthError(error)) {
                  const message = getErrorMessage(error);
                  if (isNetworkError(error)) {
                        toast.error(message, { id: 'network-error' });
                  } else if (error.response?.status >= 500) {
                        toast.error(message, { id: 'server-error' });
                  } else if (error.response?.status >= 400) {
                        toast.error(message);
                  }
            }

            logError(error, {
                  url: config.url,
                  method: config.method,
                  status: error.response?.status,
                  silent: isSilentRequest(config),
            });

            return Promise.reject(error);
      }
);

export async function apiRequest(requestFn, options = {}) {
      const { retries = 3, silent = false, showToast = true } = options;

      try {
            return await retry(requestFn, {
                  retries,
                  baseDelayMs: 1000,
                  shouldRetry: (err) => isRetryableError(err),
            });
      } catch (error) {
            if (showToast && !silent) {
                  toast.error(getErrorMessage(error));
            }
            throw error;
      }
}

export default api;
