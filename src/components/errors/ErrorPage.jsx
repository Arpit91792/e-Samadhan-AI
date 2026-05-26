import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ErrorPage({
      title = null,
      message = null,
      error = null,
      showDetails = false,
      onReload,
      homeHref = '/',
      dashboardHref = null,
      variant = 'error',
}) {
      const { t } = useTranslation();
      const isConfig = variant === 'config';

      const displayTitle = title ?? t('errors.serverError');
      const displayMessage = message ?? t('errors.tryAgain');

      const handleReload = () => {
            if (onReload) onReload();
            else window.location.reload();
      };

      const go = (href) => {
            window.location.href = href;
      };

      return (
            <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
            >
                  <motion.div
                        initial={{ scale: 0.96 }}
                        animate={{ scale: 1 }}
                        className="w-full max-w-lg text-center"
                  >
                        <motion.div
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                              className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-xl ${isConfig
                                          ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                          : 'bg-gradient-to-br from-blue-600 to-violet-600'
                                    }`}
                        >
                              {isConfig ? (
                                    <AlertTriangle className="w-10 h-10 text-white" />
                              ) : (
                                    <span className="text-4xl">⚡</span>
                              )}
                        </motion.div>

                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                              e-Samadhan AI
                        </h1>
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">
                              {displayTitle}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                              {displayMessage}
                        </p>

                        {showDetails && error && (
                              <details className="mb-8 text-left bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 backdrop-blur-sm">
                                    <summary className="cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-300">
                                          Error details (development)
                                    </summary>
                                    <pre className="mt-3 text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-all overflow-auto max-h-40">
                                          {error?.stack || error?.toString?.() || String(error)}
                                    </pre>
                              </details>
                        )}

                        <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.15 }}
                              className="flex flex-col sm:flex-row gap-3 justify-center"
                        >
                              <button
                                    type="button"
                                    onClick={handleReload}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                              >
                                    <RefreshCw className="w-4 h-4" />
                                    {t('errorPage.reloadPage')}
                              </button>

                              <button
                                    type="button"
                                    onClick={() => go(homeHref)}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all"
                              >
                                    <Home className="w-4 h-4" />
                                    {t('errors.goHome')}
                              </button>

                              {dashboardHref && (
                                    <button
                                          type="button"
                                          onClick={() => go(dashboardHref)}
                                          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-500 transition-all"
                                    >
                                          <LayoutDashboard className="w-4 h-4" />
                                          {t('nav.dashboard')}
                                    </button>
                              )}
                        </motion.div>
                  </motion.div>
            </motion.div>
      );
}
