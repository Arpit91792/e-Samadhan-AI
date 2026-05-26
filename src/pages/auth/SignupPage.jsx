import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Shield, Crown, ArrowLeft, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import CitizenSignup from './signup/CitizenSignup';
import OfficerSignup from './signup/OfficerSignup';
import AdminSignup from './signup/AdminSignup';

export default function SignupPage() {
      const [selectedRole, setSelectedRole] = useState(null);
      const { t } = useTranslation();

      const roles = [
            {
                  id: 'citizen',
                  label: t('auth.citizen'),
                  icon: Users,
                  desc: t('auth.citizenDesc'),
                  gradient: 'from-blue-500 to-cyan-500',
                  bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
                  border: 'border-blue-200 hover:border-blue-400',
                  badge: 'bg-blue-100 text-blue-700',
                  emoji: '👤',
            },
            {
                  id: 'officer',
                  label: t('auth.officer'),
                  icon: Shield,
                  desc: t('auth.officerDesc'),
                  gradient: 'from-violet-500 to-purple-600',
                  bg: 'bg-gradient-to-br from-violet-50 to-purple-50',
                  border: 'border-violet-200 hover:border-violet-400',
                  badge: 'bg-violet-100 text-violet-700',
                  emoji: '🏛️',
            },
            {
                  id: 'admin',
                  label: t('auth.admin'),
                  icon: Crown,
                  desc: t('auth.adminDesc'),
                  gradient: 'from-amber-500 to-orange-500',
                  bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
                  border: 'border-amber-200 hover:border-amber-400',
                  badge: 'bg-amber-100 text-amber-700',
                  emoji: '👑',
            },
      ];

      return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 relative overflow-hidden">
                  {/* Background blobs */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 10, repeat: Infinity }}
                              className="absolute -top-40 -left-40 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
                        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, delay: 3 }}
                              className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-300 rounded-full blur-3xl" />
                        <div className="absolute inset-0 bg-grid opacity-30" />
                  </div>

                  <div className="relative min-h-screen flex flex-col">
                        {/* Top bar */}
                        <div className="flex items-center justify-between px-6 py-4">
                              <Link to="/" className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg">
                                          <Zap className="w-5 h-5 text-white" fill="white" />
                                    </div>
                                    <div>
                                          <span className="font-black text-lg gradient-text">e-Samadhan AI</span>
                                          <p className="text-[10px] text-violet-500 font-semibold tracking-widest uppercase leading-none">{t('smartGovernance')}</p>
                                    </div>
                              </Link>
                              <div className="flex items-center gap-3">
                                    <LanguageSwitcher variant="default" />
                                    <p className="text-sm text-gray-500 hidden sm:block">
                                          {t('auth.alreadyHaveAccount')}{' '}
                                          <Link to="/login" className="text-blue-600 font-semibold hover:underline">{t('auth.signIn2')}</Link>
                                    </p>
                              </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center px-4 py-8">
                              <AnimatePresence mode="wait">
                                    {!selectedRole ? (
                                          <motion.div key="role-select"
                                                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
                                                className="w-full max-w-3xl">
                                                <div className="text-center mb-10">
                                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-200 rounded-full mb-4">
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                                            <span className="text-sm font-semibold text-blue-700">{t('auth.createAccount')}</span>
                                                      </motion.div>
                                                      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
                                                            {t('auth.chooseAccountType')}
                                                      </h1>
                                                      <p className="text-gray-500 text-base max-w-md mx-auto">
                                                            {t('auth.chooseRoleDesc')}
                                                      </p>
                                                </div>

                                                <div className="grid sm:grid-cols-3 gap-5">
                                                      {roles.map((role, i) => (
                                                            <motion.button key={role.id}
                                                                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                                                                  transition={{ duration: 0.4, delay: i * 0.1 }}
                                                                  whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                                  onClick={() => setSelectedRole(role.id)}
                                                                  className={`${role.bg} border-2 ${role.border} rounded-2xl p-6 text-left shadow-md hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}>
                                                                  <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl`} />
                                                                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4 shadow-lg text-2xl`}>
                                                                        {role.emoji}
                                                                  </div>
                                                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${role.badge} mb-3 inline-block`}>
                                                                        {role.label}
                                                                  </span>
                                                                  <h3 className="text-lg font-black text-gray-900 mb-2">
                                                                        {role.id === 'citizen' ? t('auth.citizenAccount') : role.id === 'officer' ? t('auth.officerAccount') : t('auth.adminAccount')}
                                                                  </h3>
                                                                  <p className="text-sm text-gray-500 leading-relaxed">{role.desc}</p>
                                                                  <div className={`mt-4 flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent`}>
                                                                        {t('auth.getStarted')}
                                                                  </div>
                                                            </motion.button>
                                                      ))}
                                                </div>

                                                <p className="text-center text-xs text-gray-400 mt-8">
                                                      {t('auth.agreeToTerms')}{' '}
                                                      <a href="#" className="text-blue-500 hover:underline">{t('auth.termsOfService')}</a> {t('and', 'and')}{' '}
                                                      <a href="#" className="text-blue-500 hover:underline">{t('auth.privacyPolicy')}</a>
                                                </p>
                                          </motion.div>
                                    ) : (
                                          <motion.div key={`form-${selectedRole}`}
                                                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}
                                                className="w-full max-w-2xl">
                                                <button onClick={() => setSelectedRole(null)}
                                                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors font-medium">
                                                      <ArrowLeft className="w-4 h-4" /> {t('auth.backToRoleSelection')}
                                                </button>
                                                {selectedRole === 'citizen' && <CitizenSignup />}
                                                {selectedRole === 'officer' && <OfficerSignup />}
                                                {selectedRole === 'admin' && <AdminSignup />}
                                          </motion.div>
                                    )}
                              </AnimatePresence>
                        </div>
                  </div>
            </div>
      );
}
