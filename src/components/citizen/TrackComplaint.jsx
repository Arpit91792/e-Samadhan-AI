import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getComplaints, getComplaint } from '../../api/complaints';
import { useSocket } from '../../hooks/useSocket';
import StatusBadge from './StatusBadge';
import ComplaintTimeline from './ComplaintTimeline';
import ComplaintMapView from '../maps/ComplaintMapView';
import { deptLabel } from '../../utils/complaintConstants';

export default function TrackComplaint({ initialId = '' }) {
      const [query, setQuery] = useState(initialId);
      const [complaint, setComplaint] = useState(null);
      const [loading, setLoading] = useState(false);

      const refreshComplaint = useCallback(async (id) => {
            if (!id) return;
            try {
                  const full = await getComplaint(id);
                  setComplaint(full.data.complaint);
            } catch { /* ignore */ }
      }, []);

      useSocket({
            onComplaintUpdate: (payload) => {
                  if (complaint && (payload.complaintId === complaint._id || payload.complaintRef === complaint.complaintId)) {
                        refreshComplaint(complaint._id);
                        toast.success(`Status updated: ${payload.newStatus || payload.status}`);
                  }
            },
      });

      const search = async (e) => {
            e?.preventDefault();
            if (!query.trim()) return toast.error('Enter complaint ID');
            setLoading(true);
            setComplaint(null);
            try {
                  const { data: list } = await getComplaints({ search: query.trim(), limit: 1 });
                  if (list.complaints?.length) {
                        const full = await getComplaint(list.complaints[0]._id);
                        setComplaint(full.data.complaint);
                  } else {
                        toast.error('Complaint not found');
                  }
            } catch {
                  toast.error('Search failed');
            } finally {
                  setLoading(false);
            }
      };

      React.useEffect(() => {
            if (initialId) search();
      }, [initialId]);

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
                  <h1 className="text-2xl font-black text-slate-900">Track Complaint</h1>
                  <form onSubmit={search} className="flex gap-2">
                        <input
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Enter complaint ID e.g. C-000001"
                              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm"
                        />
                        <button type="submit" disabled={loading} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2">
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                              Track
                        </button>
                  </form>

                  {complaint && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border p-6 space-y-6 shadow-sm">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                          <p className="text-xs text-slate-500 font-mono">{complaint.complaintId}</p>
                                          <h2 className="text-lg font-black text-slate-900">{complaint.title}</h2>
                                          <p className="text-sm text-slate-600 mt-1">{deptLabel(complaint.category)}</p>
                                    </div>
                                    <StatusBadge status={complaint.status} />
                              </div>
                              <p className="text-sm text-slate-600">{complaint.description}</p>
                              {complaint.assignedOfficer && (
                                    <div className="p-3 bg-blue-50 rounded-xl text-sm">
                                          <p className="font-bold text-blue-900">Assigned Officer</p>
                                          <p className="text-blue-700">{complaint.assignedOfficer.name} · {complaint.assignedOfficer.email}</p>
                                    </div>
                              )}
                              {complaint.aiPriorityReason && (
                                    <p className="text-xs text-indigo-700 bg-indigo-50 p-3 rounded-xl">AI: {complaint.aiPriorityReason}</p>
                              )}
                              <ComplaintMapView
                                    lat={complaint.location?.coordinates?.lat}
                                    lng={complaint.location?.coordinates?.lng}
                                    address={complaint.location?.address}
                              />
                              <ComplaintTimeline status={complaint.status} timeline={complaint.timeline} />
                        </motion.div>
                  )}
            </motion.div>
      );
}
