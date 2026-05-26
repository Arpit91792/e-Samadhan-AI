import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, Siren, Users, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAdminAnalytics, getAdminProfile } from '../../api/admin';
import { deptLabel } from '../../utils/departmentMeta';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardHome({ departmentName }) {
      const { user } = useAuth();
      const { t } = useTranslation();
      const [data, setData] = useState(null);
      const [profile, setProfile] = useState(null);
      const [loading, setLoading] = useState(true);
      const adminDept = user?.managedDepartment || user?.department;

      useEffect(() => {
            Promise.all([
                  getAdminAnalytics(),
                  getAdminProfile()
            ])
                  .then(([analyticsRes, profileRes]) => {
                        setData(analyticsRes.data?.data);
                        setProfile(profileRes.data?.data);
                  })
                  .catch((err) => {
                        console.error('Failed to load data:', err);
                  })
                  .finally(() => setLoading(false));
      }, []);

      const formatDate = (date) => {
            if (!date) return 'N/A';
            return new Date(date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
            });
      };

      const cards = [
            {
                  key: 'total',
                  label: t('admin.totalComplaints'),
                  value: data?.totalComplaints,
                  icon: FileText,
                  gradient: 'from-blue-500 to-blue-600'
            },
            {
                  key: 'pending',
                  label: t('admin.pendingComplaints'),
                  value: data?.pendingComplaints,
                  icon: Clock,
                  gradient: 'from-amber-500 to-orange-500'
            },
            {
                  key: 'solved',
                  label: t('dashboard.resolved'),
                  value: data?.resolvedComplaints,
                  icon: CheckCircle2,
                  gradient: 'from-emerald-500 to-teal-500'
            },
            {
                  key: 'rate',
                  label: t('admin.resolutionRate'),
                  value: data?.resolutionRate ? `${data.resolutionRate}%` : '0%',
                  icon: Siren,
                  gradient: 'from-red-500 to-rose-600'
            },
            {
                  key: 'officers',
                  label: t('admin.activeOfficers'),
                  value: data?.totalOfficers,
                  icon: Users,
                  gradient: 'from-indigo-500 to-violet-600'
            },
      ];

      return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                        <h1 className="text-2xl font-black text-white">
                              {t('dashboard.adminDashboard', { dept: departmentName })}
                        </h1>
                        <p className="text-slate-400 text-sm">
                              {t('dashboard.deptAdminPanel', { dept: deptLabel(adminDept) })}
                        </p>
                  </div>

                  {/* Admin Profile Section */}
                  {!loading && profile && (
                        <motion.div
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-6 backdrop-blur-xl"
                        >
                              <div className="flex items-start justify-between mb-4">
                                    <h2 className="font-bold text-white flex items-center gap-2">
                                          <Shield className="w-5 h-5 text-red-400" />
                                          {t('admin.adminProfile')}
                                    </h2>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                          <p className="text-xs font-semibold text-slate-400 uppercase">{t('admin.fullName')}</p>
                                          <p className="text-lg font-bold text-white">{profile.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                          <p className="text-xs font-semibold text-slate-400 uppercase">{t('auth.department')}</p>
                                          <p className="text-lg font-bold text-white">{deptLabel(profile.department)}</p>
                                    </div>
                                    <div className="space-y-1">
                                          <p className="text-xs font-semibold text-slate-400 uppercase">{t('admin.registeredOn')}</p>
                                          <p className="text-lg font-bold text-white flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-amber-400" />
                                                {formatDate(profile.createdAt)}
                                          </p>
                                    </div>
                                    <div className="space-y-1">
                                          <p className="text-xs font-semibold text-slate-400 uppercase">{t('admin.officialEmail')}</p>
                                          <p className="text-sm font-semibold text-white flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-blue-400" />
                                                {profile.email}
                                          </p>
                                    </div>
                                    <div className="space-y-1">
                                          <p className="text-xs font-semibold text-slate-400 uppercase">{t('admin.mobileNumber')}</p>
                                          <p className="text-sm font-semibold text-white flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-green-400" />
                                                {profile.mobile}
                                          </p>
                                    </div>
                              </div>
                        </motion.div>
                  )}

                  {/* Analytics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {cards.map((card, i) => (
                              <motion.div
                                    key={card.key}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm hover:border-white/20 transition-colors"
                              >
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-2`}>
                                          <card.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-xl font-black text-white">{loading ? '—' : card.value ?? 0}</p>
                                    <p className="text-[11px] text-slate-400 font-medium">{card.label}</p>
                              </motion.div>
                        ))}
                  </div>

                  {!loading && !data && (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                              <p className="text-slate-400">{t('dashboard.noAnalyticsData')}</p>
                        </div>
                  )}
            </motion.div>
      );
}
