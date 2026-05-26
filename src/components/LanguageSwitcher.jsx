import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
      { code: 'en', label: 'English', flag: '🇺🇸' },
      { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
      { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
      { code: 'bn', label: 'বাংলা', flag: '🇮🇳' },
      { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
      { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
      { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
      { code: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

/**
 * LanguageSwitcher
 *
 * Props:
 *   variant: 'default' | 'compact' | 'sidebar'
 *     default  → globe icon + current lang label + chevron (for navbars)
 *     compact  → globe icon only (for tight spaces)
 *     sidebar  → full-width pill (for sidebars)
 *   dropUp: boolean — open dropdown upward (for bottom sidebars)
 *   darkBg: boolean — use white text (for dark sidebars like Admin)
 */
export default function LanguageSwitcher({
      variant = 'default',
      dropUp = false,
      darkBg = false,
      className = '',
}) {
      const { t, i18n } = useTranslation();
      const [open, setOpen] = useState(false);
      const ref = useRef(null);

      const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

      useEffect(() => {
            document.documentElement.lang = i18n.language || 'en';
      }, [i18n.language]);

      // Close on outside click
      useEffect(() => {
            const handler = (e) => {
                  if (ref.current && !ref.current.contains(e.target)) setOpen(false);
            };
            document.addEventListener('mousedown', handler);
            return () => document.removeEventListener('mousedown', handler);
      }, []);

      const handleSelect = (code) => {
            i18n.changeLanguage(code);
            localStorage.setItem('language', code);
            document.documentElement.lang = code;
            setOpen(false);
      };

      // ── Button styles per variant ──────────────────────────────────────────────
      const btnBase = `flex items-center gap-1.5 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-300`;

      const btnStyles = {
            default: `${btnBase} px-3 py-2 ${darkBg
                  ? 'text-slate-300 hover:bg-white/10'
                  : 'text-slate-600 hover:bg-slate-100 bg-slate-50 border border-slate-200'}`,
            compact: `${btnBase} p-2 ${darkBg
                  ? 'text-slate-300 hover:bg-white/10'
                  : 'text-slate-600 hover:bg-slate-100'}`,
            sidebar: `${btnBase} w-full px-3 py-2.5 ${darkBg
                  ? 'text-slate-300 hover:bg-white/10'
                  : 'text-slate-600 hover:bg-slate-100'}`,
      };

      const dropdownPos = dropUp
            ? 'bottom-full mb-2'
            : 'top-full mt-2';

      const dropdownAlign = variant === 'sidebar' ? 'left-0' : 'right-0';

      return (
            <div ref={ref} className={`relative ${className}`}>
                  <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className={btnStyles[variant]}
                        aria-label={t('language.selectLanguage')}
                        aria-expanded={open}
                  >
                        <Globe className={`flex-shrink-0 ${variant === 'compact' ? 'w-4 h-4' : 'w-4 h-4'} ${darkBg ? 'text-blue-400' : 'text-blue-500'}`} />
                        {variant !== 'compact' && (
                              <span className="hidden sm:inline">{current.flag} {current.label}</span>
                        )}
                        {variant === 'compact' && (
                              <span className="sr-only">{current.label}</span>
                        )}
                        {variant !== 'compact' && (
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''} ${darkBg ? 'text-slate-400' : 'text-slate-400'}`} />
                        )}
                  </button>

                  <AnimatePresence>
                        {open && (
                              <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: dropUp ? 4 : -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: dropUp ? 4 : -4 }}
                                    transition={{ duration: 0.15 }}
                                    className={`absolute ${dropdownPos} ${dropdownAlign} z-[200] w-44 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden`}
                              >
                                    <div className="py-1.5">
                                          {LANGUAGES.map((lang) => (
                                                <button
                                                      key={lang.code}
                                                      type="button"
                                                      onClick={() => handleSelect(lang.code)}
                                                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors text-left
                    ${i18n.language === lang.code
                                                                  ? 'bg-blue-50 text-blue-700'
                                                                  : 'text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                >
                                                      <span className="text-base leading-none">{lang.flag}</span>
                                                      <span className="flex-1">{lang.label}</span>
                                                      {i18n.language === lang.code && (
                                                            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                                      )}
                                                </button>
                                          ))}
                                    </div>
                              </motion.div>
                        )}
                  </AnimatePresence>
            </div>
      );
}
