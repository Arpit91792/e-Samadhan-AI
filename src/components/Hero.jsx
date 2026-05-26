import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Shield, Zap, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const floatingBadges = [
      { icon: Shield, titleKey: 'hero.badges.secure', color: 'from-blue-500 to-blue-600' },
      { icon: Zap, titleKey: 'hero.badges.aiPowered', color: 'from-violet-500 to-violet-600' },
      { icon: Globe, titleKey: 'hero.badges.panIndia', color: 'from-emerald-500 to-emerald-600' },
];

const stats = [
      { value: '2.4M+', labelKey: 'hero.stats.complaints' },
      { value: '98%', labelKey: 'hero.stats.satisfaction' },
      { value: '28', labelKey: 'hero.stats.states' },
];

const progressItems = [
      { deptKey: 'departments.roads_transport', pct: 87, color: 'from-blue-500 to-blue-600' },
      { deptKey: 'departments.water_supply', pct: 72, color: 'from-cyan-500 to-cyan-600' },
      { deptKey: 'departments.electricity', pct: 94, color: 'from-violet-500 to-violet-600' },
      { deptKey: 'departments.sanitation', pct: 65, color: 'from-emerald-500 to-emerald-600' },
];

const activityItems = [
      { id: '#C-4821', deptKey: 'departments.electricity', statusKey: 'status.resolved', color: 'text-emerald-600 bg-emerald-50' },
      { id: '#C-4820', deptKey: 'departments.roads_transport', statusKey: 'status.in_progress', color: 'text-blue-600 bg-blue-50' },
      { id: '#C-4819', deptKey: 'departments.water_supply', statusKey: 'status.pending', color: 'text-red-600 bg-red-50' },
];

export default function Hero() {
      const { t } = useTranslation();

      return (
            <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50">

                  {/* Animated background blobs */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                              animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
                              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                              className="absolute -top-40 -left-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"
                        />
                        <motion.div
                              animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
                              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                              className="absolute -top-20 right-0 w-[500px] h-[500px] bg-violet-300/25 rounded-full blur-3xl"
                        />
                        <motion.div
                              animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
                              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                              className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl"
                        />
                        <div className="absolute inset-0 bg-grid opacity-40" />
                  </div>

                  {/* Floating shapes */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(6)].map((_, i) => (
                              <motion.div
                                    key={i}
                                    animate={{ y: [0, -20, 0], rotate: [0, 10, 0], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
                                    className="absolute rounded-xl border border-blue-200/50 bg-white/20"
                                    style={{
                                          left: `${10 + i * 15}%`,
                                          top: `${15 + (i % 3) * 25}%`,
                                          width: `${20 + i * 8}px`,
                                          height: `${20 + i * 8}px`,
                                    }}
                              />
                        ))}
                  </div>

                  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">

                              {/* ── Left Content ── */}
                              <div>
                                    {/* Badge */}
                                    <motion.div
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.5 }}
                                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-200 rounded-full mb-6"
                                    >
                                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                          <span className="text-sm font-semibold text-blue-700">{t('govtInitiative')}</span>
                                    </motion.div>

                                    {/* Headline */}
                                    <motion.h1
                                          initial={{ opacity: 0, y: 30 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.6, delay: 0.1 }}
                                          className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-gray-900 mb-6"
                                    >
                                          {t('hero.title')}
                                    </motion.h1>

                                    {/* Subheading */}
                                    <motion.p
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.6, delay: 0.2 }}
                                          className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl"
                                    >
                                          {t('hero.subtitle')}
                                    </motion.p>

                                    {/* ── CTA Buttons — now use React Router Link ── */}
                                    <motion.div
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.6, delay: 0.3 }}
                                          className="flex flex-wrap gap-4 mb-10"
                                    >
                                          <motion.div
                                                whileHover={{ scale: 1.05, boxShadow: '0 15px 35px rgba(37,99,235,0.4)' }}
                                                whileTap={{ scale: 0.97 }}
                                          >
                                                <Link
                                                      to="/signup"
                                                      className="flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 text-base transition-all"
                                                >
                                                      {t('hero.cta')}
                                                      <ArrowRight className="w-5 h-5" />
                                                </Link>
                                          </motion.div>

                                          <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.97 }}
                                          >
                                                <Link
                                                      to="/login"
                                                      className="flex items-center gap-2 px-7 py-4 bg-white text-blue-600 font-bold rounded-2xl border-2 border-blue-200 hover:border-blue-400 shadow-lg text-base transition-all"
                                                >
                                                      <Play className="w-5 h-5 fill-blue-600" />
                                                      {t('hero.trackButton')}
                                                </Link>
                                          </motion.div>
                                    </motion.div>

                                    {/* Stats row */}
                                    <motion.div
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.6, delay: 0.4 }}
                                          className="flex flex-wrap gap-6"
                                    >
                                          {stats.map((stat) => (
                                                <div key={stat.labelKey} className="flex flex-col">
                                                      <span className="text-2xl font-black gradient-text">{stat.value}</span>
                                                      <span className="text-xs text-gray-500 font-medium">{t(stat.labelKey)}</span>
                                                </div>
                                          ))}
                                    </motion.div>
                              </div>

                              {/* ── Right — Dashboard mockup ── */}
                              <motion.div
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="relative"
                              >
                                    <motion.div
                                          animate={{ y: [0, -10, 0] }}
                                          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                          className="relative glass rounded-3xl p-6 shadow-2xl shadow-blue-100 border border-white/60"
                                    >
                                          {/* Dashboard header */}
                                          <div className="flex items-center justify-between mb-5">
                                                <div>
                                                      <p className="text-xs text-gray-500 font-medium">{t('hero.dashboardMock.title')}</p>
                                                      <p className="text-lg font-bold text-gray-800">{t('hero.dashboardMock.subtitle')}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 rounded-full">
                                                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                      <span className="text-xs font-semibold text-emerald-700">{t('hero.dashboardMock.liveLabel')}</span>
                                                </div>
                                          </div>

                                          {/* Stat cards */}
                                          <div className="grid grid-cols-3 gap-3 mb-5">
                                                {[
                                                      { labelKey: 'hero.dashboardMock.stats.total', value: '12,847', color: 'bg-blue-50 border-blue-100', text: 'text-blue-600' },
                                                      { labelKey: 'hero.dashboardMock.stats.resolved', value: '11,203', color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
                                                      { labelKey: 'hero.dashboardMock.stats.pending', value: '1,644', color: 'bg-amber-50 border-amber-100', text: 'text-amber-600' },
                                                ].map((s) => (
                                                      <div key={s.labelKey} className={`${s.color} border rounded-2xl p-3 text-center`}>
                                                            <p className={`text-lg font-black ${s.text}`}>{s.value}</p>
                                                            <p className="text-xs text-gray-500">{t(s.labelKey)}</p>
                                                      </div>
                                                ))}
                                          </div>

                                          {/* Progress bars */}
                                          <div className="space-y-3 mb-5">
                                                {progressItems.map((item) => (
                                                      <div key={item.deptKey}>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                  <span className="text-gray-600 font-medium">{t(item.deptKey)}</span>
                                                                  <span className="text-gray-500">{item.pct}%</span>
                                                            </div>
                                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                  <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${item.pct}%` }}
                                                                        transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                                                                        className={`h-full bg-gradient-to-r ${item.color} rounded-full`} />
                                                            </div>
                                                      </div>
                                                ))}
                                          </div>

                                          {/* Recent activity */}
                                          <div className="space-y-2">
                                                {activityItems.map((item) => (
                                                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                            <div className="flex items-center gap-2">
                                                                  <span className="text-xs font-mono text-gray-400">{item.id}</span>
                                                                  <span className="text-xs font-medium text-gray-700">{t(item.deptKey)}</span>
                                                            </div>
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.color}`}>{t(item.statusKey)}</span>
                                                      </div>
                                                ))}
                                          </div>
                                    </motion.div>

                                    {/* Floating badges */}
                                    {floatingBadges.map((badge, i) => (
                                          <motion.div
                                                key={badge.titleKey}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                                                transition={{
                                                      duration: 0.5, delay: 0.6 + i * 0.15,
                                                      y: { duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i },
                                                }}
                                                className={`absolute flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${badge.color} text-white text-xs font-bold rounded-xl shadow-lg`}
                                                style={{
                                                      top: i === 0 ? '-16px' : i === 1 ? '40%' : 'auto',
                                                      bottom: i === 2 ? '-16px' : 'auto',
                                                      left: i === 1 ? '-20px' : 'auto',
                                                      right: i === 0 ? '20px' : i === 2 ? '20px' : 'auto',
                                                }}
                                          >
                                                <badge.icon className="w-3.5 h-3.5" />
                                                {t(badge.titleKey)}
                                          </motion.div>
                                    ))}
                              </motion.div>
                        </div>
                  </div>

                  {/* Bottom wave */}
                  <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="white" />
                        </svg>
                  </div>
            </section>
      );
}
