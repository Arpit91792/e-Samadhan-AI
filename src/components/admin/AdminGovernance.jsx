import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
      Sparkles, ShieldCheck, Star, Users, Building, BarChart3,
      CheckCircle, Send, TrendingUp, AlertCircle, Loader2, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminReportAnalytics } from '../../api/reports';

export default function AdminGovernance() {
      const [analytics, setAnalytics] = useState(null);
      const [loading, setLoading] = useState(true);

      const fetchAdminAnalytics = useCallback(async () => {
            setLoading(true);
            try {
                  const res = await getAdminReportAnalytics();
                  if (res.data?.success) {
                        setAnalytics(res.data.analytics);
                  }
            } catch (err) {
                  toast.error('Failed to load admin governance analytics');
            } finally {
                  setLoading(false);
            }
      }, []);

      useEffect(() => {
            fetchAdminAnalytics();
      }, [fetchAdminAnalytics]);

      if (loading) {
            return (
                  <div className="flex justify-center items-center py-32">
                        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                  </div>
            );
      }

      if (!analytics) return null;

      const {
            totalReportsGenerated,
            totalReportsSent,
            averageCitizenSatisfaction,
            topRatedOfficers,
            lowestRatedDepartments,
            mostCommonComplaintCategories,
            departmentPerformanceRankings,
            governanceInsights
      } = analytics;

      return (
            <div className="space-y-8 text-white">
                  {/* Title Section */}
                  <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shadow-inner">
                              <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                    AI Governance & Analytics
                              </h1>
                              <p className="text-xs text-slate-400 mt-1">
                                    Strategic administration overview of grievance resolution reports, department performance, and dynamic Gemini policy advisory.
                              </p>
                        </div>
                  </div>

                  {/* Top Stats Counters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Reports Generated */}
                        <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex items-center gap-4"
                        >
                              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <BarChart3 className="w-6 h-6" />
                              </div>
                              <div>
                                    <p className="text-3xl font-black tracking-tight text-blue-100">{totalReportsGenerated}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Reports Generated</p>
                              </div>
                        </motion.div>

                        {/* Reports Sent */}
                        <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 }}
                              className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex items-center gap-4"
                        >
                              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center justify-center text-rose-400">
                                    <Send className="w-6 h-6" />
                              </div>
                              <div>
                                    <p className="text-3xl font-black tracking-tight text-rose-100">{totalReportsSent}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Reports Sent (SMTP)</p>
                              </div>
                        </motion.div>

                        {/* Average Satisfaction Gauge */}
                        <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex items-center gap-4 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900"
                        >
                              {/* Radial satisfaction bar */}
                              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                          <path
                                                className="text-slate-800"
                                                strokeWidth="3.5"
                                                stroke="currentColor"
                                                fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                          />
                                          <path
                                                className="text-violet-500"
                                                strokeDasharray={`${averageCitizenSatisfaction}, 100`}
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                          />
                                    </svg>
                                    <span className="absolute text-[10px] font-black text-violet-200">
                                          {averageCitizenSatisfaction}%
                                    </span>
                              </div>
                              <div>
                                    <p className="text-xl font-black tracking-tight text-violet-200">Citizen Satisfaction</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Average Resolution Rating</p>
                              </div>
                        </motion.div>
                  </div>

                  {/* AI Dynamic Policy Insights */}
                  <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-indigo-950/80 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden"
                  >
                        {/* Shimmering glassmorphism effect */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>

                        <div className="relative z-10 space-y-4">
                              <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                                          <Sparkles className="w-4 h-4 animate-spin-slow" />
                                    </div>
                                    <div>
                                          <h3 className="text-xs font-black text-indigo-300 tracking-wider">GEMINI AI ADMINISTRATIVE GOVERNANCE INSIGHTS</h3>
                                          <p className="text-[9px] text-slate-400">Dynamic policy directives based on current state grievance logs</p>
                                    </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {governanceInsights.map((insight, idx) => (
                                          <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5 text-xs text-indigo-200/90 leading-relaxed relative hover:bg-white/[0.04] transition-colors"
                                          >
                                                <div className="absolute top-3 left-3 w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center text-[9px] font-black text-indigo-300">
                                                      {idx + 1}
                                                </div>
                                                <div className="pl-7">
                                                      {insight}
                                                </div>
                                          </motion.div>
                                    ))}
                              </div>
                        </div>
                  </motion.div>

                  {/* Leaderboards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performing Officers */}
                        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
                              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                                    <Users className="w-5 h-5 text-emerald-400" />
                                    <h3 className="text-sm font-black text-slate-200">Top Performing Officers</h3>
                              </div>

                              <div className="space-y-3">
                                    {topRatedOfficers.map((officer, idx) => (
                                          <div key={officer._id} className="flex items-center justify-between gap-3 p-3 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                                                <div className="flex items-center gap-3">
                                                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 rounded-xl flex items-center justify-center font-bold text-emerald-400 text-sm">
                                                            {idx + 1}
                                                      </div>
                                                      <div>
                                                            <p className="text-xs font-bold text-slate-200">{officer.name}</p>
                                                            <p className="text-[10px] text-slate-400 capitalize mt-0.5">{officer.department || 'General'}</p>
                                                      </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-right">
                                                      <div>
                                                            <p className="text-xs font-black text-emerald-400 flex items-center gap-1">
                                                                  <Star className="w-3.5 h-3.5" fill="#34d399" />
                                                                  {officer.performanceStats?.avgRating || '0.0'}
                                                            </p>
                                                            <p className="text-[9px] text-slate-400">Rating Avg</p>
                                                      </div>
                                                      <div className="border-l border-white/5 pl-4">
                                                            <p className="text-xs font-black text-slate-200">{officer.performanceStats?.complaintsResolved || 0}</p>
                                                            <p className="text-[9px] text-slate-400">Resolved</p>
                                                      </div>
                                                </div>
                                          </div>
                                    ))}
                              </div>
                        </div>

                        {/* Lowest Rated Departments (Weak Points) */}
                        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
                              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                                    <Building className="w-5 h-5 text-rose-400" />
                                    <h3 className="text-sm font-black text-slate-200 text-rose-300">Department Performance Weak Points</h3>
                              </div>

                              <div className="space-y-3">
                                    {lowestRatedDepartments.map((dept, idx) => (
                                          <div key={dept.slug} className="flex items-center justify-between gap-3 p-3 bg-white/[0.02] rounded-2xl border border-rose-500/5 hover:bg-white/[0.04] transition-colors">
                                                <div className="flex items-center gap-3">
                                                      <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center font-bold text-rose-400 text-sm">
                                                            <AlertCircle className="w-4 h-4" />
                                                      </div>
                                                      <div>
                                                            <p className="text-xs font-bold text-slate-200">{dept.name}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{dept.totalComplaints} filed complaints</p>
                                                      </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-right">
                                                      <div>
                                                            <p className="text-xs font-black text-rose-400 flex items-center gap-1">
                                                                  <Star className="w-3.5 h-3.5" fill="#f43f5e" />
                                                                  {dept.averageRating || '0.0'}
                                                            </p>
                                                            <p className="text-[9px] text-slate-400">Rating Avg</p>
                                                      </div>
                                                      <div className="border-l border-white/5 pl-4 bg-rose-500/[0.02] rounded-lg px-2 py-0.5">
                                                            <p className="text-xs font-black text-rose-400">{dept.satisfactionRate}%</p>
                                                            <p className="text-[9px] text-slate-400">Satisfaction</p>
                                                      </div>
                                                </div>
                                          </div>
                                    ))}
                              </div>
                        </div>
                  </div>

                  {/* Rankings & Category Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Department Resolution Rankings */}
                        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4 lg:col-span-2">
                              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                    <div className="flex items-center gap-2">
                                          <TrendingUp className="w-5 h-5 text-blue-400" />
                                          <h3 className="text-sm font-black text-slate-200">Department Resolution Rankings</h3>
                                    </div>
                                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Sorted by Resolved Complaints</span>
                              </div>

                              <div className="space-y-4">
                                    {departmentPerformanceRankings.map((dept, idx) => {
                                          const rate = dept.totalComplaints > 0
                                                ? Math.round((dept.resolvedComplaints / dept.totalComplaints) * 100)
                                                : 0;

                                          return (
                                                <div key={dept.slug} className="space-y-2">
                                                      <div className="flex items-center justify-between text-xs font-semibold">
                                                            <span className="text-slate-300 flex items-center gap-2">
                                                                  <span className="text-[10px] text-slate-500 font-mono">#{idx+1}</span>
                                                                  {dept.name}
                                                            </span>
                                                            <span className="text-slate-400">
                                                                  {dept.resolvedComplaints} / {dept.totalComplaints} Resolved
                                                                  <span className="ml-2.5 text-blue-400 font-black">{rate}%</span>
                                                            </span>
                                                      </div>
                                                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                                                                  style={{ width: `${rate}%` }}
                                                            />
                                                      </div>
                                                </div>
                                          );
                                    })}
                              </div>
                        </div>

                        {/* Category Grievance Distribution */}
                        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
                              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                                    <Building className="w-5 h-5 text-violet-400" />
                                    <h3 className="text-sm font-black text-slate-200">Common Grievances</h3>
                              </div>

                              <div className="space-y-3">
                                    {mostCommonComplaintCategories.map((item) => (
                                          <div key={item.category} className="flex items-center justify-between gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <span className="text-xs font-bold text-slate-300 capitalize">{item.category.replace('_', ' ')}</span>
                                                <div className="flex items-center gap-2">
                                                      <span className="text-[10px] font-black bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                                                            {item.count} Filed
                                                      </span>
                                                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                                                </div>
                                          </div>
                                    ))}
                              </div>
                        </div>
                  </div>
            </div>
      );
}
