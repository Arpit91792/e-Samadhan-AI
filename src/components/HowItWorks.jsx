import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, Brain, Bell, CheckCircle2 } from 'lucide-react';

const STEP_ICONS = [FileText, Brain, Bell, CheckCircle2];
const STEP_COLORS = [
      { color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', connector: 'bg-gradient-to-r from-blue-400 to-violet-400' },
      { color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-200', connector: 'bg-gradient-to-r from-violet-400 to-emerald-400' },
      { color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200', connector: 'bg-gradient-to-r from-amber-400 to-emerald-400' },
      { color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-200', connector: null },
];

function StepCard({ stepNum, icon: Icon, titleKey, descKey, style, index, total, inView }) {
      const { t } = useTranslation();
      return (
            <div className="relative flex flex-col items-center">
                  {index < total - 1 && style.connector && (
                        <div className={`hidden lg:block absolute top-10 left-1/2 w-full h-0.5 ${style.connector} z-0`}
                              style={{ left: '50%', width: 'calc(100% - 80px)', transform: 'translateX(40px)' }} />
                  )}
                  <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: index * 0.15 }}
                        className="relative z-10 flex flex-col items-center text-center"
                  >
                        <motion.div whileHover={{ scale: 1.1, rotate: 5 }}
                              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${style.color} flex items-center justify-center shadow-xl mb-4 relative`}>
                              <Icon className="w-9 h-9 text-white" />
                              <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-100">
                                    <span className="text-xs font-black text-gray-700">{index + 1}</span>
                              </div>
                              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${style.color} blur-xl opacity-30`} />
                        </motion.div>
                        <div className={`${style.bg} border ${style.border} rounded-2xl p-5 max-w-xs shadow-md`}>
                              <span className="text-xs font-black text-gray-400 tracking-widest uppercase mb-2 block">
                                    {t('howItWorks.step')} {String(index + 1).padStart(2, '0')}
                              </span>
                              <h3 className="text-base font-bold text-gray-900 mb-2">{t(titleKey)}</h3>
                              <p className="text-sm text-gray-500 leading-relaxed">{t(descKey)}</p>
                        </div>
                  </motion.div>
            </div>
      );
}

export default function HowItWorks() {
      const { t } = useTranslation();
      const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

      const steps = [
            { titleKey: 'howItWorks.steps.0.title', descKey: 'howItWorks.steps.0.desc' },
            { titleKey: 'howItWorks.steps.1.title', descKey: 'howItWorks.steps.1.desc' },
            { titleKey: 'howItWorks.steps.2.title', descKey: 'howItWorks.steps.2.desc' },
            { titleKey: 'howItWorks.steps.3.title', descKey: 'howItWorks.steps.3.desc' },
      ];

      return (
            <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-50 to-violet-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                              transition={{ duration: 0.6 }} className="text-center mb-16">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full mb-4">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-sm font-semibold text-emerald-700">{t('howItWorks.badge')}</span>
                              </div>
                              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                                    {t('howItWorks.title')}
                              </h2>
                              <p className="text-lg text-gray-500 max-w-2xl mx-auto">{t('howItWorks.subtitle')}</p>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                              {steps.map((step, i) => (
                                    <StepCard key={i} stepNum={i + 1} icon={STEP_ICONS[i]}
                                          titleKey={step.titleKey} descKey={step.descKey}
                                          style={STEP_COLORS[i]} index={i} total={steps.length} inView={inView} />
                              ))}
                        </div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                              transition={{ duration: 0.6, delay: 0.8 }} className="text-center mt-14">
                              <Link to="/signup">
                                    <motion.button whileHover={{ scale: 1.05, boxShadow: '0 15px 35px rgba(37,99,235,0.35)' }}
                                          whileTap={{ scale: 0.97 }}
                                          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-2xl shadow-xl text-base">
                                          {t('howItWorks.cta')}
                                    </motion.button>
                              </Link>
                        </motion.div>
                  </div>
            </section>
      );
}
