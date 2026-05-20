import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getComplaints, submitFeedback } from '../../api/complaints';
import { deptLabel } from '../../utils/complaintConstants';

export default function FeedbackPanel() {
      const [items, setItems] = useState([]);
      const [loading, setLoading] = useState(true);
      const [active, setActive] = useState(null);
      const [rating, setRating] = useState(5);
      const [comment, setComment] = useState('');

      useEffect(() => {
            getComplaints({ status: 'resolved', limit: 30 })
                  .then(({ data }) => setItems((data.complaints || []).filter((c) => !c.feedback?.rating)))
                  .catch(() => toast.error('Failed to load'))
                  .finally(() => setLoading(false));
      }, []);

      const submit = async (id) => {
            try {
                  await submitFeedback(id, rating, comment);
                  toast.success('Feedback submitted');
                  setItems((prev) => prev.filter((c) => c._id !== id));
                  setActive(null);
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed');
            }
      };

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
                  <h1 className="text-2xl font-black text-slate-900">Feedback & Rating</h1>
                  <p className="text-sm text-slate-500">Rate officers after your complaints are resolved.</p>
                  {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  ) : items.length === 0 ? (
                        <p className="text-center text-slate-500 py-12 glass rounded-2xl border">No pending feedback. Resolved complaints appear here.</p>
                  ) : (
                        <motion.div className="space-y-3">
                              {items.map((c) => (
                                    <div key={c._id} className="glass rounded-2xl border p-4">
                                          <p className="font-bold text-slate-900">{c.title}</p>
                                          <p className="text-xs text-slate-400">{c.complaintId} · {deptLabel(c.category)}</p>
                                          {active === c._id ? (
                                                <div className="mt-3 space-y-2">
                                                      <div className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map((n) => (
                                                                  <button key={n} type="button" onClick={() => setRating(n)}>
                                                                        <Star className={`w-7 h-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                                                  </button>
                                                            ))}
                                                      </div>
                                                      <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border rounded-xl p-2 text-sm" rows={3} placeholder="Share your experience..." />
                                                      <button type="button" onClick={() => submit(c._id)} className="text-sm font-bold text-blue-600">Submit</button>
                                                </div>
                                          ) : (
                                                <button type="button" onClick={() => setActive(c._id)} className="mt-2 text-sm font-bold text-violet-600">Rate officer →</button>
                                          )}
                                    </div>
                              ))}
                        </motion.div>
                  )}
            </motion.div>
      );
}
