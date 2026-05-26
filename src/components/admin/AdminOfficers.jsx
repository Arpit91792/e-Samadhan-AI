import React, { useEffect, useState } from 'react';
import { Loader2, User, Eye, ShieldOff, ShieldCheck, Copy, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getAdminOfficers, toggleBlockOfficer, createOfficer } from '../../api/admin';
import { deptLabel } from '../../utils/departmentMeta';
import OfficerDetailModal from './OfficerDetailModal';

// ── Block Confirmation Dialog ─────────────────────────────────────────────────
function BlockConfirmDialog({ officer, onConfirm, onCancel, loading }) {
      const { t } = useTranslation();
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
                                    <h3 className="text-white font-bold text-lg">{t('adminOfficersPage.blockOfficer')}</h3>
                                    <p className="text-slate-400 text-sm mt-0.5">
                                          {t('adminOfficersPage.blockDesc', { name: officer?.name })}
                                    </p>
                              </div>
                        </div>

                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4">
                              <p className="text-xs text-rose-300 font-medium mb-1">{t('adminOfficersPage.afterBlocking')}</p>
                              <ul className="space-y-0.5 text-xs text-rose-400">
                                    <li>{t('adminOfficersPage.cannotLogin')}</li>
                                    <li>{t('adminOfficersPage.sessionInvalidated')}</li>
                                    <li>{t('adminOfficersPage.dashboardRevoked')}</li>
                                    <li>{t('adminOfficersPage.cannotManage')}</li>
                              </ul>
                        </div>

                        <div className="mb-4">
                              <label className="text-sm text-slate-300 font-medium block mb-1.5">
                                    {t('adminOfficersPage.blockReason')} <span className="text-slate-500">{t('adminOfficersPage.optional')}</span>
                              </label>
                              <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={t('admin.blockReasonPlaceholder')}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
                              />
                        </div>

                        <div className="flex gap-2">
                              <button type="button" onClick={onCancel} disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                    {t('adminOfficersPage.cancel')}
                              </button>
                              <button type="button" onClick={() => onConfirm(reason)} disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading
                                          ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('adminOfficersPage.blocking')}</>
                                          : <><ShieldOff className="w-4 h-4" /> {t('adminOfficersPage.blockOfficer')}</>}
                              </button>
                        </div>
                  </motion.div>
            </div>
      );
}

// ── Unblock Confirmation Dialog ───────────────────────────────────────────────
function UnblockConfirmDialog({ officer, onConfirm, onCancel, loading }) {
      const { t } = useTranslation();

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
                                    <h3 className="text-white font-bold text-lg">{t('adminOfficersPage.unblockOfficer')}</h3>
                                    <p className="text-slate-400 text-sm mt-0.5">
                                          {t('adminOfficersPage.unblockDesc', { name: officer?.name })}
                                    </p>
                              </div>
                        </div>

                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
                              <p className="text-xs text-emerald-300 font-medium mb-1">{t('adminOfficersPage.afterUnblocking')}</p>
                              <ul className="space-y-0.5 text-xs text-emerald-400">
                                    <li>{t('adminOfficersPage.canLoginNormally')}</li>
                                    <li>{t('adminOfficersPage.dashboardRestored')}</li>
                                    <li>{t('adminOfficersPage.canManage')}</li>
                              </ul>
                        </div>

                        {officer?.blockReason && (
                              <div className="p-3 bg-white/5 rounded-xl mb-4 text-xs text-slate-400">
                                    <span className="text-slate-500">{t('adminOfficersPage.previousBlockReason')} </span>
                                    <span className="text-slate-300">{officer.blockReason}</span>
                              </div>
                        )}

                        <div className="flex gap-2">
                              <button type="button" onClick={onCancel} disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                    {t('adminOfficersPage.cancel')}
                              </button>
                              <button type="button" onClick={onConfirm} disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading
                                          ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('adminOfficersPage.unblocking')}</>
                                          : <><ShieldCheck className="w-4 h-4" /> {t('adminOfficersPage.unblockOfficer')}</>}
                              </button>
                        </div>
                  </motion.div>
            </div>
      );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminOfficers() {
      const { t } = useTranslation();
      const [loading, setLoading] = useState(true);
      const [officers, setOfficers] = useState([]);
      const [selectedId, setSelectedId] = useState(null);
      const [blockTarget, setBlockTarget] = useState(null);
      const [unblockTarget, setUnblockTarget] = useState(null);
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
                  toast.error(err?.response?.data?.message || t('adminOfficersPage.failedToLoad'));
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => { load(); }, []);

      const handleBlock = async (reason) => {
            if (!blockTarget) return;
            setActionLoading(true);
            try {
                  await toggleBlockOfficer(blockTarget._id, reason);
                  toast.success(`🚫 ${blockTarget.name} blocked. Access revoked.`, { duration: 4000 });
                  setBlockTarget(null);
                  await load();
            } catch (err) {
                  toast.error(err?.response?.data?.message || t('adminOfficersPage.blockFailed'));
            } finally {
                  setActionLoading(false);
            }
      };

      const handleUnblock = async () => {
            if (!unblockTarget) return;
            setActionLoading(true);
            try {
                  await toggleBlockOfficer(unblockTarget._id);
                  toast.success(`✅ ${unblockTarget.name} unblocked. Access restored.`, { duration: 4000 });
                  setUnblockTarget(null);
                  await load();
            } catch (err) {
                  toast.error(err?.response?.data?.message || t('adminOfficersPage.unblockFailed'));
            } finally {
                  setActionLoading(false);
            }
      };

      const handleToggleFromModal = async (id) => {
            const officer = officers.find((o) => o._id === id);
            if (!officer) return;
            if (officer.isBlocked) setUnblockTarget(officer);
            else setBlockTarget(officer);
            setSelectedId(null);
      };

      const handleCreate = async (e) => {
            e.preventDefault();
            if (!form.name.trim() || !form.email.trim() || !form.mobile.trim()) {
                  return toast.error(t('adminOfficersPage.fillAllFields'));
            }
            setCreating(true);
            try {
                  const res = await createOfficer({
                        name: form.name.trim(),
                        email: form.email.trim(),
                        mobile: form.mobile.trim(),
                  });
                  toast.success(t('adminOfficersPage.officerCreatedToast'));
                  setForm({ name: '', email: '', mobile: '' });
                  setCreatedOfficer(res.data?.data);
                  await load();
            } catch (err) {
                  toast.error(err?.response?.data?.message || t('adminOfficersPage.createFailed'));
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
                        <h1 className="text-2xl font-black text-white">{t('adminOfficersPage.title')}</h1>
                        <button
                              onClick={() => { setCreateOpen(true); setCreatedOfficer(null); }}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors"
                        >
                              {t('adminOfficersPage.createOfficer')}
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
                              <p className="text-slate-400 font-semibold">{t('adminOfficersPage.noOfficers')}</p>
                              <p className="text-slate-500 text-sm mt-1">{t('adminOfficersPage.noOfficersDesc')}</p>
                        </div>
                  ) : (
                        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
                              <table className="min-w-full text-sm">
                                    <thead>
                                          <tr className="text-left text-slate-400 text-xs border-b border-white/10">
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.name')}</th>
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.employeeId')}</th>
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.department')}</th>
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.assigned')}</th>
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.pending')}</th>
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.resolved')}</th>
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.resolutionPct')}</th>
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.lastActive')}</th>
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.status')}</th>
                                                <th className="px-4 py-3 font-semibold">{t('adminOfficersPage.tableHeaders.actions')}</th>
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
                                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${o.resolutionRate ?? 0}%` }} />
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
                                                                        {t('adminOfficersPage.blocked')}
                                                                  </span>
                                                            ) : !o.password ? (
                                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                        {t('adminOfficersPage.pending')}
                                                                  </span>
                                                            ) : (
                                                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-semibold">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                        {t('adminOfficersPage.active')}
                                                                  </span>
                                                            )}
                                                      </td>
                                                      <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                  <button title="View details" onClick={() => setSelectedId(o._id)}
                                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
                                                                        <Eye className="w-4 h-4" />
                                                                  </button>
                                                                  {o.isBlocked ? (
                                                                        <button onClick={() => setUnblockTarget(o)}
                                                                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors">
                                                                              <ShieldCheck className="w-3.5 h-3.5" />
                                                                              {t('adminOfficersPage.unblock')}
                                                                        </button>
                                                                  ) : (
                                                                        <button onClick={() => setBlockTarget(o)}
                                                                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-semibold transition-colors">
                                                                              <ShieldOff className="w-3.5 h-3.5" />
                                                                              {t('adminOfficersPage.block')}
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

                  <AnimatePresence>
                        {selectedId && (
                              <OfficerDetailModal officerId={selectedId} onClose={() => setSelectedId(null)} onToggleBlock={handleToggleFromModal} />
                        )}
                  </AnimatePresence>

                  <AnimatePresence>
                        {blockTarget && (
                              <BlockConfirmDialog officer={blockTarget} onConfirm={handleBlock} onCancel={() => setBlockTarget(null)} loading={actionLoading} />
                        )}
                  </AnimatePresence>

                  <AnimatePresence>
                        {unblockTarget && (
                              <UnblockConfirmDialog officer={unblockTarget} onConfirm={handleUnblock} onCancel={() => setUnblockTarget(null)} loading={actionLoading} />
                        )}
                  </AnimatePresence>

                  {/* ── Create Officer Modal ─────────────────────────────────────────── */}
                  {createOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
                                    <div className="flex justify-between items-start mb-4">
                                          <div>
                                                <h2 className="text-xl font-bold text-white">{t('adminOfficersPage.createOfficerTitle')}</h2>
                                                <p className="text-sm text-slate-400 mt-0.5">{t('adminOfficersPage.autoGenerated')}</p>
                                          </div>
                                          <button onClick={() => { setCreateOpen(false); setCreatedOfficer(null); }} className="text-slate-400 hover:text-white text-sm">
                                                <X className="w-5 h-5" />
                                          </button>
                                    </div>

                                    {createdOfficer ? (
                                          <div className="space-y-4">
                                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                                      <div className="flex items-center gap-2 mb-3">
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            <span className="text-emerald-400 font-bold">{t('adminOfficersPage.officerCreated')}</span>
                                                      </div>
                                                      <div className="space-y-1.5 text-sm text-slate-300">
                                                            <div><span className="text-slate-500">{t('admin.fullName')}:</span> {createdOfficer.name}</div>
                                                            <div><span className="text-slate-500">{t('admin.officialEmail')}:</span> {createdOfficer.email}</div>
                                                            <div><span className="text-slate-500">{t('auth.department')}:</span> {deptLabel(createdOfficer.department)}</div>
                                                      </div>
                                                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                                                            <p className="text-xs text-slate-400 mb-1">{t('admin.employeeId')}</p>
                                                            <p className="text-2xl font-black font-mono text-blue-300 tracking-widest">{createdOfficer.employeeId}</p>
                                                      </div>
                                                      <button onClick={() => copyEmpId(createdOfficer.employeeId)}
                                                            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-colors">
                                                            {copied
                                                                  ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {t('adminOfficersPage.copied')}</>
                                                                  : <><Copy className="w-4 h-4" /> {t('adminOfficersPage.copyEmployeeId')}</>}
                                                      </button>
                                                </div>

                                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                                                      📧 {t('admin.welcomeEmailSent', { email: createdOfficer.email })}
                                                </div>

                                                <div className="flex gap-2">
                                                      <button onClick={() => setCreatedOfficer(null)}
                                                            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors">
                                                            {t('admin.createAnother')}
                                                      </button>
                                                      <button onClick={() => { setCreateOpen(false); setCreatedOfficer(null); }}
                                                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors">
                                                            {t('admin.done')}
                                                      </button>
                                                </div>
                                          </div>
                                    ) : (
                                          <form onSubmit={handleCreate} className="space-y-4">
                                                <div>
                                                      <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('admin.officerFullName')}</label>
                                                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                            placeholder={t('admin.officerNamePlaceholder')}
                                                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                                                </div>
                                                <div>
                                                      <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('admin.officerEmail')}</label>
                                                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                            placeholder={t('admin.officerEmailPlaceholder')}
                                                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                                                </div>
                                                <div>
                                                      <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('admin.officerMobile')}</label>
                                                      <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                                            placeholder={t('admin.officerMobilePlaceholder')}
                                                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                                                </div>
                                                <p className="text-xs text-slate-500">{t('admin.deptInherited')}</p>
                                                <button type="submit" disabled={creating}
                                                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                                                      {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('admin.creating')}</> : t('adminOfficersPage.createOfficer')}
                                                </button>
                                          </form>
                                    )}
                              </div>
                        </div>
                  )}
            </motion.div>
      );
}
