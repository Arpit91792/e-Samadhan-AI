import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export default function CitizenProfile() {
      const { user } = useAuth();
      const { t } = useTranslation();

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
                  <h1 className="text-2xl font-black text-slate-900">{t('profilePage.title')}</h1>
                  <div className="glass rounded-2xl border p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black">
                                    {user?.name?.charAt(0)}
                              </div>
                              <div>
                                    <h2 className="text-xl font-black text-slate-900">{user?.name}</h2>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full mt-1">
                                          <ShieldCheck className="w-3 h-3" /> {t('profilePage.verifiedCitizen')}
                                    </span>
                              </div>
                        </div>
                        <div className="space-y-3 text-sm">
                              <p className="flex items-center gap-2 text-slate-600"><Mail className="w-4 h-4" /> {user?.email}</p>
                              {user?.phone && <p className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4" /> +91 {user?.phone}</p>}
                              {user?.govtIdType && <p className="text-slate-600">{t('profilePage.id')} {user.govtIdType?.replace(/_/g, ' ').toUpperCase()}</p>}
                              {(user?.city || user?.state) && (
                                    <p className="flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4" /> {user.city}, {user.state}</p>
                              )}
                        </div>
                  </div>
            </motion.div>
      );
}
