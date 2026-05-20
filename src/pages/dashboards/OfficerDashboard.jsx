import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
      Zap, LogOut, Bell, ClipboardList, CheckCircle2, Clock, AlertTriangle,
      BarChart3, ChevronRight, X, MapPin, Phone, User, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import {
      getOfficerDashboard, getOfficerComplaints, acceptComplaint,
      updateOfficerComplaintStatus, addOfficerNote, getOfficerPerformance,
} from '../../api/officer';
import ComplaintMapView from '../../components/maps/ComplaintMapView';
import StatusBadge from '../../components/citizen/StatusBadge';
import { deptLabel } from '../../utils/complaintConstants';

const DEPT_LABELS = {
      electricity: 'Electricity', water_supply: 'Water Supply', roads_transport: 'Roads & Transport',
      sanitation: 'Sanitation', police: 'Police', healthcare: 'Healthcare',
      municipal: 'Municipal Services', education: 'Education', general: 'General',
};

const PRIORITY_COLORS = {
      emergency: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-blue-100 text-blue-700',
};

export default function OfficerDashboard() {
      const { user, logout } = useAuth();
      const navigate = useNavigate();
      const [stats, setStats] = useState(null);
      const [performance, setPerformance] = useState(null);
      const [complaints, setComplaints] = useState([]);
      const [selected, setSelected] = useState(null);
      const [filter, setFilter] = useState('');
      const [loading, setLoading] = useState(true);
      const [note, setNote] = useState('');
      const [actionLoading, setActionLoading] = useState(false);

      const loadData = useCallback(async () => {
            try {
                  const [dashRes, listRes, perfRes] = await Promise.all([
                        getOfficerDashboard(),
                        getOfficerComplaints({ limit: 50, ...(filter ? { status: filter } : {}) }),
                        getOfficerPerformance(),
                  ]);
                  setStats(dashRes.data.dashboard?.stats);
                  setComplaints(listRes.data.complaints || []);
                  setPerformance(perfRes.data.performance);
            } catch {
                  toast.error('Failed to load officer dashboard');
            } finally {
                  setLoading(false);
            }
      }, [filter]);

      useEffect(() => { loadData(); }, [loadData]);

      useSocket({
            onComplaintUpdate: () => loadData(),
      });

      const handleLogout = async () => {
            await logout();
            navigate('/login');
      };

      const runAction = async (fn, msg) => {
            setActionLoading(true);
            try {
                  await fn();
                  toast.success(msg);
                  setSelected(null);
                  setNote('');
                  loadData();
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Action failed');
            } finally {
                  setActionLoading(false);
            }
      };

      const openDetail = async (c) => {
            setSelected(c);
            setNote('');
      };

      if (loading) {
            return (
                  <div className="min-h-screen flex items-center justify-center bg-slate-50">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
            );
      }

      return (
            <motion.div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                  <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                              <motion.div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                                          <Zap className="w-4 h-4 text-white" fill="white" />
                                    </div>
                                    <div>
                                          <span className="font-black text-base gradient-text">e-Samadhan AI</span>
                                          <span className="ml-2 text-xs font-semibold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">Officer Panel</span>
                                    </div>
                              </motion.div>
                              <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl">
                                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                                {user?.name?.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="hidden sm:block">
                                                <p className="text-xs font-bold text-gray-700">{user?.name?.split(' ')[0]}</p>
                                                <p className="text-[10px] text-gray-400">{user?.employeeId || DEPT_LABELS[user?.department]}</p>
                                          </div>
                                    </div>
                                    <button type="button" onClick={handleLogout}
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-xl font-medium">
                                          <LogOut className="w-4 h-4" /> Logout
                                    </button>
                              </div>
                        </div>
                  </nav>

                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h1 className="text-2xl font-black text-gray-900 mb-1">Officer Dashboard</h1>
                        <p className="text-gray-500 text-sm mb-8">{DEPT_LABELS[user?.department] || 'Department'} · Real-time complaint management</p>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
                              {[
                                    { icon: Clock, label: 'Pending', value: stats?.pending ?? 0, bg: 'bg-amber-50' },
                                    { icon: ClipboardList, label: 'Accepted', value: stats?.assigned ?? 0, bg: 'bg-blue-50' },
                                    { icon: BarChart3, label: 'In Progress', value: stats?.inProgress ?? 0, bg: 'bg-indigo-50' },
                                    { icon: CheckCircle2, label: 'Solved', value: stats?.resolved ?? 0, bg: 'bg-emerald-50' },
                                    { icon: AlertTriangle, label: 'Overdue', value: stats?.overdue ?? 0, bg: 'bg-red-50' },
                              ].map((s, i) => (
                                    <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                          className={`${s.bg} rounded-2xl p-4 border border-white shadow-sm`}>
                                          <s.icon className="w-5 h-5 text-slate-600 mb-2" />
                                          <p className="text-2xl font-black">{s.value}</p>
                                          <p className="text-xs text-slate-500">{s.label}</p>
                                    </motion.div>
                              ))}
                        </div>

                        {performance && (
                              <div className="glass rounded-2xl border p-5 mb-6 text-sm text-slate-600">
                                    Resolution rate: <strong>{performance.resolutionRate}%</strong> ·
                                    Avg. resolution: <strong>{performance.avgResolutionHrs}h</strong>
                              </div>
                        )}

                        <motion.div className="flex flex-wrap gap-2 mb-4">
                              {['', 'pending', 'assigned', 'in_progress', 'resolved'].map((s) => (
                                    <button key={s || 'all'} type="button" onClick={() => setFilter(s)}
                                          className={`px-3 py-1.5 rounded-full text-xs font-bold ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>
                                          {s ? s.replace('_', ' ') : 'All'}
                                    </button>
                              ))}
                        </motion.div>

                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                              <motion.div className="p-4 border-b font-bold text-slate-900">Department Complaints</motion.div>
                              <div className="divide-y">
                                    {complaints.length === 0 ? (
                                          <p className="p-8 text-center text-slate-500 text-sm">No complaints in this filter.</p>
                                    ) : complaints.map((c) => (
                                          <button key={c._id} type="button" onClick={() => openDetail(c)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 text-left">
                                                <div>
                                                      <p className="font-semibold text-slate-800">{c.title}</p>
                                                      <p className="text-xs text-slate-400">{c.complaintId} · {deptLabel(c.category)}</p>
                                                </div>
                                                <motion.div className="flex items-center gap-2">
                                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[c.priority] || ''}`}>{c.priority}</span>
                                                      <StatusBadge status={c.status} />
                                                      <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </motion.div>
                                          </button>
                                    ))}
                              </div>
                        </div>
                  </div>

                  <AnimatePresence>
                        {selected && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
                                    onClick={() => setSelected(null)}>
                                    <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
                                          <div className="flex justify-between items-start">
                                                <motion.div>
                                                      <p className="text-xs font-mono text-slate-500">{selected.complaintId}</p>
                                                      <h2 className="text-lg font-black">{selected.title}</h2>
                                                      <StatusBadge status={selected.status} />
                                                </motion.div>
                                                <button type="button" onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
                                          </div>

                                          <p className="text-sm text-slate-600">{selected.description}</p>

                                          <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-sm">
                                                <p className="flex items-center gap-2"><User className="w-4 h-4" /> {selected.citizen?.name}</p>
                                                <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {selected.citizen?.phone || selected.citizen?.email}</p>
                                                <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {selected.location?.address || 'No address'}</p>
                                          </div>

                                          <ComplaintMapView
                                                lat={selected.location?.coordinates?.lat}
                                                lng={selected.location?.coordinates?.lng}
                                                address={selected.location?.address}
                                          />

                                          {selected.attachments?.length > 0 && (
                                                <div className="flex gap-2 flex-wrap">
                                                      {selected.attachments.map((a, i) => (
                                                            <img key={i} src={a.url.startsWith('http') ? a.url : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${a.url}`}
                                                                  alt="" className="w-20 h-20 object-cover rounded-lg border" />
                                                      ))}
                                                </div>
                                          )}

                                          <textarea value={note} onChange={(e) => setNote(e.target.value)}
                                                placeholder="Resolution notes (optional)"
                                                className="w-full px-3 py-2 border rounded-xl text-sm min-h-[80px]" />

                                          <div className="grid grid-cols-2 gap-2">
                                                {selected.status === 'pending' && (
                                                      <button type="button" disabled={actionLoading}
                                                            onClick={() => runAction(() => acceptComplaint(selected._id), 'Complaint accepted')}
                                                            className="col-span-2 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm">
                                                            Accept Complaint
                                                      </button>
                                                )}
                                                {['pending', 'assigned'].includes(selected.status) && (
                                                      <button type="button" disabled={actionLoading}
                                                            onClick={() => runAction(() => updateOfficerComplaintStatus(selected._id, 'in_progress', note), 'Marked in progress')}
                                                            className="py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm">
                                                            In Progress
                                                      </button>
                                                )}
                                                {selected.status !== 'resolved' && selected.status !== 'rejected' && (
                                                      <button type="button" disabled={actionLoading}
                                                            onClick={() => runAction(() => updateOfficerComplaintStatus(selected._id, 'resolved', note), 'Marked as solved')}
                                                            className="py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm">
                                                            Mark Solved
                                                      </button>
                                                )}
                                                {selected.status !== 'rejected' && selected.status !== 'resolved' && (
                                                      <button type="button" disabled={actionLoading}
                                                            onClick={() => runAction(() => updateOfficerComplaintStatus(selected._id, 'rejected', note), 'Complaint rejected')}
                                                            className="py-3 bg-red-100 text-red-700 font-bold rounded-xl text-sm">
                                                            Reject
                                                      </button>
                                                )}
                                                {note.trim() && (
                                                      <button type="button" disabled={actionLoading}
                                                            onClick={() => runAction(() => addOfficerNote(selected._id, note), 'Note added')}
                                                            className="col-span-2 py-2 border rounded-xl text-sm font-semibold">
                                                            Add Note Only
                                                      </button>
                                                )}
                                          </div>
                                    </motion.div>
                              </motion.div>
                        )}
                  </AnimatePresence>
            </motion.div>
      );
}
