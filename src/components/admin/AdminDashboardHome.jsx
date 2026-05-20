import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, Siren, Users, AlertTriangle } from 'lucide-react';
import { getAdminDashboard } from '../../api/admin';
import StatusBadge from '../citizen/StatusBadge';
import { deptLabel } from '../../utils/departmentMeta';

export default function AdminDashboardHome({ scope }) {
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
            getAdminDashboard()
                  .then(({ data: res }) => setData(res))
                  .catch(() => {})
                  .finally(() => setLoading(false));
      }, []);

      const c = data?.dashboard?.complaints || {};
      const o = data?.dashboard?.officers || {};

      const cards = [
            { key: 'total', label: 'Total Complaints', value: c.total, icon: FileText, gradient: 'from-blue-500 to-blue-600' },
            { key: 'pending', label: 'Pending', value: c.pending, icon: Clock, gradient: 'from-amber-500 to-orange-500' },
            { key: 'inProgress', label: 'In Progress', value: c.inProgress, icon: AlertTriangle, gradient: 'from-violet-500 to-purple-600' },
            { key: 'resolved', label: 'Resolved', value: c.resolved, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
            { key: 'emergency', label: 'Emergency', value: c.emergency, icon: Siren, gradient: 'from-red-500 to-rose-600' },
            { key: 'officers', label: 'Active Officers', value: o.active, icon: Users, gradient: 'from-cyan-500 to-blue-600' },
      ];

      return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                        <h1 className="text-2xl font-black text-white">
                              {scope?.departmentName || 'Platform'} Dashboard
                        </h1>
                        <p className="text-slate-400 text-sm">
                              {scope?.isSuper ? 'Global governance overview' : 'Department administration panel'}
                        </p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {cards.map((card, i) => (
                              <motion.div
                                    key={card.key}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm"
                              >
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-2`}>
                                          <card.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-xl font-black text-white">{loading ? '—' : card.value ?? 0}</p>
                                    <p className="text-[11px] text-slate-400 font-medium">{card.label}</p>
                              </motion.div>
                        ))}
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <h2 className="font-bold text-white mb-4">Recent Complaints</h2>
                        {(data?.dashboard?.recentComplaints || []).length === 0 ? (
                              <p className="text-sm text-slate-500 text-center py-8">No complaints yet</p>
                        ) : (
                              <div className="space-y-2">
                                    {data.dashboard.recentComplaints.map((item) => (
                                          <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div>
                                                      <p className="text-sm font-semibold text-white">{item.title}</p>
                                                      <p className="text-xs text-slate-500">{item.complaintId} · {deptLabel(item.category)}</p>
                                                </div>
                                                <StatusBadge status={item.status} />
                                          </div>
                                    ))}
                              </div>
                        )}
                  </div>
            </motion.div>
      );
}
