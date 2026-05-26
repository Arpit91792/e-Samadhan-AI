import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, Shield, Users, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

export default function AuthLayout({ children, title, subtitle }) {
      const { t } = useTranslation();

      const features = [
            { icon: Shield, textKey: 'authLayout.secureEncrypted' },
            { icon: Users, textKey: 'authLayout.citizens' },
            { icon: BarChart3, textKey: 'authLayout.analytics' },
            { icon: Zap, textKey: 'authLayout.aiPowered' },
      ];

      const stats = [
            { value: '2.4M+', labelKey: 'authLayout.statCitizens' },
            { value: '96%', labelKey: 'authLayout.statResolved' },
            { value: '4.2hrs', labelKey: 'authLayout.statAvgTime' },
      ];

      return (
            <div className="min-h-screen flex">
                  {/* Left panel — branding */}
                  <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-violet-900 flex-col justify-between p-12">
                        <div className="absolute inset-0 bg-grid opacity-10" />
                        <motion.div
                              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                              transition={{ duration: 8, repeat: Infinity }}
                              className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-400 rounded-full blur-3xl"
                        />
                        <motion.div
                              animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
                              transition={{ duration: 10, repeat: Infinity, delay: 3 }}
                              className="absolute bottom-1/4 -right-20 w-72 h-72 bg-violet-400 rounded-full blur-3xl"
                        />
                        {[...Array(4)].map((_, i) => (
                              <motion.div key={i}
                                    animate={{ y: [0, -15, 0], rotate: [0, 8, 0], opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8 }}
                                    className="absolute w-10 h-10 border-2 border-white/20 rounded-xl"
                                    style={{ left: `${15 + i * 22}%`, top: `${20 + (i % 2) * 45}%` }}
                              />
                        ))}

                        {/* Logo */}
                        <div className="relative z-10">
                              <Link to="/" className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                          <Zap className="w-6 h-6 text-white" fill="white" />
                                    </div>
                                    <div>
                                          <span className="font-black text-2xl text-white">e-Samadhan AI</span>
                                          <p className="text-xs text-blue-200 font-medium tracking-widest uppercase">{t('smartGovernancePlatform')}</p>
                                    </div>
                              </Link>
                        </div>

                        {/* Center content */}
                        <div className="relative z-10">
                              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/25 rounded-full mb-6">
                                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                          <span className="text-xs font-semibold text-white">{t('govtInitiative')}</span>
                                    </div>
                                    <h2 className="text-4xl font-black text-white leading-tight mb-4">
                                          {t('authLayout.transformingTitle')}<br />
                                          <span className="text-yellow-300">{t('authLayout.grievanceManagement')}</span><br />
                                          {t('authLayout.withAI')}
                                    </h2>
                                    <p className="text-blue-200 text-base leading-relaxed mb-8 max-w-sm">
                                          {t('authLayout.joinMillions')}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                          {features.map(({ icon: Icon, textKey }) => (
                                                <div key={textKey} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
                                                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                                                            <Icon className="w-3.5 h-3.5 text-white" />
                                                      </div>
                                                      <span className="text-xs font-semibold text-white">{t(textKey)}</span>
                                                </div>
                                          ))}
                                    </div>
                              </motion.div>
                        </div>

                        {/* Bottom stats */}
                        <div className="relative z-10 flex gap-8">
                              {stats.map((s) => (
                                    <div key={s.labelKey}>
                                          <p className="text-2xl font-black text-white">{s.value}</p>
                                          <p className="text-xs text-blue-300">{t(s.labelKey)}</p>
                                    </div>
                              ))}
                        </div>
                  </div>

                  {/* Right panel — form */}
                  <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-slate-50 to-blue-50 overflow-y-auto">
                        <motion.div
                              initial={{ opacity: 0, x: 30 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5 }}
                              className="w-full max-w-md"
                        >
                              {/* Mobile logo + language switcher */}
                              <div className="lg:hidden flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2.5">
                                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                                                <Zap className="w-5 h-5 text-white" fill="white" />
                                          </div>
                                          <div>
                                                <span className="font-black text-lg gradient-text">e-Samadhan AI</span>
                                                <p className="text-[10px] text-violet-500 font-semibold tracking-widest uppercase">{t('smartGovernance')}</p>
                                          </div>
                                    </div>
                                    <LanguageSwitcher variant="compact" />
                              </div>

                              {/* Desktop language switcher */}
                              <div className="hidden lg:flex justify-end mb-4">
                                    <LanguageSwitcher variant="default" />
                              </div>

                              {title && (
                                    <div className="mb-8">
                                          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">{title}</h1>
                                          {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
                                    </div>
                              )}

                              {children}
                        </motion.div>
                  </div>
            </div>
      );
}
