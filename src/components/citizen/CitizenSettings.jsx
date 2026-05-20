import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CitizenSettings() {
      const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
      const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

      useEffect(() => {
            document.documentElement.classList.toggle('dark', dark);
            localStorage.setItem('theme', dark ? 'dark' : 'light');
      }, [dark]);

      const saveLang = (v) => {
            setLang(v);
            localStorage.setItem('lang', v);
            toast.success('Language preference saved');
      };

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
                  <h1 className="text-2xl font-black text-slate-900">Settings</h1>
                  <div className="glass rounded-2xl border p-5 space-y-4">
                        <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                    {dark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    <span className="font-semibold text-sm">Dark mode</span>
                              </div>
                              <button type="button" onClick={() => setDark(!dark)} className={`w-12 h-6 rounded-full transition-colors ${dark ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                    <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${dark ? 'translate-x-6' : 'translate-x-0.5'}`} />
                              </button>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t">
                              <Globe className="w-5 h-5 text-slate-600" />
                              <select value={lang} onChange={(e) => saveLang(e.target.value)} className="flex-1 px-3 py-2 border rounded-xl text-sm">
                                    <option value="en">English</option>
                                    <option value="hi">हिन्दी</option>
                                    <option value="mr">मराठी</option>
                              </select>
                        </div>
                  </div>
            </motion.div>
      );
}
