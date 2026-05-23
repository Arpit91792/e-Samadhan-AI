import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap, LogOut, ClipboardList, CheckCircle2, Clock, AlertTriangle,
  BarChart3, ChevronRight, X, MapPin, Phone, User, Loader2,
  Inbox, UserCheck, RefreshCw, Siren,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  readStoredOfficer,
  readStoredOfficerToken,
  clearOfficerSession,
} from '../../utils/authStorage';
import { useSocket } from '../../hooks/useSocket';
import {
  getOfficerDashboard,
  getDepartmentQueue,
  getOfficerComplaints,
  selfAssignComplaint,
  updateOfficerComplaintStatus,
  addOfficerNote,
  getOfficerPerformance,
} from '../../api/officer';
import ComplaintMapView from '../../components/maps/ComplaintMapView';
import StatusBadge from '../../components/citizen/StatusBadge';
import { deptLabel } from '../../utils/complaintConstants';

const PRIORITY_COLORS = {
  emergency: 'bg-red-100 text-red-700 border border-red-200',
  high: 'bg-orange-100 text-orange-700 border border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  low: 'bg-blue-100 text-blue-700 border border-blue-200',
};

function PriorityBadge({ priority }) {
  const cls = PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {priority === 'emergency' && <Siren className="w-3 h-3" />}
      {priority === 'high' && <AlertTriangle className="w-3 h-3" />}
      {(priority || 'low').charAt(0).toUpperCase() + (priority || 'low').slice(1)}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ComplaintCard({ complaint, onOpen, actionSlot }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <button type="button" onClick={() => onOpen(complaint)} className="text-left w-full">
            <p className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
              {complaint.isEmergency && <span className="text-red-500 mr-1">🚨</span>}
              {complaint.title}
            </p>
          </button>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{complaint.complaintId}</p>
        </div>
        <PriorityBadge priority={complaint.priority} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <StatusBadge status={complaint.status} />
        {complaint.citizen?.name && (
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{complaint.citizen.name}</span>
        )}
        {complaint.location?.address && (
          <span className="flex items-center gap-1 truncate max-w-[160px]">
            <MapPin className="w-3 h-3 shrink-0" />{complaint.location.address}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />{formatDate(complaint.createdAt)}</span>
      </div>
      {actionSlot}
    </motion.div>
  );
}

function DetailModal({ complaint, source, note, setNote, actionLoading, acceptingId, onClose, onAccept, onStatusUpdate, onAddNote }) {
  if (!complaint) return null;
  const isQueue = source === 'queue';
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-slate-400">{complaint.complaintId}</p>
            <h2 className="text-base font-black text-slate-900 leading-snug mt-0.5">{complaint.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              {complaint.isEmergency && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full animate-pulse">
                  🚨 EMERGENCY
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{complaint.description}</p>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-sm">
            <p className="flex items-center gap-2 text-slate-700"><User className="w-4 h-4 text-slate-400" />{complaint.citizen?.name || '—'}</p>
            <p className="flex items-center gap-2 text-slate-700"><Phone className="w-4 h-4 text-slate-400" />{complaint.citizen?.phone || complaint.citizen?.email || '—'}</p>
            <p className="flex items-center gap-2 text-slate-700"><MapPin className="w-4 h-4 text-slate-400" />{complaint.location?.address || 'No address'}</p>
          </div>
          <ComplaintMapView lat={complaint.location?.coordinates?.lat} lng={complaint.location?.coordinates?.lng} address={complaint.location?.address} />
          {complaint.attachments?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {complaint.attachments.map((a, i) => (
                <img key={i} src={a.url.startsWith('http') ? a.url : `${apiBase}${a.url}`} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
              ))}
            </div>
          )}
          {isQueue ? (
            <button type="button" disabled={actionLoading || acceptingId === complaint._id}
              onClick={() => onAccept(complaint)}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
              {acceptingId === complaint._id
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</>
                : <><UserCheck className="w-4 h-4" /> Accept Complaint</>}
            </button>
          ) : (
            <>
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Resolution notes (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
              <div className="grid grid-cols-2 gap-2">
                {complaint.status === 'assigned' && (
                  <button type="button" disabled={actionLoading}
                    onClick={() => onStatusUpdate(complaint._id, 'in_progress', note)}
                    className="col-span-2 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm disabled:opacity-60">
                    Start Working (In Progress)
                  </button>
                )}
                {complaint.status === 'in_progress' && (
                  <button type="button" disabled={actionLoading}
                    onClick={() => onStatusUpdate(complaint._id, 'resolved', note)}
                    className="col-span-2 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm disabled:opacity-60">
                    ✅ Mark as Resolved
                  </button>
                )}
                {complaint.status !== 'resolved' && complaint.status !== 'rejected' && (
                  <button type="button" disabled={actionLoading}
                    onClick={() => onStatusUpdate(complaint._id, 'rejected', note)}
                    className="py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-sm border border-red-200 disabled:opacity-60">
                    Reject
                  </button>
                )}
                {note.trim() && (
                  <button type="button" disabled={actionLoading}
                    onClick={() => onAddNote(complaint._id, note)}
                    className="py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 disabled:opacity-60">
                    Add Note
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function OfficerDashboard() {
  // ── Use officer-specific storage — NEVER reads admin/citizen session ──────
  const officer = readStoredOfficer();
  const navigate = useNavigate();

  // Officer logout — clears ONLY officer keys, never touches admin session
  const handleLogout = () => {
    clearOfficerSession();
    navigate('/login', { replace: true });
  };

  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueLoading, setQueueLoading] = useState(true);
  const [myComplaints, setMyComplaints] = useState([]);
  const [myTotal, setMyTotal] = useState(0);
  const [myLoading, setMyLoading] = useState(true);
  const [myFilter, setMyFilter] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const [selected, setSelected] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const [dashRes, perfRes] = await Promise.all([getOfficerDashboard(), getOfficerPerformance()]);
      setStats(dashRes.data.stats);
      setPerformance(perfRes.data.performance);
    } catch { /* non-fatal */ }
  }, []);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const res = await getDepartmentQueue({ limit: 50 });
      setQueue(res.data.queue || []);
      setQueueTotal(res.data.total ?? 0);
    } catch { toast.error('Failed to load department queue'); }
    finally { setQueueLoading(false); }
  }, []);

  const loadMyComplaints = useCallback(async () => {
    setMyLoading(true);
    try {
      const res = await getOfficerComplaints({ limit: 50, ...(myFilter ? { status: myFilter } : {}) });
      setMyComplaints(res.data.data || []);
      setMyTotal(res.data.total ?? 0);
    } catch { toast.error('Failed to load your complaints'); }
    finally { setMyLoading(false); }
  }, [myFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadQueue(); }, [loadQueue]);
  useEffect(() => { loadMyComplaints(); }, [loadMyComplaints]);

  useSocket({
    onComplaintUpdate: () => { loadStats(); loadMyComplaints(); },
    onNewComplaint: () => { loadQueue(); loadStats(); },
    onComplaintAccepted: (payload) => {
      const rid = payload?.complaintId || payload?._id;
      if (rid) {
        setQueue((prev) => prev.filter((c) => c._id !== rid && c.complaintId !== rid));
        setQueueTotal((t) => Math.max(0, t - 1));
      } else { loadQueue(); }
      loadStats();
    },
  }, { role: 'officer' });

  const handleAccept = async (complaint) => {
    setAcceptingId(complaint._id);
    try {
      await selfAssignComplaint(complaint._id);
      toast.success('Complaint accepted! Check My Complaints tab.');
      setQueue((prev) => prev.filter((c) => c._id !== complaint._id));
      setQueueTotal((t) => Math.max(0, t - 1));
      setSelected(null);
      loadStats();
      loadMyComplaints();
      setActiveTab('mine');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept complaint');
    } finally { setAcceptingId(null); }
  };

  const handleStatusUpdate = async (id, status, noteText) => {
    setActionLoading(true);
    try {
      await updateOfficerComplaintStatus(id, status, noteText);
      toast.success('Status updated to ' + status.replace('_', ' '));
      setSelected(null); setNote('');
      loadStats(); loadMyComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setActionLoading(false); }
  };

  const handleAddNote = async (id, noteText) => {
    setActionLoading(true);
    try {
      await addOfficerNote(id, noteText);
      toast.success('Note added');
      setSelected(null); setNote('');
      loadMyComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add note'); }
    finally { setActionLoading(false); }
  };

  const openDetail = (c, source) => { setSelected(c); setSelectedSource(source); setNote(''); };

  const statCards = [
    { icon: Inbox, label: 'Queue', value: queueTotal, bg: 'from-amber-50 to-orange-50', iconColor: 'text-amber-500', border: 'border-amber-100' },
    { icon: UserCheck, label: 'Accepted', value: stats?.assigned ?? 0, bg: 'from-blue-50 to-indigo-50', iconColor: 'text-blue-500', border: 'border-blue-100' },
    { icon: BarChart3, label: 'In Progress', value: stats?.inProgress ?? 0, bg: 'from-violet-50 to-purple-50', iconColor: 'text-violet-500', border: 'border-violet-100' },
    { icon: CheckCircle2, label: 'Resolved', value: stats?.resolved ?? 0, bg: 'from-emerald-50 to-green-50', iconColor: 'text-emerald-500', border: 'border-emerald-100' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <div>
              <span className="font-black text-base bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">e-Samadhan AI</span>
              <span className="ml-2 text-xs font-semibold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">Officer Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-black">
                {officer?.name?.charAt(0)?.toUpperCase() || 'O'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-700 leading-tight">{officer?.name?.split(' ')[0] || 'Officer'}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{officer?.employeeId && <span>{officer.employeeId} · </span>}{deptLabel(officer?.department)}</p>
              </div>
            </div>
            <button type="button" onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Officer Dashboard</h1>
          <p className="text-gray-500 text-sm">{deptLabel(officer?.department)} · Real-time complaint management</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`bg-gradient-to-br ${s.bg} rounded-2xl p-4 border ${s.border} shadow-sm`}>
              <s.icon className={`w-5 h-5 ${s.iconColor} mb-2`} />
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {performance && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 mb-6 flex flex-wrap gap-6 text-sm text-slate-600">
            <span>Resolution rate: <strong className="text-emerald-600">{performance.resolutionRate ?? 0}%</strong></span>
            <span>Avg. resolution: <strong className="text-blue-600">{performance.avgResolutionHrs ?? 0}h</strong></span>
          </div>
        )}

        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { key: 'queue', label: '📥 Department Queue', count: queueTotal, countBg: 'bg-amber-100 text-amber-700' },
            { key: 'mine', label: '📌 My Complaints', count: myTotal, countBg: 'bg-blue-100 text-blue-700' },
          ].map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/25 text-white' : tab.countBg
                  }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'queue' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-800">📥 Department Queue</h2>
                <p className="text-xs text-slate-500 mt-0.5">Unaccepted complaints for {deptLabel(officer?.department)} — first to accept gets ownership</p>
              </div>
              <button type="button" onClick={loadQueue} disabled={queueLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${queueLoading ? 'animate-spin' : ''}`} />Refresh
              </button>
            </div>
            {queueLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : queue.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-500">Queue is empty</p>
                <p className="text-sm text-slate-400 mt-1">No pending complaints in your department right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {queue.map((c) => (
                    <ComplaintCard key={c._id} complaint={c} onOpen={(x) => openDetail(x, 'queue')}
                      actionSlot={
                        <button type="button" disabled={acceptingId === c._id} onClick={() => handleAccept(c)}
                          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow disabled:opacity-60 flex items-center justify-center gap-2">
                          {acceptingId === c._id
                            ? <><Loader2 className="w-4 h-4 animate-spin" />Accepting...</>
                            : <><UserCheck className="w-4 h-4" />Accept Complaint</>}
                        </button>
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mine' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-800">📌 My Assigned Complaints</h2>
                <p className="text-xs text-slate-500 mt-0.5">Complaints you have accepted and are responsible for</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['', 'assigned', 'in_progress', 'resolved', 'rejected'].map((s) => (
                  <button key={s || 'all'} type="button" onClick={() => setMyFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${myFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                    {s ? s.replace('_', ' ') : 'All'}
                  </button>
                ))}
              </div>
            </div>
            {myLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : myComplaints.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-500">{myFilter ? `No ${myFilter.replace('_', ' ')} complaints` : 'No complaints assigned yet'}</p>
                <p className="text-sm text-slate-400 mt-1">{myFilter ? 'Try a different filter.' : 'Accept complaints from the Department Queue to get started.'}</p>
                {!myFilter && (
                  <button type="button" onClick={() => setActiveTab('queue')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
                    Go to Department Queue
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {myComplaints.map((c) => (
                    <ComplaintCard key={c._id} complaint={c} onOpen={(x) => openDetail(x, 'mine')}
                      actionSlot={
                        <button type="button" onClick={() => openDetail(c, 'mine')}
                          className="w-full py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                          <ChevronRight className="w-4 h-4" />View & Update
                        </button>
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <DetailModal complaint={selected} source={selectedSource} note={note} setNote={setNote}
            actionLoading={actionLoading} acceptingId={acceptingId}
            onClose={() => setSelected(null)} onAccept={handleAccept}
            onStatusUpdate={handleStatusUpdate} onAddNote={handleAddNote} />
        )}
      </AnimatePresence>
    </div>
  );
}
