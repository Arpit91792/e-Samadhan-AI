import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
      const { getDashboardPath, user } = useAuth();
      const { t } = useTranslation();

      return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                  <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center max-w-md"
                  >
                        <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
                              <ShieldX className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-3">{t('unauthorizedPage.title')}</h1>
                        <p className="text-gray-500 mb-8">{t('unauthorizedPage.message')}</p>
                        <Link to={user ? getDashboardPath(user.role) : '/login'}>
                              <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg cursor-pointer"
                              >
                                    <ArrowLeft className="w-4 h-4" />
                                    {t('unauthorizedPage.goToDashboard')}
                              </motion.div>
                        </Link>
                  </motion.div>
            </div>
      );
}
