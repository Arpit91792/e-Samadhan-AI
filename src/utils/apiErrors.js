const STATUS_MESSAGES = {
      400: 'Invalid request. Please check your input.',
      401: 'Session expired. Please sign in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      408: 'Request timed out. Please try again.',
      429: 'Too many requests. Please wait a moment.',
      500: 'Server error. Our team has been notified.',
      502: 'Service temporarily unavailable. Please try again.',
      503: 'Service temporarily unavailable. Please try again.',
      504: 'Gateway timeout. Please try again.',
};

export function isNetworkError(error) {
      return (
            !error?.response &&
            (error?.code === 'ERR_NETWORK' ||
                  error?.code === 'ECONNABORTED' ||
                  error?.message === 'Network Error')
      );
}

export function isAuthError(error) {
      return error?.response?.status === 401 || error?.response?.status === 403;
}

export function parseApiResponse(data) {
      if (data == null) return null;
      if (typeof data === 'object') return data;
      try {
            return JSON.parse(data);
      } catch {
            return null;
      }
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
      if (!error) return fallback;

      if (isNetworkError(error)) {
            return 'Unable to reach the server. Check your connection or try again later.';
      }

      const data = parseApiResponse(error.response?.data);
      if (data?.message && typeof data.message === 'string') return data.message;
      if (typeof error.response?.data === 'string' && error.response.data.trim()) {
            return error.response.data;
      }

      const status = error.response?.status;
      if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];

      if (error.message && !error.message.includes('Request failed with status')) {
            return error.message;
      }

      return fallback;
}

export function getErrorCode(error) {
      const data = parseApiResponse(error.response?.data);
      return data?.code || error.response?.status || 'UNKNOWN';
}
