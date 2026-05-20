import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminComplaints, getAdminOfficers, assignOfficer, updateComplaintStatus } from '../../api/admin';
import StatusBadge from '../citizen/StatusBadge';
import { deptLabel } from '../../utils/departmentMeta';

export default function AdminComplaints() {
      const [complaints, setComplaints] = useState([]);
      const [officers, setOfficers] = useState([]);
      const [status, setStatus] = useState('');
      const [loading, setLoading] = useState(true);
      const [assigning, setAssigning] = useState(null);

      const load = () => {
            setLoading(true);
            Promise.all([
                  getAdminComplaints({ status: status || undefined, limit: 50 }),
                  getAdminOfficers({ status: 'approved', limit: 100 }),
            ])
                  .then(([cRes, oRes]) => {
                        setComplaints(cRes.data.complaints || []);
                        setOfficers(oRes.data.officers || []);
                  })
                  .catch(() => toast.error('Failed to load complaints'))
                  .finally(() => setLoading(false));
      };

      useEffect(() => { load(); }, [status]);

      const handleAssign = async (complaintId, officerId) => {
            if (!officerId) return;
            setAssigning(complaintId);
            try {
                  await assignOfficer(complaintId, officerId);
                  toast.success('Officer assigned');
                  load();
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Assign failed');
            } finally {
                  setAssigning(null);
            }
      };

      const handleStatus = async (complaintId, newStatus) => {
            try {
                  await updateComplaintStatus(complaintId, newStatus);
                  toast.success('Status updated');
                  load();
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Update failed');
            }
      };

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-black text-white">Complaint Management</h1>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm">
                        <option value="">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                  </select>

                  {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto" />
                  ) : (
                        <div className="space-y-3">
                              {complaints.map((c) => (
                                    <div key={c._id} className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                                          <div className="flex flex-wrap justify-between gap-2">
                                                <div>
                                                      <p className="font-bold text-white">{c.title}</p>
                                                      <p className="text-xs text-slate-400">{c.complaintId} · {deptLabel(c.category)}</p>
                                                </div>
                                                <StatusBadge status={c.status} />
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                                <select
                                                      defaultValue=""
                                                      onChange={(e) => handleAssign(c._id, e.target.value)}
                                                      disabled={assigning === c._id}
                                                      className="text-xs px-2 py-1.5 rounded-lg bg-white/10 text-white border border-white/10"
                                                >
                                                      <option value="">Assign officer...</option>
                                                      {officers.map((o) => (
                                                            <option key={o._id} value={o._id}>{o.name} ({o.employeeId || 'no ID'})</option>
                                                      ))}
                                                </select>
                                                {['in_progress', 'resolved', 'rejected'].map((s) => (
                                                      <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => handleStatus(c._id, s)}
                                                            className="text-xs px-2 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white capitalize"
                                                      >
                                                            {s.replace('_', ' ')}
                                                      </button>
                                                ))}
                                          </div>
                                    </div>
                              ))}
                        </div>
                  )}
            </motion.div>
      );
}
