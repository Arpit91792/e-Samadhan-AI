import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getComplaints, submitFeedback } from '../../api/complaints';
import StatusBadge from './StatusBadge';
import { deptLabel } from '../../utils/complaintConstants';

export default function ComplaintHistory({ onTrack }) {
      const { t } = useTranslation();
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
                  .catch(() => toast.error(t('complaintHistory.failedToLoad')))
                  .finally(() => setLoading(false));
      };

      useEffect(() => { load(); }, [status]);

      const sendFeedback = async (id) => {
            try {
                  await submitFeedback(id, rating, comment);
                  toast.success(t('complaintHistory.feedbackSuccess'));
                  setRatingId(null);
                  load();
            } catch (err) {
                  toast.error(err.response?.data?.message || t('toast.feedbackFailed'));
            }
      };

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-black text-slate-900">{t('complaintHistory.title')}</h1>
                  <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && load()}
                                    placeholder={t('complaintHistory.searchPlaceholder')}
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm"
                              />
                        </div>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2.5 border rounded-xl text-sm">
                              <option value="">{t('complaintHistory.allStatuses')}</option>
                              <option value="pending">{t('status.pending')}</option>
                              <option value="in_progress">{t('status.in_progress')}</option>
                              <option value="resolved">{t('status.resolved')}</option>
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
                                                                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('complaintHistory.commentsPlaceholder')} className="w-full text-sm border rounded-lg p-2" rows={2} />
                                                                  <button type="button" onClick={() => sendFeedback(c._id)} className="text-sm font-bold text-blue-600">{t('complaintHistory.submitFeedback')}</button>
                                                            </div>
                                                      ) : (
                                                            <button type="button" onClick={() => setRatingId(c._id)} className="text-xs font-bold text-violet-600">{t('complaintHistory.rateResolution')}</button>
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
