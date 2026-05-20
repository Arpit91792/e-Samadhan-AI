/**
 * Retry async operations with exponential backoff.
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number; baseDelayMs?: number; shouldRetry?: (err: unknown, attempt: number) => boolean }} options
 * @returns {Promise<T>}
 */
export async function retry(fn, options = {}) {
      const {
            retries = 3,
            baseDelayMs = 1000,
            shouldRetry = () => true,
      } = options;

      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                  return await fn();
            } catch (err) {
                  lastError = err;
                  if (attempt >= retries || !shouldRetry(err, attempt)) {
                        throw err;
                  }
                  const delay = baseDelayMs * Math.pow(2, attempt);
                  await new Promise((r) => setTimeout(r, delay));
            }
      }
      throw lastError;
}

export function isRetryableError(error) {
      if (!error) return false;
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') return true;
      if (!error.response) return true;
      const status = error.response.status;
      return status >= 500 || status === 408 || status === 429;
}
