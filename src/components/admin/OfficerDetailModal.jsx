import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
      X, User, BadgeCheck, Phone, Mail, Building2, Calendar, Clock,
      Shield, ShieldOff, Activity, ClipboardList, CheckCircle2, AlertTriangle,
      Zap, BarChart3, MapPin, ChevronRight, Eye, ArrowLeft, Loader2,
      TrendingUp, Star, Timer, FileText, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getOfficerDetail } from '../../api/admin';
import { deptLabel } from '../../utils/departmentMeta';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
      emergency: { label: 'Emergency', bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
      high: { label: 'High', bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500' },
      medium: { label: 'Medium', bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
      low: { label: 'Low', bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
};

const STATUS_CONFIG = {
      pending: { label: 'Pending', bg: 'bg-slate-500/20', text: 'text-slate-300' },
      assigned: { label: 'Assigned', bg: 'bg-blue-500/20', text: 'text-blue-400' },
      in_progress: { label: 'In Progress', bg: 'bg-violet-500/20', text: 'text-violet-400' },
      resolved: { label: 'Resolved', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
      closed: { label: 'Closed', bg: 'bg-slate-600/20', text: 'text-slate-400' },
      rejected: { label: 'Rejected', bg: 'bg-rose-500/20', text: 'text-rose-400' },
};

const TIMELINE_ICONS = {
      pending: '📋',
      assigned: '👤',
      in_progress: '⚙️',
      resolved: '✅',
      closed: '🔒',
      rejected: '❌',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function PriorityBadge({ priority }) {
      const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
      return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {c.label}
            </span>
      );
}

function StatusBadge({ status }) {
      const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
      return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
                  {c.label}
            </span>
      );
}

// ── OpenStreetMap embed (no API key needed) ───────────────────────────────────
function ComplaintMap({ lat, lng, title }) {
      if (!lat || !lng) {
            return (
                  <div className="w-full h-40 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <div className="text-center">
                              <MapPin className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                              <p className="text-xs text-slate-500">No location data</p>
                        </div>
                  </div>
            );
      }
      const zoom = 15;
      const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
      const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
      return (
            <div className="rounded-xl overflow-hidden border border-white/10">
                  <iframe
                        title={title || 'Complaint Location'}
                        src={osmUrl}
                        width="100%"
                        height="180"
                        style={{ border: 0 }}
                        loading="lazy"
                  />
                  <a
                        href={osmLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 text-xs text-blue-400 transition-colors"
                  >
                        <MapPin className="w-3 h-3" /> Open in OpenStreetMap
                  </a>
            </div>
      );
}

// ── Complaint Detail Modal (nested) ──────────────────────────────────────────
function ComplaintDetailModal({ complaint, onClose }) {
      if (!complaint) return null;
      const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

      return (
            <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
                  onClick={onClose}
            >
                  <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                  >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-start justify-between">
                              <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                          <span className="font-mono text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                                                {complaint.complaintId}
                                          </span>
                                          {complaint.isEmergency && (
                                                <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                                                      🚨 EMERGENCY
                                                </span>
                                          )}
                                          <PriorityBadge priority={complaint.priority} />
                                          <StatusBadge status={complaint.status} />
                                    </div>
                                    <h2 className="text-lg font-black text-white leading-tight">{complaint.title}</h2>
                              </div>
                              <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                              >
                                    <X className="w-5 h-5" />
                              </button>
                        </div>

                        <div className="p-6 space-y-6">
                              {/* Description */}
                              <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                    <p className="text-sm text-slate-300 leading-relaxed bg-white/5 rounded-xl p-4">
                                          {complaint.description || 'No description provided.'}
                                    </p>
                              </div>

                              {/* AI Priority */}
                              {complaint.aiPriorityReason && (
                                    <div className="flex items-start gap-3 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                                          <Zap className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                                          <div>
                                                <p className="text-xs font-semibold text-violet-400 mb-0.5">AI Priority Analysis</p>
                                                <p className="text-sm text-slate-300">{complaint.aiPriorityReason}</p>
                                          </div>
                                    </div>
                              )}

                              {/* Citizen Info */}
                              <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Citizen Details</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                          {[
                                                { icon: User, label: 'Name', value: complaint.citizen?.name || '—' },
                                                { icon: Phone, label: 'Mobile', value: complaint.citizen?.phone || '—' },
                                                { icon: Mail, label: 'Email', value: complaint.citizen?.email || '—' },
                                                { icon: MapPin, label: 'Address', value: complaint.citizen?.address || complaint.location?.address || '—' },
                                          ].map(({ icon: Icon, label, value }) => (
                                                <div key={label} className="bg-white/5 rounded-xl p-3">
                                                      <div className="flex items-center gap-2 mb-1">
                                                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-xs text-slate-400">{label}</span>
                                                      </div>
                                                      <p className="text-sm text-white font-medium truncate">{value}</p>
                                                </div>
                                          ))}
                                    </div>
                              </div>

                              {/* Location + Map */}
                              <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Location</h3>
                                    <div className="space-y-2 mb-3">
                                          {complaint.location?.address && (
                                                <p className="text-sm text-slate-300 flex items-start gap-2">
                                                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                                      {complaint.location.address}
                                                      {complaint.location.city && `, ${complaint.location.city}`}
                                                      {complaint.location.state && `, ${complaint.location.state}`}
                                                      {complaint.location.pincode && ` - ${complaint.location.pincode}`}
                                                </p>
                                          )}
                                          {complaint.location?.coordinates?.lat && (
                                                <p className="text-xs text-slate-500 font-mono">
                                                      {complaint.location.coordinates.lat.toFixed(6)}, {complaint.location.coordinates.lng.toFixed(6)}
                                                </p>
                                          )}
                                    </div>
                                    <ComplaintMap
                                          lat={complaint.location?.coordinates?.lat}
                                          lng={complaint.location?.coordinates?.lng}
                                          title={complaint.title}
                                    />
                              </div>

                              {/* Evidence Images */}
                              {complaint.attachments?.length > 0 && (
                                    <div>
                                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                                Evidence ({complaint.attachments.length})
                                          </h3>
                                          <div className="grid grid-cols-3 gap-2">
                                                {complaint.attachments.map((att, i) => {
                                                      const src = att.url?.startsWith('http') ? att.url : `${apiBase}${att.url}`;
                                                      return (
                                                            <a key={i} href={src} target="_blank" rel="noreferrer" className="group relative">
                                                                  <img
                                                                        src={src}
                                                                        alt={`Evidence ${i + 1}`}
                                                                        className="w-full h-24 object-cover rounded-xl border border-white/10 group-hover:border-blue-500/50 transition-colors"
                                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                                  />
                                                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-colors flex items-center justify-center">
                                                                        <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                  </div>
                                                            </a>
                                                      );
                                                })}
                                          </div>
                                    </div>
                              )}

                              {/* Meta */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-white/5 rounded-xl p-3">
                                          <p className="text-xs text-slate-400 mb-1">Department</p>
                                          <p className="text-white font-medium">{deptLabel(complaint.category)}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3">
                                          <p className="text-xs text-slate-400 mb-1">Filed On</p>
                                          <p className="text-white font-medium">{fmtDate(complaint.createdAt)}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3">
                                          <p className="text-xs text-slate-400 mb-1">Last Updated</p>
                                          <p className="text-white font-medium">{fmt(complaint.updatedAt)}</p>
                                    </div>
                                    {complaint.resolvedAt && (
                                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                                                <p className="text-xs text-emerald-400 mb-1">Resolved On</p>
                                                <p className="text-emerald-300 font-medium">{fmt(complaint.resolvedAt)}</p>
                                          </div>
                                    )}
                              </div>

                              {/* Timeline */}
                              {complaint.timeline?.length > 0 && (
                                    <div>
                                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                                                Complaint Timeline
                                          </h3>
                                          <div className="relative">
                                                <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                                                <div className="space-y-4">
                                                      {complaint.timeline.map((t, i) => (
                                                            <div key={i} className="relative flex gap-4 pl-10">
                                                                  <div className="absolute left-0 w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm z-10">
                                                                        {TIMELINE_ICONS[t.status] || '📌'}
                                                                  </div>
                                                                  <div className="flex-1 bg-white/5 rounded-xl p-3 min-w-0">
                                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                                              <StatusBadge status={t.status} />
                                                                              <span className="text-xs text-slate-500 flex-shrink-0">{fmt(t.updatedAt)}</span>
                                                                        </div>
                                                                        {t.note && <p className="text-sm text-slate-300 mt-1">{t.note}</p>}
                                                                  </div>
                                                            </div>
                                                      ))}
                                                </div>
                                          </div>
                                    </div>
                              )}
                        </div>
                  </motion.div>
            </motion.div>
      );
}

// ── Main OfficerDetailModal ───────────────────────────────────────────────────
export default function OfficerDetailModal({ officerId, onClose, onToggleBlock }) {
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(true);
      const [selectedComplaint, setSelectedComplaint] = useState(null);
      const [statusFilter, setStatusFilter] = useState('');
      const [searchQ, setSearchQ] = useState('');

      const load = useCallback(async () => {
            if (!officerId) return;
            setLoading(true);
            try {
                  const res = await getOfficerDetail(officerId);
                  setData(res.data?.data || res.data);
            } catch (err) {
                  toast.error(err?.response?.data?.message || 'Failed to load officer details');
                  onClose();
            } finally {
                  setLoading(false);
            }
      }, [officerId, onClose]);

      useEffect(() => { load(); }, [load]);

      const complaints = (data?.assignedComplaints || []).filter((c) => {
            const matchStatus = !statusFilter || c.status === statusFilter;
            const matchSearch = !searchQ ||
                  c.title?.toLowerCase().includes(searchQ.toLowerCase()) ||
                  c.complaintId?.toLowerCase().includes(searchQ.toLowerCase()) ||
                  c.citizen?.name?.toLowerCase().includes(searchQ.toLowerCase());
            return matchStatus && matchSearch;
      });

      const officer = data;

      const statusDot = officer?.isBlocked
            ? { color: 'bg-rose-500', label: 'Blocked' }
            : officer?.status === 'active'
                  ? { color: 'bg-emerald-500', label: 'Active' }
                  : officer?.status === 'busy'
                        ? { color: 'bg-amber-500', label: 'Busy' }
                        : { color: 'bg-slate-500', label: officer?.status || 'Offline' };

      return (
            <>
                  <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-2 sm:p-4"
                        onClick={onClose}
                  >
                        <motion.div
                              initial={{ scale: 0.96, y: 16 }}
                              animate={{ scale: 1, y: 0 }}
                              exit={{ scale: 0.96, y: 16 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                              {loading ? (
                                    <div className="flex-1 flex items-center justify-center py-24">
                                          <div className="text-center">
                                                <Loader2 className="w-10 h-10 animate-spin text-blue-400 mx-auto mb-3" />
                                                <p className="text-slate-400 text-sm">Loading officer details…</p>
                                          </div>
                                    </div>
                              ) : !officer ? null : (
                                    <div className="flex-1 overflow-y-auto">

                                          {/* HERO HEADER */}
                                          <div className="relative bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-b border-white/10 p-6">
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-violet-600/5" />
                                                <div className="relative flex items-start justify-between gap-4">
                                                      <div className="flex items-center gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                  {officer.profileImage ? (
                                                                        <img src={officer.profileImage} alt={officer.name}
                                                                              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20" />
                                                                  ) : (
                                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black border-2 border-white/20">
                                                                              {officer.name?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                  )}
                                                                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${statusDot.color}`} />
                                                            </div>
                                                            <div>
                                                                  <h2 className="text-xl font-black text-white">{officer.name}</h2>
                                                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        <span className="font-mono text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-500/20">
                                                                              {officer.employeeId}
                                                                        </span>
                                                                        <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg">
                                                                              {deptLabel(officer.department)}
                                                                        </span>
                                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${officer.isBlocked ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                                                                              }`}>
                                                                              {statusDot.label}
                                                                        </span>
                                                                  </div>
                                                            </div>
                                                      </div>
                                                      <div className="flex items-center gap-2 flex-shrink-0">
                                                            {onToggleBlock && (
                                                                  <button
                                                                        onClick={() => onToggleBlock(officer._id)}
                                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${officer.isBlocked
                                                                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                                                    : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                                                              }`}
                                                                  >
                                                                        {officer.isBlocked ? '🔓 Unblock' : '🔒 Block'}
                                                                  </button>
                                                            )}
                                                            <button onClick={onClose}
                                                                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                                                  <X className="w-5 h-5" />
                                                            </button>
                                                      </div>
                                                </div>

                                                <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                      {[
                                                            { icon: Mail, label: 'Email', value: officer.email },
                                                            { icon: Phone, label: 'Mobile', value: officer.mobile || '—' },
                                                            { icon: Calendar, label: 'Joined', value: fmtDate(officer.createdAt) },
                                                            { icon: Clock, label: 'Last Active', value: officer.lastActive ? fmt(officer.lastActive) : '—' },
                                                      ].map(({ icon: Icon, label, value }) => (
                                                            <div key={label} className="bg-white/5 rounded-xl px-3 py-2">
                                                                  <div className="flex items-center gap-1.5 mb-0.5">
                                                                        <Icon className="w-3 h-3 text-slate-400" />
                                                                        <span className="text-xs text-slate-400">{label}</span>
                                                                  </div>
                                                                  <p className="text-xs text-white font-medium truncate">{value}</p>
                                                            </div>
                                                      ))}
                                                </div>
                                          </div>

                                          {/* ANALYTICS */}
                                          <div className="p-6 border-b border-white/10">
                                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Performance Analytics</h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                                      {[
                                                            { icon: ClipboardList, label: 'Total Assigned', value: officer.complaintsAssigned ?? 0, color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20' },
                                                            { icon: AlertTriangle, label: 'Pending', value: officer.complaintsPending ?? 0, color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20' },
                                                            { icon: Activity, label: 'In Progress', value: officer.complaintsInProgress ?? 0, color: 'text-violet-400', bg: 'from-violet-500/10 to-violet-600/5', border: 'border-violet-500/20' },
                                                            { icon: CheckCircle2, label: 'Resolved', value: officer.complaintsSolved ?? 0, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20' },
                                                      ].map(({ icon: Icon, label, value, color, bg, border }) => (
                                                            <div key={label} className={`bg-gradient-to-br ${bg} border ${border} rounded-2xl p-4`}>
                                                                  <Icon className={`w-5 h-5 ${color} mb-2`} />
                                                                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                                                                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                                                            </div>
                                                      ))}
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                      {[
                                                            { icon: TrendingUp, label: 'Resolution Rate', value: `${officer.resolutionRate ?? 0}%`, color: 'text-cyan-400' },
                                                            { icon: Timer, label: 'Avg Resolution', value: `${officer.avgResolutionHrs ?? 0}h`, color: 'text-indigo-400' },
                                                            { icon: AlertTriangle, label: 'Emergency', value: officer.emergencyCount ?? 0, color: 'text-red-400' },
                                                            { icon: Star, label: 'Perf. Score', value: `${officer.performanceScore ?? 0}/100`, color: 'text-yellow-400' },
                                                      ].map(({ icon: Icon, label, value, color }) => (
                                                            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                                  <Icon className={`w-4 h-4 ${color} mb-2`} />
                                                                  <p className={`text-xl font-black ${color}`}>{value}</p>
                                                                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                                                            </div>
                                                      ))}
                                                </div>
                                                <div className="mt-4 bg-white/5 rounded-xl p-4">
                                                      <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs text-slate-400">Resolution Progress</span>
                                                            <span className="text-xs font-bold text-emerald-400">{officer.resolutionRate ?? 0}%</span>
                                                      </div>
                                                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <motion.div
                                                                  initial={{ width: 0 }}
                                                                  animate={{ width: `${officer.resolutionRate ?? 0}%` }}
                                                                  transition={{ duration: 1, ease: 'easeOut' }}
                                                                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                                                            />
                                                      </div>
                                                </div>
                                          </div>

                                          {/* COMPLAINTS TABLE */}
                                          <div className="p-6">
                                                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                            Assigned Complaints ({complaints.length})
                                                      </h3>
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                            <input
                                                                  type="text"
                                                                  placeholder="Search…"
                                                                  value={searchQ}
                                                                  onChange={(e) => setSearchQ(e.target.value)}
                                                                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-36"
                                                            />
                                                            <select
                                                                  value={statusFilter}
                                                                  onChange={(e) => setStatusFilter(e.target.value)}
                                                                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                                            >
                                                                  <option value="">All Status</option>
                                                                  <option value="pending">Pending</option>
                                                                  <option value="assigned">Assigned</option>
                                                                  <option value="in_progress">In Progress</option>
                                                                  <option value="resolved">Resolved</option>
                                                                  <option value="rejected">Rejected</option>
                                                            </select>
                                                      </div>
                                                </div>

                                                {complaints.length === 0 ? (
                                                      <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                                            <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                                            <p className="text-slate-400 font-semibold">No complaints found</p>
                                                            <p className="text-slate-500 text-sm mt-1">
                                                                  {statusFilter || searchQ ? 'Try adjusting your filters' : 'No complaints assigned yet'}
                                                            </p>
                                                      </div>
                                                ) : (
                                                      <div className="rounded-2xl border border-white/10 overflow-hidden">
                                                            <div className="overflow-x-auto">
                                                                  <table className="min-w-full text-sm">
                                                                        <thead>
                                                                              <tr className="bg-white/5 text-left text-slate-400 text-xs border-b border-white/10">
                                                                                    <th className="px-4 py-3 font-semibold">Complaint</th>
                                                                                    <th className="px-4 py-3 font-semibold">Citizen</th>
                                                                                    <th className="px-4 py-3 font-semibold">Priority</th>
                                                                                    <th className="px-4 py-3 font-semibold">Status</th>
                                                                                    <th className="px-4 py-3 font-semibold">Location</th>
                                                                                    <th className="px-4 py-3 font-semibold">Date</th>
                                                                                    <th className="px-4 py-3 font-semibold">Action</th>
                                                                              </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                              {complaints.map((c) => (
                                                                                    <tr key={c._id}
                                                                                          className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                                                                          onClick={() => setSelectedComplaint(c)}
                                                                                    >
                                                                                          <td className="px-4 py-3">
                                                                                                <div className="flex items-start gap-2">
                                                                                                      {c.isEmergency && <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">🚨</span>}
                                                                                                      <div className="min-w-0">
                                                                                                            <p className="text-white font-medium text-sm truncate max-w-[180px]">{c.title}</p>
                                                                                                            <p className="text-xs text-slate-500 font-mono">{c.complaintId}</p>
                                                                                                      </div>
                                                                                                </div>
                                                                                          </td>
                                                                                          <td className="px-4 py-3">
                                                                                                <p className="text-slate-300 text-sm">{c.citizen?.name || '—'}</p>
                                                                                                <p className="text-xs text-slate-500">{c.citizen?.phone || '—'}</p>
                                                                                          </td>
                                                                                          <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                                                                                          <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                                                                          <td className="px-4 py-3">
                                                                                                <p className="text-xs text-slate-400 max-w-[120px] truncate">
                                                                                                      {c.location?.city || c.location?.address || '—'}
                                                                                                </p>
                                                                                          </td>
                                                                                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                                                                                                {fmtDate(c.createdAt)}
                                                                                          </td>
                                                                                          <td className="px-4 py-3">
                                                                                                <button
                                                                                                      onClick={(e) => { e.stopPropagation(); setSelectedComplaint(c); }}
                                                                                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-semibold transition-colors"
                                                                                                >
                                                                                                      <Eye className="w-3.5 h-3.5" /> View
                                                                                                </button>
                                                                                          </td>
                                                                                    </tr>
                                                                              ))}
                                                                        </tbody>
                                                                  </table>
                                                            </div>
                                                      </div>
                                                )}
                                          </div>

                                    </div>
                              )}
                        </motion.div>
                  </motion.div>

                  <AnimatePresence>
                        {selectedComplaint && (
                              <ComplaintDetailModal
                                    complaint={selectedComplaint}
                                    onClose={() => setSelectedComplaint(null)}
                              />
                        )}
                  </AnimatePresence>
            </>
      );
}