import React, { useEffect, useState } from 'react';
import { Loader2, User, Eye, Slash, Copy, CheckCircle2 } from 'lucide-react';
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

export default function AdminOfficers() {
      const [loading, setLoading] = useState(true);
      const [officers, setOfficers] = useState([]);
      const [selectedId, setSelectedId] = useState(null);
      const [blocking, setBlocking] = useState(null);
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

      const handleToggleBlock = async (id) => {
            setBlocking(id);
            try {
                  await toggleBlockOfficer(id);
                  toast.success('Updated');
                  await load();
            } catch (err) {
                  toast.error(err?.response?.data?.message || 'Update failed');
            } finally {
                  setBlocking(null);
            }
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
                                                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-rose-600/20 text-rose-400 text-xs font-semibold">🔴 Blocked</span>
                                                            ) : !o.password ? (
                                                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">⏳ Pending</span>
                                                            ) : (
                                                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-semibold">🟢 Active</span>
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
                                                                  <button
                                                                        title={o.isBlocked ? 'Unblock officer' : 'Block officer'}
                                                                        onClick={() => handleToggleBlock(o._id)}
                                                                        disabled={blocking === o._id}
                                                                        className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${o.isBlocked ? 'text-emerald-400' : 'text-rose-400'}`}
                                                                  >
                                                                        <Slash className="w-4 h-4" />
                                                                  </button>
                                                            </div>
                                                      </td>
                                                </tr>
                                          ))}
                                    </tbody>
                              </table>
                        </div>
                  )}

                  {/* ── Officer Detail Modal (full-featured) ───────────────────────── */}
                  <AnimatePresence>
                        {selectedId && (
                              <OfficerDetailModal
                                    officerId={selectedId}
                                    onClose={() => setSelectedId(null)}
                                    onToggleBlock={async (id) => {
                                          await handleToggleBlock(id);
                                          setSelectedId(null);
                                    }}
                              />
                        )}
                  </AnimatePresence>

                  {/* ── Create Officer Modal ─────────────────────────────────────────────── */}
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
