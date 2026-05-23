import React, { useEffect, useState } from 'react';
import { Loader2, User, Eye, ShieldOff, ShieldCheck, Copy, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminOfficers, toggleBlockOfficer, createOfficer } from '../../api/admin';
import { deptLabel } from '../../utils/departmentMeta';
import OfficerDetailModal from './OfficerDetailModal';

const DEPT_LABELS = {
      police: 'Police', electricity: 'Electricity', water_supply: 'Water Supply',
      roads_transport: 'Roads & Transport', healthcare: 'Healthcare',
      municipal: 'Municipal Services', sanitation: 'Sanitation', education: 'Education',
};

// ── Block Confirmation Dialog ─────────────────────────────────────────────────
function BlockConfirmDialog({ officer, onConfirm, onCancel, loading }) {
      const [reason, setReason] = useState('');

      return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
                  <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                  >
                        <div className="flex items-start gap-3 mb-4">
                              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                                    <ShieldOff className="w-5 h-5 text-rose-400" />
                              </div>
                              <div>
                                    <h3 className="text-white font-bold text-lg">Block Officer</h3>
                                    <p className="text-slate-400 text-sm mt-0.5">
                                          This will immediately revoke <strong className="text-white">{officer?.name}</strong>'s access.
                                    </p>
                              </div>
                        </div>

                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4">
                              <p className="text-xs text-rose-300 font-medium mb-1">After blocking:</p>
                              <ul className="space-y-0.5 text-xs text-rose-400">
                                    <li>❌ Officer cannot login</li>
                                    <li>❌ Existing JWT session invalidated immediately</li>
                                    <li>❌ Dashboard access revoked</li>
                                    <li>❌ Cannot update or manage complaints</li>
                              </ul>
                        </div>

                        <div className="mb-4">
                              <label className="text-sm text-slate-300 font-medium block mb-1.5">
                                    Block Reason <span className="text-slate-500">(optional)</span>
                              </label>
                              <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Misconduct, policy violation, investigation..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
                              />
                        </div>

                        <div className="flex gap-2">
                              <button
                                    type="button"
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors disabled:opacity-50"
                              >
                                    Cancel
                              </button>
                              <button
                                    type="button"
                                    onClick={() => onConfirm(reason)}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                              >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Blocking...</> : <><ShieldOff className="w-4 h-4" /> Block Officer</>}
                              </button>
                        </div>
                  </motion.div>
            </div>
      );
}

// ── Unblock Confirmation Dialog ───────────────────────────────────────────────
function UnblockConfirmDialog({ officer, onConfirm, onCancel, loading }) {
      return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
                  <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                  >
                        <div className="flex items-start gap-3 mb-4">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div>
                                    <h3 className="text-white font-bold text-lg">Unblock Officer</h3>
                                    <p className="text-slate-400 text-sm mt-0.5">
                                          Restore full access for <strong className="text-white">{officer?.name}</strong>.
                                    </p>
                              </div>
                        </div>

                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
                              <p className="text-xs text-emerald-300 font-medium mb-1">After unblocking:</p>
                              <ul className="space-y-0.5 text-xs text-emerald-400">
                                    <li>✅ Officer can login normally</li>
                                    <li>✅ Dashboard access restored</li>
                                    <li>✅ Can manage and update complaints</li>
                              </ul>
                        </div>

                        {officer?.blockReason && (
                              <div className="p-3 bg-white/5 rounded-xl mb-4 text-xs text-slate-400">
                                    <span className="text-slate-500">Previous block reason: </span>
                                    <span className="text-slate-300">{officer.blockReason}</span>
                              </div>
                        )}

                        <div className="flex gap-2">
                              <button
                                    type="button"
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors disabled:opacity-50"
                              >
                                    Cancel
                              </button>
                              <button
                                    type="button"
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                              >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Unblocking...</> : <><ShieldCheck className="w-4 h-4" /> Unblock Officer</>}
                              </button>
                        </div>
                  </motion.div>
            </div>
      );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminOfficers() {
      const [loading, setLoading] = useState(true);
      const [officers, setOfficers] = useState([]);
      const [selectedId, setSelectedId] = useState(null);
      const [blockTarget, setBlockTarget] = useState(null);   // officer to block
      const [unblockTarget, setUnblockTarget] = useState(null); // officer to unblock
      const [actionLoading, setActionLoading] = useState(false);
      const [createOpen, setCreateOpen] = useState(false);
      const [creating, setCreating] = useState(false);
      const [form, setForm] = useState({ name: '', email: '', mobile: '' });
      const [createdOfficer, setCreatedOfficer] = useState(null);
      const [copied, setCopied] = useState(false);

      const load = async () => {
            setLoading(true);
            try {
                  const res = await getAdminOfficers({ limit: 200 });
                  setOfficers(res.data?.data || res.data?.officers || []);
            } catch (err) {
                  toast.error(err?.response?.data?.message || 'Failed to load officers');
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => { load(); }, []);

      // ── Block with reason ─────────────────────────────────────────────────────
      const handleBlock = async (reason) => {
            if (!blockTarget) return;
            setActionLoading(true);
            try {
                  await toggleBlockOfficer(blockTarget._id, reason);
                  toast.success(`🚫 Officer ${blockTarget.name} blocked successfully. Access revoked.`, { duration: 4000 });
                  setBlockTarget(null);
                  await load();
            } catch (err) {
                  toast.error(err?.response?.data?.message || 'Block failed');
            } finally {
                  setActionLoading(false);
            }
      };

      // ── Unblock ───────────────────────────────────────────────────────────────
      const handleUnblock = async () => {
            if (!unblockTarget) return;
            setActionLoading(true);
            try {
                  await toggleBlockOfficer(unblockTarget._id);
                  toast.success(`✅ Officer ${unblockTarget.name} unblocked. Access restored.`, { duration: 4000 });
                  setUnblockTarget(null);
                  await load();
            } catch (err) {
                  toast.error(err?.response?.data?.message || 'Unblock failed');
            } finally {
                  setActionLoading(false);
            }
      };

      // ── Toggle from detail modal (no reason prompt) ───────────────────────────
      const handleToggleFromModal = async (id) => {
            const officer = officers.find((o) => o._id === id);
            if (!officer) return;
            if (officer.isBlocked) {
                  setUnblockTarget(officer);
            } else {
                  setBlockTarget(officer);
            }
            setSelectedId(null);
      };

      const handleCreate = async (e) => {
            e.preventDefault();
            if (!form.name.trim() || !form.email.trim() || !form.mobile.trim()) {
                  return toast.error('Please fill all fields');
            }
            setCreating(true);
            try {
                  const res = await createOfficer({
                        name: form.name.trim(),
                        email: form.email.trim(),
                        mobile: form.mobile.trim(),
                  });
                  toast.success('Officer created — Employee ID generated');
                  setForm({ name: '', email: '', mobile: '' });
                  setCreatedOfficer(res.data?.data);
                  await load();
            } catch (err) {
                  toast.error(err?.response?.data?.message || 'Create failed');
            } finally {
                  setCreating(false);
            }
      };

      const copyEmpId = (id) => {
            navigator.clipboard.writeText(id).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
            });
      };

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                  {/* Header */}
                  <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-white">Officer Management</h1>
                        <button
                              onClick={() => { setCreateOpen(true); setCreatedOfficer(null); }}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors"
                        >
                              + Create Officer
                        </button>
                  </div>

                  {/* Officer table */}
                  {loading ? (
                        <div className="flex justify-center py-12">
                              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                        </div>
                  ) : officers.length === 0 ? (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
                              <User className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                              <p className="text-slate-400 font-semibold">No officers yet</p>
                              <p className="text-slate-500 text-sm mt-1">Create your first officer to get started</p>
                        </div>
                  ) : (
                        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
                              <table className="min-w-full text-sm">
                                    <thead>
                                          <tr className="text-left text-slate-400 text-xs border-b border-white/10">
                                                <th className="px-4 py-3 font-semibold">Name</th>
                                                <th className="px-4 py-3 font-semibold">Employee ID</th>
                                                <th className="px-4 py-3 font-semibold">Department</th>
                                                <th className="px-4 py-3 font-semibold">Assigned</th>
                                                <th className="px-4 py-3 font-semibold">Pending</th>
                                                <th className="px-4 py-3 font-semibold">Resolved</th>
                                                <th className="px-4 py-3 font-semibold">Resolution %</th>
                                                <th className="px-4 py-3 font-semibold">Last Active</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                                <th className="px-4 py-3 font-semibold">Actions</th>
                                          </tr>
                                    </thead>
                                    <tbody>
                                          {officers.map((o) => (
                                                <tr key={o._id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                                      <td className="px-4 py-3 text-white font-medium">{o.name}</td>
                                                      <td className="px-4 py-3">
                                                            <span className="font-mono text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg">
                                                                  {o.employeeId || '—'}
                                                            </span>
                                                      </td>
                                                      <td className="px-4 py-3 text-slate-300">{deptLabel(o.department)}</td>
                                                      <td className="px-4 py-3 text-slate-300">{o.complaintsAssigned ?? 0}</td>
                                                      <td className="px-4 py-3 text-amber-400">{o.complaintsPending ?? 0}</td>
                                                      <td className="px-4 py-3 text-emerald-400">{o.complaintsSolved ?? 0}</td>
                                                      <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                        <div
                                                                              className="h-full bg-emerald-500 rounded-full"
                                                                              style={{ width: `${o.resolutionRate ?? 0}%` }}
                                                                        />
                                                                  </div>
                                                                  <span className="text-slate-300 text-xs">{o.resolutionRate ?? 0}%</span>
                                                            </div>
                                                      </td>
                                                      <td className="px-4 py-3 text-slate-400 text-xs">
                                                            {o.lastActive ? new Date(o.lastActive).toLocaleString() : '—'}
                                                      </td>
                                                      <td className="px-4 py-3">
                                                            {o.isBlocked ? (
                                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-600/20 text-rose-400 text-xs font-semibold">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                        Blocked
                                                                  </span>
                                                            ) : !o.password ? (
                                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                        Pending
                                                                  </span>
                                                            ) : (
                                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-semibold">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                        Active
                                                                  </span>
                                                            )}
                                                      </td>
                                                      <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                  <button
                                                                        title="View details"
                                                                        onClick={() => setSelectedId(o._id)}
                                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                                                  >
                                                                        <Eye className="w-4 h-4" />
                                                                  </button>
                                                                  {o.isBlocked ? (
                                                                        <button
                                                                              title="Unblock officer — restore access"
                                                                              onClick={() => setUnblockTarget(o)}
                                                                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors"
                                                                        >
                                                                              <ShieldCheck className="w-3.5 h-3.5" />
                                                                              Unblock
                                                                        </button>
                                                                  ) : (
                                                                        <button
                                                                              title="Block officer — revoke access"
                                                                              onClick={() => setBlockTarget(o)}
                                                                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-semibold transition-colors"
                                                                        >
                                                                              <ShieldOff className="w-3.5 h-3.5" />
                                                                              Block
                                                                        </button>
                                                                  )}
                                                            </div>
                                                      </td>
                                                </tr>
                                          ))}
                                    </tbody>
                              </table>
                        </div>
                  )}

                  {/* ── Officer Detail Modal ───────────────────────────────────────── */}
                  <AnimatePresence>
                        {selectedId && (
                              <OfficerDetailModal
                                    officerId={selectedId}
                                    onClose={() => setSelectedId(null)}
                                    onToggleBlock={handleToggleFromModal}
                              />
                        )}
                  </AnimatePresence>

                  {/* ── Block Confirmation Dialog ──────────────────────────────────── */}
                  <AnimatePresence>
                        {blockTarget && (
                              <BlockConfirmDialog
                                    officer={blockTarget}
                                    onConfirm={handleBlock}
                                    onCancel={() => setBlockTarget(null)}
                                    loading={actionLoading}
                              />
                        )}
                  </AnimatePresence>

                  {/* ── Unblock Confirmation Dialog ────────────────────────────────── */}
                  <AnimatePresence>
                        {unblockTarget && (
                              <UnblockConfirmDialog
                                    officer={unblockTarget}
                                    onConfirm={handleUnblock}
                                    onCancel={() => setUnblockTarget(null)}
                                    loading={actionLoading}
                              />
                        )}
                  </AnimatePresence>

                  {/* ── Create Officer Modal ─────────────────────────────────────────── */}
                  {createOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
                                    <div className="flex justify-between items-start mb-4">
                                          <div>
                                                <h2 className="text-xl font-bold text-white">Create Officer</h2>
                                                <p className="text-sm text-slate-400 mt-0.5">
                                                      Employee ID auto-generated · Welcome email sent automatically
                                                </p>
                                          </div>
                                          <button
                                                onClick={() => { setCreateOpen(false); setCreatedOfficer(null); }}
                                                className="text-slate-400 hover:text-white text-sm"
                                          >✕</button>
                                    </div>

                                    {/* Post-creation confirmation */}
                                    {createdOfficer ? (
                                          <div className="space-y-4">
                                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                                      <div className="flex items-center gap-2 mb-3">
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            <span className="text-emerald-400 font-bold">Officer Created Successfully</span>
                                                      </div>
                                                      <div className="space-y-1.5 text-sm text-slate-300">
                                                            <div><span className="text-slate-500">Name:</span> {createdOfficer.name}</div>
                                                            <div><span className="text-slate-500">Email:</span> {createdOfficer.email}</div>
                                                            <div><span className="text-slate-500">Department:</span> {DEPT_LABELS[createdOfficer.department] || createdOfficer.department}</div>
                                                      </div>
                                                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                                                            <p className="text-xs text-slate-400 mb-1">Employee ID</p>
                                                            <p className="text-2xl font-black font-mono text-blue-300 tracking-widest">{createdOfficer.employeeId}</p>
                                                      </div>
                                                      <button
                                                            onClick={() => copyEmpId(createdOfficer.employeeId)}
                                                            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-colors"
                                                      >
                                                            {copied
                                                                  ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Copied!</>
                                                                  : <><Copy className="w-4 h-4" /> Copy Employee ID</>}
                                                      </button>
                                                </div>

                                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                                                      📧 Welcome email with registration instructions sent to <strong>{createdOfficer.email}</strong>.
                                                      Officer must visit <strong>/officer/register</strong> to complete setup.
                                                </div>

                                                <div className="flex gap-2">
                                                      <button
                                                            onClick={() => { setCreatedOfficer(null); setForm({ name: '', email: '', mobile: '' }); }}
                                                            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors"
                                                      >
                                                            Create Another
                                                      </button>
                                                      <button
                                                            onClick={() => { setCreateOpen(false); setCreatedOfficer(null); }}
                                                            className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors"
                                                      >
                                                            Done
                                                      </button>
                                                </div>
                                          </div>
                                    ) : (
                                          <form onSubmit={handleCreate} className="space-y-4">
                                                <div>
                                                      <label className="text-sm text-slate-300 font-medium">Full Name</label>
                                                      <input
                                                            value={form.name}
                                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                            placeholder="Officer full name"
                                                            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                                                      />
                                                </div>
                                                <div>
                                                      <label className="text-sm text-slate-300 font-medium">Official Email</label>
                                                      <input
                                                            type="email"
                                                            value={form.email}
                                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                            placeholder="officer@gov.in"
                                                            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                                                      />
                                                </div>
                                                <div>
                                                      <label className="text-sm text-slate-300 font-medium">Mobile Number</label>
                                                      <input
                                                            value={form.mobile}
                                                            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                                            placeholder="10-digit mobile"
                                                            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                                                      />
                                                </div>
                                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                                                      ℹ️ Department is inherited from your admin account.
                                                      Employee ID is auto-generated (e.g. POL-2026-001).
                                                </div>
                                                <div className="flex gap-2 pt-1">
                                                      <button
                                                            type="button"
                                                            onClick={() => setCreateOpen(false)}
                                                            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors"
                                                      >
                                                            Cancel
                                                      </button>
                                                      <button
                                                            type="submit"
                                                            disabled={creating}
                                                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                                      >
                                                            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Officer'}
                                                      </button>
                                                </div>
                                          </form>
                                    )}
                              </div>
                        </div>
                  )}

            </motion.div>
      );
}
