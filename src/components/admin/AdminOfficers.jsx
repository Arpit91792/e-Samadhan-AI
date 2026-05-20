import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, X, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import {
      getAdminOfficers, approveOfficer, rejectOfficer, generateEmployeeId, blockOfficer,
} from '../../api/admin';
import { deptLabel } from '../../utils/departmentMeta';

export default function AdminOfficers() {
      const [officers, setOfficers] = useState([]);
      const [filter, setFilter] = useState('pending');
      const [loading, setLoading] = useState(true);

      const load = () => {
            setLoading(true);
            getAdminOfficers({ status: filter || undefined, limit: 50 })
                  .then(({ data }) => setOfficers(data.officers || []))
                  .catch(() => toast.error('Failed to load officers'))
                  .finally(() => setLoading(false));
      };

      useEffect(() => { load(); }, [filter]);

      const act = async (fn, msg) => {
            try {
                  await fn();
                  toast.success(msg);
                  load();
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Action failed');
            }
      };

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-black text-white">Officer Management</h1>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm">
                        <option value="">All</option>
                        <option value="pending">Pending approval</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                  </select>

                  {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto" />
                  ) : (
                        <div className="space-y-3">
                              {officers.map((o) => (
                                    <div key={o._id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-wrap justify-between gap-3">
                                          <div>
                                                <p className="font-bold text-white">{o.name}</p>
                                                <p className="text-xs text-slate-400">{o.email} · {deptLabel(o.department)}</p>
                                                <p className="text-xs text-slate-500 mt-1">ID: {o.employeeId || 'Not assigned'} · {o.officerStatus}</p>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                                {o.officerStatus === 'pending' && (
                                                      <>
                                                            <button type="button" onClick={() => act(() => approveOfficer(o._id), 'Approved')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                                                            <button type="button" onClick={() => act(() => rejectOfficer(o._id), 'Rejected')} className="px-3 py-1.5 rounded-lg bg-red-600/80 text-white text-xs font-bold flex items-center gap-1"><X className="w-3 h-3" /> Reject</button>
                                                      </>
                                                )}
                                                <button type="button" onClick={() => act(() => generateEmployeeId(o._id), 'ID generated')} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold flex items-center gap-1"><Hash className="w-3 h-3" /> Gen ID</button>
                                                {o.isActive && (
                                                      <button type="button" onClick={() => act(() => blockOfficer(o._id), 'Blocked')} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-bold">Block</button>
                                                )}
                                          </div>
                                    </div>
                              ))}
                        </div>
                  )}
            </motion.div>
      );
}
