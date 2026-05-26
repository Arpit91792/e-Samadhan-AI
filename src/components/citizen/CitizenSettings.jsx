import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

export default function CitizenSettings() {
      const { t } = useTranslation();
      const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

      useEffect(() => {
            document.documentElement.classList.toggle('dark', dark);
            localStorage.setItem('theme', dark ? 'dark' : 'light');
      }, [dark]);

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
                  <h1 className="text-2xl font-black text-slate-900">{t('settingsPage.title')}</h1>
                  <div className="glass rounded-2xl border p-5 space-y-4">
                        {/* Dark mode toggle */}
                        <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                    {dark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    <span className="font-semibold text-sm">{t('settingsPage.darkMode')}</span>
                              </div>
                              <button type="button" onClick={() => setDark(!dark)} className={`w-12 h-6 rounded-full transition-colors ${dark ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                    <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${dark ? 'translate-x-6' : 'translate-x-0.5'}`} />
                              </button>
                        </div>

                        {/* Language switcher — uses i18n directly */}
                        <div className="pt-2 border-t">
                              <p className="text-sm font-semibold text-slate-700 mb-2">{t('settingsPage.language')}</p>
                              <LanguageSwitcher variant="sidebar" />
                        </div>
                  </div>
            </motion.div>
      );
}
