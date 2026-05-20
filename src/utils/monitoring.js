const isDev = import.meta.env.DEV;

const errorQueue = [];

export function logError(error, context = {}) {
      const payload = {
            message: error?.message || String(error),
            stack: error?.stack,
            ...context,
            timestamp: new Date().toISOString(),
      };

      errorQueue.push(payload);
      if (errorQueue.length > 50) errorQueue.shift();

      if (isDev) {
            console.error('[e-Samadhan AI]', payload);
      } else {
            console.error('[e-Samadhan AI]', payload.message);
      }

      if (typeof window !== 'undefined' && window.__SENTRY_CAPTURE__) {
            window.__SENTRY_CAPTURE__(error, context);
      }
}

export function logInfo(message, data) {
      if (isDev) {
            console.info(`[e-Samadhan AI] ${message}`, data ?? '');
      }
}

/** Call once at app boot. Set VITE_SENTRY_DSN and load @sentry/react separately if needed. */
export function initMonitoring() {
      const dsn = import.meta.env.VITE_SENTRY_DSN;
      if (dsn && isDev) {
            logInfo('VITE_SENTRY_DSN is set. Install @sentry/react and wire window.__SENTRY_CAPTURE__ to enable tracking.');
      }
}

export function getRecentErrors() {
      return [...errorQueue];
}
