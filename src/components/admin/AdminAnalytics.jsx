import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
      BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
      PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { getAdminAnalytics } from '../../api/admin';
import { deptLabel } from '../../utils/departmentMeta';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

export default function AdminAnalytics() {
      const { t } = useTranslation();
      const [analytics, setAnalytics] = useState(null);

      useEffect(() => {
            getAdminAnalytics()
                  .then(({ data }) => setAnalytics(data.analytics))
                  .catch(() => { });
      }, []);

      const byDay = (analytics?.complaintsByDay || []).map((d) => ({ date: d._id, count: d.count }));
      const byStatus = (analytics?.complaintsByStatus || []).map((d) => ({ name: d._id, value: d.count }));
      const byCategory = (analytics?.complaintsByCategory || []).map((d) => ({ name: deptLabel(d._id), count: d.count }));

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-black text-white">{t('adminAnalyticsPage.title')}</h1>
                  <p className="text-sm text-slate-400">{t('adminAnalyticsPage.avgResolution', { hours: analytics?.avgResolutionHours || 0 })}</p>

                  <div className="grid lg:grid-cols-2 gap-6">
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 h-72">
                              <h3 className="text-sm font-bold text-white mb-3">{t('adminAnalyticsPage.complaints30Days')}</h3>
                              <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={byDay}>
                                          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                                          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                          <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                                          <Line type="monotone" dataKey="count" stroke="#f87171" strokeWidth={2} dot={false} />
                                    </LineChart>
                              </ResponsiveContainer>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 h-72">
                              <h3 className="text-sm font-bold text-white mb-3">{t('adminAnalyticsPage.byStatus')}</h3>
                              <ResponsiveContainer width="100%" height="90%">
                                    <PieChart>
                                          <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                                {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                          </Pie>
                                          <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
                                    </PieChart>
                              </ResponsiveContainer>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 h-72 lg:col-span-2">
                              <h3 className="text-sm font-bold text-white mb-3">{t('adminAnalyticsPage.byCategory')}</h3>
                              <ResponsiveContainer width="100%" height="90%">
                                    <BarChart data={byCategory}>
                                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                          <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
                                          <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                              </ResponsiveContainer>
                        </div>
                  </div>
            </motion.div>
      );
}
