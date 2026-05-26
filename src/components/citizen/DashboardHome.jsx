import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, AlertTriangle, Siren, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCitizenStats } from '../../api/complaints';
import { deptLabel } from '../../utils/complaintConstants';
import StatusBadge from './StatusBadge';

export default function DashboardHome({ onNavigate }) {
      const { t } = useTranslation();
      const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, emergency: 0 });
      const [recent, setRecent] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
            getCitizenStats()
                  .then(({ data }) => {
                        const s = data.stats ?? data;
                        setStats({
                              total: s.total ?? 0,
                              pending: s.pending ?? 0,
                              inProgress: s.inProgress ?? 0,
                              resolved: s.resolved ?? 0,
                              emergency: s.emergency ?? 0,
                        });
                        setRecent(data.recent || []);
                  })
                  .catch(() => {
                        setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0, emergency: 0 });
                  })
                  .finally(() => setLoading(false));
      }, []);

      const cards = [
            { key: 'total', label: t('dashboard.totalComplaints'), value: stats.total, icon: FileText, gradient: 'from-blue-500 to-blue-600' },
            { key: 'pending', label: t('dashboard.pending'), value: stats.pending, icon: Clock, gradient: 'from-amber-500 to-orange-500' },
            { key: 'inProgress', label: t('dashboard.inProgress'), value: stats.inProgress, icon: AlertTriangle, gradient: 'from-violet-500 to-purple-600' },
            { key: 'resolved', label: t('dashboard.resolved'), value: stats.resolved, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
            { key: 'emergency', label: t('dashboard.emergency'), value: stats.emergency, icon: Siren, gradient: 'from-red-500 to-rose-600' },
      ];

      return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <motion.div>
                        <h1 className="text-2xl font-black text-slate-900">{t('dashboard.dashboardHome')}</h1>
                        <p className="text-slate-500 text-sm">{t('dashboard.aiPoweredOverview')}</p>
                  </motion.div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {cards.map((c, i) => (
                              <motion.div
                                    key={c.key}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass rounded-2xl p-4 border border-white/60 shadow-sm"
                              >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-3 shadow-md`}>
                                          <c.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{loading ? '—' : c.value}</p>
                                    <p className="text-xs text-slate-500 font-medium">{c.label}</p>
                              </motion.div>
                        ))}
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                        <motion.div className="lg:col-span-2 glass rounded-2xl border border-white/60 p-5 shadow-sm">
                              <h2 className="font-bold text-slate-900 mb-4">{t('dashboard.recentActivity')}</h2>
                              {recent.length === 0 ? (
                                    <p className="text-sm text-slate-500 py-8 text-center">{t('dashboard.noComplaintsYet')}</p>
                              ) : (
                                    <div className="space-y-3">
                                          {recent.map((c) => (
                                                <button
                                                      key={c._id}
                                                      type="button"
                                                      onClick={() => onNavigate('track', c.complaintId)}
                                                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 text-left"
                                                >
                                                      <div>
                                                            <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                                                            <p className="text-xs text-slate-400">{c.complaintId} · {deptLabel(c.category)}</p>
                                                      </div>
                                                      <StatusBadge status={c.status} />
                                                </button>
                                          ))}
                                    </div>
                              )}
                        </motion.div>

                        <motion.div className="glass rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    <h2 className="font-bold text-indigo-900">{t('dashboard.aiInsights')}</h2>
                              </div>
                              <ul className="text-xs text-indigo-800 space-y-2">
                                    <li>{t('dashboard.aiInsight1')}</li>
                                    <li>{t('dashboard.aiInsight2')}</li>
                                    <li>{t('dashboard.aiInsight3')}</li>
                                    <li>{t('dashboard.aiInsight4')}</li>
                              </ul>
                              <button
                                    type="button"
                                    onClick={() => onNavigate('create')}
                                    className="mt-4 w-full py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1"
                              >
                                    {t('dashboard.fileComplaint')} <ChevronRight className="w-4 h-4" />
                              </button>
                        </motion.div>
                  </div>
            </motion.div>
      );
}
