import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { Star, Quote } from 'lucide-react';

const TESTIMONIAL_CONFIG = [
      { key: 'priya', avatar: 'PS', rating: 5, color: 'from-yellow-400 to-amber-500', bg: 'bg-gradient-to-br from-yellow-50 to-amber-50', border: 'border-yellow-200', deptKey: 'departments.electricity' },
      { key: 'rajesh', avatar: 'RK', rating: 5, color: 'from-slate-500 to-gray-600', bg: 'bg-gradient-to-br from-slate-50 to-gray-50', border: 'border-slate-200', deptKey: 'departments.roads_transport' },
      { key: 'anita', avatar: 'AP', rating: 5, color: 'from-violet-500 to-purple-600', bg: 'bg-gradient-to-br from-violet-50 to-purple-50', border: 'border-violet-200', deptKey: 'departments.municipal' },
      { key: 'irfan', avatar: 'MI', rating: 5, color: 'from-cyan-400 to-blue-500', bg: 'bg-gradient-to-br from-cyan-50 to-blue-50', border: 'border-cyan-200', deptKey: 'departments.water_supply' },
      { key: 'sunita', avatar: 'SD', rating: 5, color: 'from-emerald-400 to-green-500', bg: 'bg-gradient-to-br from-emerald-50 to-green-50', border: 'border-emerald-200', deptKey: 'departments.sanitation' },
      { key: 'arjun', avatar: 'AN', rating: 5, color: 'from-rose-400 to-red-500', bg: 'bg-gradient-to-br from-rose-50 to-red-50', border: 'border-rose-200', deptKey: 'departments.healthcare' },
];

const TRUST_BADGES = [
      { value: '4.9/5', labelKey: 'testimonials.badges.appRating' },
      { value: '2.4M+', labelKey: 'testimonials.badges.happyCitizens' },
      { value: '28', labelKey: 'testimonials.badges.statesActive' },
      { value: '96%', labelKey: 'testimonials.badges.satisfaction' },
];

function TestimonialCard({ config, index }) {
      const { t } = useTranslation();
      const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

      return (
            <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -5, scale: 1.02 }}
                  className={`${config.bg} border ${config.border} rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 relative`}>
                  <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center opacity-20`}>
                        <Quote className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1 mb-3">
                        {[...Array(config.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                        ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-5 italic">
                        "{t(`testimonials.items.${config.key}.text`)}"
                  </p>
                  <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white text-xs font-black shadow-md`}>
                              {config.avatar}
                        </div>
                        <div>
                              <p className="text-sm font-bold text-gray-900">{t(`testimonials.items.${config.key}.name`)}</p>
                              <p className="text-xs text-gray-500">{t(`testimonials.items.${config.key}.role`)}</p>
                        </div>
                        <div className="ml-auto">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-white/70 text-gray-600 border ${config.border}`}>
                                    {t(config.deptKey)}
                              </span>
                        </div>
                  </div>
            </motion.div>
      );
}

export default function Testimonials() {
      const { t } = useTranslation();
      const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

      return (
            <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
                  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                              transition={{ duration: 0.6 }} className="text-center mb-14">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-200 rounded-full mb-4">
                                    <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                                    <span className="text-sm font-semibold text-amber-700">{t('testimonials.badge')}</span>
                              </div>
                              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                                    {t('testimonials.title')}
                              </h2>
                              <p className="text-lg text-gray-500 max-w-2xl mx-auto">{t('testimonials.subtitle')}</p>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                              {TESTIMONIAL_CONFIG.map((config, i) => (
                                    <TestimonialCard key={config.key} config={config} index={i} />
                              ))}
                        </div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                              transition={{ duration: 0.6, delay: 0.6 }}
                              className="flex flex-wrap justify-center gap-6 mt-12">
                              {TRUST_BADGES.map((badge) => (
                                    <div key={badge.labelKey} className="flex flex-col items-center glass rounded-2xl px-6 py-4 shadow-md border border-white/60">
                                          <span className="text-2xl font-black gradient-text">{badge.value}</span>
                                          <span className="text-xs text-gray-500 font-medium">{t(badge.labelKey)}</span>
                                    </div>
                              ))}
                        </motion.div>
                  </div>
            </section>
      );
}
