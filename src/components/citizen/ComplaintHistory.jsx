import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getComplaints, submitFeedback } from '../../api/complaints';
import StatusBadge from './StatusBadge';
import { deptLabel } from '../../utils/complaintConstants';

export default function ComplaintHistory({ onTrack }) {
      const [complaints, setComplaints] = useState([]);
      const [status, setStatus] = useState('');
      const [search, setSearch] = useState('');
      const [loading, setLoading] = useState(true);
      const [ratingId, setRatingId] = useState(null);
      const [rating, setRating] = useState(5);
      const [comment, setComment] = useState('');

      const load = () => {
            setLoading(true);
            getComplaints({ status: status || undefined, search: search || undefined, limit: 50 })
                  .then(({ data }) => setComplaints(data.complaints || []))
                  .catch(() => toast.error('Failed to load complaints'))
                  .finally(() => setLoading(false));
      };

      useEffect(() => { load(); }, [status]);

      const sendFeedback = async (id) => {
            try {
                  await submitFeedback(id, rating, comment);
                  toast.success('Thank you for your feedback!');
                  setRatingId(null);
                  load();
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Feedback failed');
            }
      };

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-black text-slate-900">Complaint History</h1>
                  <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && load()}
                                    placeholder="Search complaints..."
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm"
                              />
                        </div>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2.5 border rounded-xl text-sm">
                              <option value="">All statuses</option>
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                        </select>
                  </div>

                  {loading ? (
                        <motion.div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></motion.div>
                  ) : (
                        <div className="space-y-3">
                              {complaints.map((c) => (
                                    <motion.div key={c._id} className="glass rounded-2xl border p-4 shadow-sm">
                                          <div className="flex flex-wrap justify-between gap-2">
                                                <button type="button" onClick={() => onTrack?.(c.complaintId)} className="text-left">
                                                      <p className="font-bold text-slate-900">{c.title}</p>
                                                      <p className="text-xs text-slate-400">{c.complaintId} · {deptLabel(c.category)}</p>
                                                </button>
                                                <StatusBadge status={c.status} />
                                          </div>
                                          {c.status === 'resolved' && !c.feedback?.rating && (
                                                <div className="mt-3 pt-3 border-t">
                                                      {ratingId === c._id ? (
                                                            <div className="space-y-2">
                                                                  <motion.div className="flex gap-1">
                                                                        {[1, 2, 3, 4, 5].map((n) => (
                                                                              <button key={n} type="button" onClick={() => setRating(n)}>
                                                                                    <Star className={`w-6 h-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                                                              </button>
                                                                        ))}
                                                                  </motion.div>
                                                                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comments..." className="w-full text-sm border rounded-lg p-2" rows={2} />
                                                                  <button type="button" onClick={() => sendFeedback(c._id)} className="text-sm font-bold text-blue-600">Submit feedback</button>
                                                            </div>
                                                      ) : (
                                                            <button type="button" onClick={() => setRatingId(c._id)} className="text-xs font-bold text-violet-600">Rate resolution →</button>
                                                      )}
                                                </div>
                                          )}
                                    </motion.div>
                              ))}
                        </div>
                  )}
            </motion.div>
      );
}
