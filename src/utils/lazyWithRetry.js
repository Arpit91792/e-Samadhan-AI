import { lazy } from 'react';
import { retry } from './retry';

/**
 * Lazy-load a route chunk with automatic retry on network failure.
 */
export function lazyWithRetry(importFn, chunkName = 'chunk') {
      return lazy(() =>
            retry(
                  () => importFn(),
                  {
                        retries: 3,
                        baseDelayMs: 800,
                        shouldRetry: (err) => {
                              const msg = err?.message || '';
                              return (
                                    msg.includes('Failed to fetch') ||
                                    msg.includes('Loading chunk') ||
                                    msg.includes('dynamically imported module')
                              );
                        },
                  }
            ).catch((err) => {
                  console.error(`[e-Samadhan AI] Failed to load ${chunkName}:`, err);
                  throw err;
            })
      );
}
