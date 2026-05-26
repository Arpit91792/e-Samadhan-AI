import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileText, Sparkles } from 'lucide-react';

export default function CTA() {
      const { t } = useTranslation();
      const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

      const stats = [
            { value: t('cta.free'), label: t('cta.freeDesc') },
            { value: t('cta.support'), label: t('cta.supportDesc') },
            { value: t('cta.secure'), label: t('cta.secureDesc') },
      ];

      return (
            <section className="py-24 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700" />
                  <div className="absolute inset-0 bg-grid opacity-10" />

                  <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.35, 0.2] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl pointer-events-none"
                  />
                  <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                        transition={{ duration: 10, repeat: Infinity, delay: 3 }}
                        className="absolute bottom-0 right-0 w-80 h-80 bg-violet-300 rounded-full blur-3xl pointer-events-none"
                  />

                  {[...Array(5)].map((_, i) => (
                        <motion.div key={i}
                              animate={{ y: [0, -15, 0], rotate: [0, 10, 0], opacity: [0.2, 0.4, 0.2] }}
                              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.7 }}
                              className="absolute w-8 h-8 border-2 border-white/30 rounded-xl"
                              style={{ left: `${10 + i * 20}%`, top: `${20 + (i % 2) * 40}%` }}
                        />
                  ))}

                  <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div
                              ref={ref}
                              initial={{ opacity: 0, y: 40 }}
                              animate={inView ? { opacity: 1, y: 0 } : {}}
                              transition={{ duration: 0.7 }}
                        >
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/30 rounded-full mb-6">
                                    <Sparkles className="w-4 h-4 text-yellow-300" />
                                    <span className="text-sm font-semibold text-white">{t('cta.badge')}</span>
                              </div>

                              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                                    {t('cta.title')}
                              </h2>

                              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                                    {t('cta.subtitle')}
                              </p>

                              <div className="flex flex-wrap justify-center gap-4 mb-12">
                                    <motion.div whileHover={{ scale: 1.06, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} whileTap={{ scale: 0.97 }}>
                                          <Link to="/signup" className="flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-black rounded-2xl shadow-2xl text-base transition-all">
                                                <Sparkles className="w-5 h-5" />
                                                {t('cta.getStartedFree')}
                                                <ArrowRight className="w-5 h-5" />
                                          </Link>
                                    </motion.div>

                                    <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                                          <Link to="/signup" className="flex items-center gap-2 px-8 py-4 bg-white/15 text-white font-bold rounded-2xl border-2 border-white/40 hover:bg-white/25 text-base transition-all backdrop-blur-sm">
                                                <FileText className="w-5 h-5" />
                                                {t('cta.registerComplaint')}
                                          </Link>
                                    </motion.div>
                              </div>

                              <div className="flex flex-wrap justify-center gap-8">
                                    {stats.map((item) => (
                                          <div key={item.label} className="flex flex-col items-center">
                                                <span className="text-2xl font-black text-white">{item.value}</span>
                                                <span className="text-sm text-blue-200">{item.label}</span>
                                          </div>
                                    ))}
                              </div>
                        </motion.div>
                  </div>
            </section>
      );
}
