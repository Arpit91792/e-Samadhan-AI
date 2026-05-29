import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
      Download, Eye, Star, Calendar, Loader2, Building,
      CheckCircle2, DownloadCloud, FileText, X, Sparkles, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCitizenReports, submitReportFeedback } from '../../api/reports';
import StatusBadge from './StatusBadge';

export default function ResolutionReports() {
      const [reports, setReports] = useState([]);
      const [loading, setLoading] = useState(true);
      const [selectedReport, setSelectedReport] = useState(null);
      const [showRatingModal, setShowRatingModal] = useState(null); // stores report object for rating
      const [rating, setRating] = useState(0);
      const [hoverRating, setHoverRating] = useState(0);
      const [feedbackText, setFeedbackText] = useState('');
      const [submittingRating, setSubmittingRating] = useState(false);
      const [downloadingId, setDownloadingId] = useState(null);

      const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

      const fetchReports = useCallback(async () => {
            setLoading(true);
            try {
                  const res = await getCitizenReports();
                  if (res.data?.success) {
                        setReports(res.data.reports || []);
                  }
            } catch (err) {
                  toast.error('Failed to load resolution reports');
            } finally {
                  setLoading(false);
            }
      }, []);

      useEffect(() => {
            fetchReports();
      }, [fetchReports]);

      const handleDownloadPdf = async (report) => {
            if (!report.reportPdfUrl) {
                  toast.error('PDF report is not available for download');
                  return;
            }

            setDownloadingId(report._id);
            try {
                  const fileUrl = `${apiBase}${report.reportPdfUrl}`;
                  const response = await fetch(fileUrl);
                  const blob = await response.blob();
                  
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = `Resolution_Report_${report.complaintId || report._id}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast.success('Resolution PDF downloaded successfully!');
            } catch (err) {
                  console.error('Download failed:', err);
                  toast.error('Failed to download PDF report');
            } finally {
                  setDownloadingId(null);
            }
      };

      const handleOpenRating = (report) => {
            setShowRatingModal(report);
            setRating(report.citizenRating || 0);
            setFeedbackText(report.citizenFeedback || '');
      };

      const handleSubmitRating = async () => {
            if (rating < 1 || rating > 5) {
                  toast.error('Please select a star rating between 1 and 5');
                  return;
            }

            setSubmittingRating(true);
            try {
                  const res = await submitReportFeedback(showRatingModal._id, rating, feedbackText);
                  if (res.data?.success) {
                        toast.success('Thank you for rating your resolution!');
                        setShowRatingModal(null);
                        fetchReports(); // reload reports with updated rating
                  }
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to submit rating');
            } finally {
                  setSubmittingRating(false);
            }
      };

      const formatDate = (iso) => {
            if (!iso) return '—';
            return new Date(iso).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
            });
      };

      if (loading) {
            return (
                  <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  </div>
            );
      }

      return (
            <div className="space-y-6">
                  <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                              <Sparkles className="w-6 h-6 text-violet-500" fill="rgba(139, 92, 246, 0.2)" />
                              AI Grievance Resolution Reports
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                              View detailed AI-generated assessments and download official PDF reports for your resolved complaints.
                        </p>
                  </div>

                  {reports.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                              <FileText className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                              <h3 className="font-bold text-slate-700 text-lg">No Resolution Reports Yet</h3>
                              <p className="text-sm text-slate-400 mt-1.5 max-w-md mx-auto">
                                    When an officer successfully resolves your filed grievance, an AI-powered report and PDF document will appear here for you to view, rate, and download.
                              </p>
                        </div>
                  ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {reports.map((report) => (
                                    <motion.div
                                          key={report._id}
                                          initial={{ opacity: 0, y: 15 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4"
                                    >
                                          <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                      <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                                                            {report.complaintId || 'C-N/A'}
                                                      </span>
                                                      <StatusBadge status={report.status} />
                                                </div>

                                                <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">
                                                      {report.title}
                                                </h3>

                                                <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                                                      <span className="flex items-center gap-1.5">
                                                            <Building className="w-3.5 h-3.5 text-slate-400" />
                                                            {report.department?.name || 'General Department'}
                                                      </span>
                                                      <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            Resolved: {formatDate(report.resolvedAt || report.reportGeneratedAt)}
                                                      </span>
                                                </div>

                                                {report.citizenRating > 0 && (
                                                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 w-fit">
                                                            <div className="flex gap-0.5">
                                                                  {[1, 2, 3, 4, 5].map((s) => (
                                                                        <Star
                                                                              key={s}
                                                                              className={`w-3 h-3 ${s <= report.citizenRating ? 'text-amber-500' : 'text-slate-200'}`}
                                                                              fill={s <= report.citizenRating ? '#f59e0b' : 'none'}
                                                                        />
                                                                  ))}
                                                            </div>
                                                            <span className="text-[10px] text-amber-700 font-bold ml-1">Rated</span>
                                                      </div>
                                                )}
                                          </div>

                                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                                                <div className="grid grid-cols-2 gap-2">
                                                      <button
                                                            type="button"
                                                            onClick={() => setSelectedReport(report)}
                                                            className="flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/50 transition-colors"
                                                      >
                                                            <Eye className="w-3.5 h-3.5" /> View Report
                                                      </button>

                                                      <button
                                                            type="button"
                                                            onClick={() => handleDownloadPdf(report)}
                                                            disabled={downloadingId === report._id}
                                                            className="flex items-center justify-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 disabled:bg-blue-50/50 text-blue-600 disabled:text-blue-400 text-xs font-bold rounded-xl border border-blue-200/40 transition-colors"
                                                      >
                                                            {downloadingId === report._id ? (
                                                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                  <Download className="w-3.5 h-3.5" />
                                                            )}
                                                            PDF
                                                      </button>
                                                </div>

                                                <button
                                                      type="button"
                                                      onClick={() => handleOpenRating(report)}
                                                      className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
                                                >
                                                      <Star className="w-3.5 h-3.5" fill="white" />
                                                      {report.citizenRating > 0 ? 'Update Rating & Feedback' : 'Rate Resolution'}
                                                </button>
                                          </div>
                                    </motion.div>
                              ))}
                        </div>
                  )}

                  {/* Report Detail Modal */}
                  <AnimatePresence>
                        {selectedReport && (
                              <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                                    onClick={() => setSelectedReport(null)}
                              >
                                    <motion.div
                                          initial={{ scale: 0.95, y: 15 }}
                                          animate={{ scale: 1, y: 0 }}
                                          exit={{ scale: 0.95, y: 15 }}
                                          className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
                                          onClick={(e) => e.stopPropagation()}
                                    >
                                          <div className="sticky top-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4.5 flex items-center justify-between rounded-t-3xl border-b border-white/5">
                                                <div className="flex-1 min-w-0">
                                                      <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider block">
                                                            Official Grievance Assessment Report
                                                      </span>
                                                      <h2 className="text-base font-black truncate mt-1">
                                                            {selectedReport.title}
                                                      </h2>
                                                </div>
                                                <button
                                                      onClick={() => setSelectedReport(null)}
                                                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/80"
                                                >
                                                      <X className="w-5 h-5" />
                                                </button>
                                          </div>

                                          <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
                                                {/* Header grid */}
                                                <div className="grid grid-cols-2 gap-4 p-4 bg-white border border-slate-100 rounded-2xl text-xs shadow-sm">
                                                      <div>
                                                            <p className="text-slate-400 font-bold">COMPLAINT ID</p>
                                                            <p className="text-slate-800 font-black mt-0.5">{selectedReport.complaintId}</p>
                                                      </div>
                                                      <div>
                                                            <p className="text-slate-400 font-bold">DEPARTMENT</p>
                                                            <p className="text-slate-800 font-bold mt-0.5">{selectedReport.department?.name || 'General'}</p>
                                                      </div>
                                                      <div className="border-t border-slate-50 pt-2">
                                                            <p className="text-slate-400 font-bold">RESOLVED BY</p>
                                                            <p className="text-slate-800 font-bold mt-0.5">{selectedReport.assignedOfficer?.name || 'Assigned Officer'}</p>
                                                      </div>
                                                      <div className="border-t border-slate-50 pt-2">
                                                            <p className="text-slate-400 font-bold">RESOLUTION DATE</p>
                                                            <p className="text-slate-800 font-bold mt-0.5">{formatDate(selectedReport.resolvedAt)}</p>
                                                      </div>
                                                </div>

                                                {/* Original Description */}
                                                <div className="space-y-1">
                                                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Grievance Description</h4>
                                                      <p className="text-xs text-slate-600 bg-white border border-slate-100 p-3.5 rounded-xl leading-relaxed shadow-sm">
                                                            {selectedReport.description}
                                                      </p>
                                                </div>

                                                {/* Officer Notes */}
                                                <div className="space-y-1">
                                                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Officer Field Notes</h4>
                                                      <p className="text-xs text-slate-600 bg-white border border-slate-100 p-3.5 rounded-xl leading-relaxed shadow-sm italic">
                                                            "{selectedReport.resolutionNotes || 'No custom notes provided.'}"
                                                      </p>
                                                </div>

                                                {/* AI Assessment */}
                                                <div className="space-y-2">
                                                      <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                                                            AI-Generated Resolution Assessment Report
                                                      </h4>
                                                      <div className="text-xs text-slate-700 bg-white border border-slate-200/60 p-5 rounded-2xl leading-relaxed whitespace-pre-line shadow-sm relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl"></div>
                                                            {selectedReport.resolutionReport}
                                                      </div>
                                                </div>
                                          </div>

                                          <div className="p-4 bg-white border-t border-slate-100 flex gap-3 justify-end rounded-b-3xl">
                                                <button
                                                      type="button"
                                                      onClick={() => handleDownloadPdf(selectedReport)}
                                                      disabled={downloadingId === selectedReport._id}
                                                      className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                                                >
                                                      {downloadingId === selectedReport._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                      ) : (
                                                            <DownloadCloud className="w-4 h-4" />
                                                      )}
                                                      Download PDF Report
                                                </button>
                                                <button
                                                      type="button"
                                                      onClick={() => {
                                                            const rep = selectedReport;
                                                            setSelectedReport(null);
                                                            handleOpenRating(rep);
                                                      }}
                                                      className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm"
                                                >
                                                      <Star className="w-4 h-4" fill="white" />
                                                      Rate Resolution
                                                </button>
                                          </div>
                                    </motion.div>
                              </motion.div>
                        )}
                  </AnimatePresence>

                  {/* Feedback and Rating Modal */}
                  <AnimatePresence>
                        {showRatingModal && (
                              <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                                    onClick={() => setShowRatingModal(null)}
                              >
                                    <motion.div
                                          initial={{ scale: 0.95, y: 15 }}
                                          animate={{ scale: 1, y: 0 }}
                                          exit={{ scale: 0.95, y: 15 }}
                                          className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative"
                                          onClick={(e) => e.stopPropagation()}
                                    >
                                          <button
                                                onClick={() => setShowRatingModal(null)}
                                                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                          >
                                                <X className="w-5 h-5" />
                                          </button>

                                          <div className="text-center space-y-3 mb-6 mt-2">
                                                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center text-amber-500 mx-auto">
                                                      <Star className="w-6 h-6 text-amber-500" fill="#f59e0b" />
                                                </div>
                                                <h3 className="text-lg font-black text-slate-800">Rate Grievance Resolution</h3>
                                                <p className="text-xs text-slate-500 px-4">
                                                      How satisfied are you with the actions taken by our field department to resolve your complaint?
                                                </p>
                                          </div>

                                          <div className="space-y-5">
                                                {/* 5-star rating selector */}
                                                <div className="flex items-center justify-center gap-2">
                                                      {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                  key={star}
                                                                  type="button"
                                                                  onClick={() => setRating(star)}
                                                                  onMouseEnter={() => setHoverRating(star)}
                                                                  onMouseLeave={() => setHoverRating(0)}
                                                                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                                            >
                                                                  <Star
                                                                        className={`w-9 h-9 transition-colors ${
                                                                              star <= (hoverRating || rating)
                                                                                    ? 'text-amber-500'
                                                                                    : 'text-slate-200'
                                                                        }`}
                                                                        fill={star <= (hoverRating || rating) ? '#f59e0b' : 'none'}
                                                                        strokeWidth={1.5}
                                                                  />
                                                            </button>
                                                      ))}
                                                </div>

                                                {/* Textarea feedback */}
                                                <div className="space-y-1.5">
                                                      <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                                            Optional feedback & suggestions
                                                      </label>
                                                      <textarea
                                                            value={feedbackText}
                                                            onChange={(e) => setFeedbackText(e.target.value)}
                                                            placeholder="Let us know what went well or how we can improve..."
                                                            className="w-full border border-slate-200 rounded-2xl p-3 text-xs min-h-[90px] focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none leading-relaxed"
                                                      />
                                                </div>

                                                {/* Submit button */}
                                                <button
                                                      type="button"
                                                      onClick={handleSubmitRating}
                                                      disabled={submittingRating || rating === 0}
                                                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:from-blue-600/60 disabled:to-violet-600/60 text-white font-bold rounded-2xl text-xs transition-shadow shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                                >
                                                      {submittingRating ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                      ) : (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                      )}
                                                      Submit Feedback
                                                </button>
                                          </div>
                                    </motion.div>
                              </motion.div>
                        )}
                  </AnimatePresence>
            </div>
      );
}
