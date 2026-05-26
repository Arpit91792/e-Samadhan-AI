import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PageLoader({
      message = null,
      timeoutMs = 20000,
      onRetry,
      showSkeleton = false,
}) {
      const { t } = useTranslation();
      const [timedOut, setTimedOut] = useState(false);

      const displayMessage = message ?? t('pageLoader.loading');

      useEffect(() => {
            if (!timeoutMs) return;
            const timer = setTimeout(() => setTimedOut(true), timeoutMs);
            return () => clearTimeout(timer);
      }, [timeoutMs]);

      if (showSkeleton) {
            return (
                  <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900"
                  >
                        <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="max-w-4xl mx-auto space-y-6"
                        >
                              <motion.div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                              <motion.div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                              <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                          <motion.div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                                    ))}
                              </div>
                        </motion.div>
                  </motion.div>
            );
      }

      return (
            <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900"
            >
                  <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-violet-500 rounded-full"
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{displayMessage}</p>

                  {timedOut && (
                        <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-col items-center gap-3 mt-4"
                        >
                              <p className="text-xs text-amber-600 dark:text-amber-400 text-center max-w-xs">
                                    {t('pageLoader.takingLong')}
                              </p>
                              <button
                                    type="button"
                                    onClick={() => (onRetry ? onRetry() : window.location.reload())}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                    <RefreshCw className="w-4 h-4" />
                                    {t('errors.tryAgain')}
                              </button>
                        </motion.div>
                  )}
            </motion.div>
      );
}
