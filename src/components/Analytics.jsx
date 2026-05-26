import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import CountUp from 'react-countup';
import { TrendingUp, Clock, AlertOctagon, Award, BarChart3 } from 'lucide-react';

const STAT_CONFIG = [
      { icon: TrendingUp, end: 2.4, decimals: 1, suffix: 'M+', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', textColor: 'text-blue-600', labelKey: 'analytics.stat0.label', subKey: 'analytics.stat0.sub' },
      { icon: Award, end: 96.4, decimals: 1, suffix: '%', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-100', textColor: 'text-emerald-600', labelKey: 'analytics.stat1.label', subKey: 'analytics.stat1.sub' },
      { icon: Clock, end: 4.2, decimals: 1, suffix: ' hrs', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-100', textColor: 'text-violet-600', labelKey: 'analytics.stat2.label', subKey: 'analytics.stat2.sub' },
      { icon: AlertOctagon, end: 1247, decimals: 0, suffix: '', color: 'from-red-500 to-rose-500', bg: 'bg-red-50', border: 'border-red-100', textColor: 'text-red-600', labelKey: 'analytics.stat3.label', subKey: 'analytics.stat3.sub' },
];

const DEPT_PERF = [
      { nameKey: 'departments.healthcare', score: 96, color: 'from-rose-400 to-red-500' },
      { nameKey: 'departments.electricity', score: 94, color: 'from-yellow-400 to-amber-500' },
      { nameKey: 'departments.police', score: 91, color: 'from-blue-500 to-indigo-600' },
      { nameKey: 'departments.education', score: 90, color: 'from-orange-400 to-amber-500' },
      { nameKey: 'departments.water_supply', score: 88, color: 'from-cyan-400 to-blue-500' },
      { nameKey: 'departments.municipal', score: 85, color: 'from-violet-500 to-purple-600' },
      { nameKey: 'departments.sanitation', score: 82, color: 'from-emerald-400 to-green-500' },
      { nameKey: 'departments.roads_transport', score: 79, color: 'from-slate-500 to-gray-600' },
];

const HEATMAP_LEGEND = [
      { colorClass: 'bg-blue-400', labelKey: 'analytics.heatmap.low' },
      { colorClass: 'bg-yellow-400', labelKey: 'analytics.heatmap.medium' },
      { colorClass: 'bg-orange-400', labelKey: 'analytics.heatmap.high' },
      { colorClass: 'bg-red-400', labelKey: 'analytics.heatmap.critical' },
];

function StatCard({ stat, index }) {
      const { t } = useTranslation();
      const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
      return (
            <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -4, scale: 1.02 }}
                  className={`${stat.bg} border ${stat.border} rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300`}>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-md`}>
                        <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`text-3xl font-black ${stat.textColor} mb-1`}>
                        {inView ? (
                              <CountUp end={stat.end} duration={2.5} decimals={stat.decimals} suffix={stat.suffix} separator="," />
                        ) : (
                              <span>0{stat.suffix}</span>
                        )}
                  </div>
                  <p className="text-sm font-bold text-gray-800 mb-1">{t(stat.labelKey)}</p>
                  <p className="text-xs text-gray-500">{t(stat.subKey)}</p>
            </motion.div>
      );
}

export default function Analytics() {
      const { t } = useTranslation();
      const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
      const [barRef, barInView] = useInView({ triggerOnce: true, threshold: 0.1 });

      return (
            <section id="analytics" className="py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity }}
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl pointer-events-none" />
                  <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                              transition={{ duration: 0.6 }} className="text-center mb-16">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-4">
                                    <BarChart3 className="w-4 h-4 text-blue-300" />
                                    <span className="text-sm font-semibold text-blue-200">{t('analytics.badge')}</span>
                              </div>
                              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                                    {t('analytics.title')}
                              </h2>
                              <p className="text-lg text-blue-200/70 max-w-2xl mx-auto">{t('analytics.subtitle')}</p>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                              {STAT_CONFIG.map((stat, i) => <StatCard key={i} stat={stat} index={i} />)}
                        </div>

                        <motion.div ref={barRef} initial={{ opacity: 0, y: 30 }} animate={barInView ? { opacity: 1, y: 0 } : {}}
                              transition={{ duration: 0.6 }} className="glass-dark rounded-3xl p-8 border border-white/10">
                              <div className="flex items-center justify-between mb-8">
                                    <div>
                                          <h3 className="text-xl font-bold text-white">{t('analytics.deptPerformance')}</h3>
                                          <p className="text-sm text-blue-300/70 mt-1">{t('analytics.deptPerformanceSub')}</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                          <span className="text-xs font-semibold text-emerald-300">{t('analytics.liveData')}</span>
                                    </div>
                              </div>

                              <div className="space-y-4">
                                    {DEPT_PERF.map((dept, i) => (
                                          <div key={dept.nameKey}>
                                                <div className="flex justify-between text-sm mb-1.5">
                                                      <span className="text-white/80 font-medium">{t(dept.nameKey)}</span>
                                                      <span className="text-white font-bold">{dept.score}%</span>
                                                </div>
                                                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                                                      <motion.div initial={{ width: 0 }}
                                                            animate={barInView ? { width: `${dept.score}%` } : {}}
                                                            transition={{ duration: 1.2, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                                                            className={`h-full bg-gradient-to-r ${dept.color} rounded-full relative`}>
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                                                      </motion.div>
                                                </div>
                                          </div>
                                    ))}
                              </div>

                              <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-sm font-semibold text-white/70 mb-3">{t('analytics.heatmapTitle')}</p>
                                    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                                          {Array.from({ length: 98 }).map((_, i) => {
                                                const seed = (i * 7 + 13) % 10;
                                                const opacity = seed > 7 ? 'opacity-100' : seed > 5 ? 'opacity-70' : seed > 3 ? 'opacity-40' : 'opacity-20';
                                                const color = seed > 7 ? 'bg-red-400' : seed > 5 ? 'bg-orange-400' : seed > 3 ? 'bg-yellow-400' : 'bg-blue-400';
                                                return (
                                                      <motion.div key={i} initial={{ scale: 0 }}
                                                            animate={barInView ? { scale: 1 } : {}}
                                                            transition={{ duration: 0.3, delay: i * 0.004 }}
                                                            className={`w-full aspect-square rounded-sm ${color} ${opacity}`} />
                                                );
                                          })}
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                          {HEATMAP_LEGEND.map((item) => (
                                                <div key={item.labelKey} className="flex items-center gap-1.5">
                                                      <div className={`w-3 h-3 rounded-sm ${item.colorClass}`} />
                                                      <span className="text-xs text-white/50">{t(item.labelKey)}</span>
                                                </div>
                                          ))}
                                    </div>
                              </div>
                        </motion.div>
                  </div>
            </section>
      );
}
