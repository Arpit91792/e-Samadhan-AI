import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { Zap, Droplets, Car, Trash2, Shield, Heart, Building2, GraduationCap } from 'lucide-react';

const DEPT_CONFIG = [
      { icon: Zap, key: 'electricity', count: '3,241', resolved: 94, color: 'from-yellow-400 to-amber-500', bg: 'bg-gradient-to-br from-yellow-50 to-amber-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
      { icon: Droplets, key: 'waterSupply', count: '2,108', resolved: 88, color: 'from-cyan-400 to-blue-500', bg: 'bg-gradient-to-br from-cyan-50 to-blue-50', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700' },
      { icon: Car, key: 'roadsTransport', count: '4,562', resolved: 79, color: 'from-slate-500 to-gray-600', bg: 'bg-gradient-to-br from-slate-50 to-gray-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' },
      { icon: Trash2, key: 'sanitation', count: '1,893', resolved: 82, color: 'from-emerald-400 to-green-500', bg: 'bg-gradient-to-br from-emerald-50 to-green-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
      { icon: Shield, key: 'police', count: '987', resolved: 91, color: 'from-blue-600 to-indigo-600', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
      { icon: Heart, key: 'healthcare', count: '1,234', resolved: 96, color: 'from-rose-400 to-red-500', bg: 'bg-gradient-to-br from-rose-50 to-red-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' },
      { icon: Building2, key: 'municipal', count: '2,671', resolved: 85, color: 'from-violet-500 to-purple-600', bg: 'bg-gradient-to-br from-violet-50 to-purple-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
      { icon: GraduationCap, key: 'education', count: '876', resolved: 90, color: 'from-orange-400 to-amber-500', bg: 'bg-gradient-to-br from-orange-50 to-amber-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
];

function DeptCard({ dept, index }) {
      const { t } = useTranslation();
      const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

      return (
            <motion.div
                  ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.07 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`group ${dept.bg} border ${dept.border} rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-default`}
            >
                  <div className="flex items-start justify-between mb-4">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${dept.color} flex items-center justify-center shadow-md`}>
                              <dept.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${dept.badge}`}>
                              {dept.count} {t('departmentsSection.cases')}
                        </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1">{t(`departmentsSection.${dept.key}.name`)}</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">{t(`departmentsSection.${dept.key}.desc`)}</p>

                  <div>
                        <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-gray-500 font-medium">{t('departmentsSection.resolutionRate')}</span>
                              <span className="font-bold text-gray-700">{dept.resolved}%</span>
                        </div>
                        <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                              <motion.div
                                    initial={{ width: 0 }}
                                    animate={inView ? { width: `${dept.resolved}%` } : {}}
                                    transition={{ duration: 1.2, delay: 0.3 + index * 0.07, ease: 'easeOut' }}
                                    className={`h-full bg-gradient-to-r ${dept.color} rounded-full`}
                              />
                        </div>
                  </div>
            </motion.div>
      );
}

export default function Departments() {
      const { t } = useTranslation();
      const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

      return (
            <section id="departments" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

                  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                              ref={ref}
                              initial={{ opacity: 0, y: 30 }}
                              animate={inView ? { opacity: 1, y: 0 } : {}}
                              transition={{ duration: 0.6 }}
                              className="text-center mb-16"
                        >
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-200 rounded-full mb-4">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-700">{t('departmentsSection.badge')}</span>
                              </div>
                              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                                    {t('departmentsSection.title')}
                              </h2>
                              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                                    {t('departmentsSection.subtitle')}
                              </p>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                              {DEPT_CONFIG.map((dept, i) => (
                                    <DeptCard key={dept.key} dept={dept} index={i} />
                              ))}
                        </div>
                  </div>
            </section>
      );
}
