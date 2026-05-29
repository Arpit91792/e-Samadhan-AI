import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, X, Mic } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getNotifications } from '../../api/notifications';
import CitizenSidebar from '../../components/citizen/CitizenSidebar';
import DashboardHome from '../../components/citizen/DashboardHome';
import CreateComplaint from '../../components/citizen/CreateComplaint';
import TrackComplaint from '../../components/citizen/TrackComplaint';
import ComplaintHistory from '../../components/citizen/ComplaintHistory';
import NotificationsPanel from '../../components/citizen/NotificationsPanel';
import FeedbackPanel from '../../components/citizen/FeedbackPanel';
import CitizenProfile from '../../components/citizen/CitizenProfile';
import CitizenSettings from '../../components/citizen/CitizenSettings';
import AIChatbot from '../../components/citizen/AIChatbot';
import VoiceComplaint from '../../components/VoiceComplaint';
import ResolutionReports from '../../components/citizen/ResolutionReports';
import { useSocket } from '../../hooks/useSocket';

export default function CitizenDashboard() {
      const { user, logout } = useAuth();
      const { t } = useTranslation();
      const navigate = useNavigate();
      const [view, setView] = useState('home');
      const [trackId, setTrackId] = useState('');
      const [mobileOpen, setMobileOpen] = useState(false);
      const [unread, setUnread] = useState(0);
      const [showVoiceModal, setShowVoiceModal] = useState(false);
      const [voiceFormData, setVoiceFormData] = useState({ title: '', description: '', category: '' });

      const loadUnread = useCallback(() => {
            getNotifications({ unreadOnly: 'true', limit: 1 })
                  .then(({ data }) => setUnread(data.unreadCount ?? 0))
                  .catch(() => { });
      }, []);

      useEffect(() => {
            loadUnread();
      }, [loadUnread]);

      useSocket({
            onNotification: () => loadUnread(),
            onComplaintUpdate: () => loadUnread(),
      });

      const handleNavigate = (id, extra) => {
            setView(id);
            if (extra) setTrackId(extra);
            if (id === 'notifications') loadUnread();
      };

      const handleLogout = async () => {
            await logout();
            toast.success(t('toast.loggedOut'));
            navigate('/login');
      };

      const onComplaintSuccess = (complaint) => {
            setTrackId(complaint?.complaintId || '');
            setView('track');
            setShowVoiceModal(false);
      };

      const handleVoiceModalClose = () => {
            setShowVoiceModal(false);
            setVoiceFormData({ title: '', description: '', category: '' });
      };

      const renderView = () => {
            switch (view) {
                  case 'home':
                        return <DashboardHome onNavigate={handleNavigate} />;
                  case 'create':
                        return <CreateComplaint onSuccess={onComplaintSuccess} />;
                  case 'track':
                        return <TrackComplaint initialId={trackId} />;
                  case 'history':
                        return <ComplaintHistory onTrack={(id) => handleNavigate('track', id)} />;
                  case 'emergency':
                        return (
                              <div className="space-y-4">
                                    <motion.div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-800">
                                          {t('dashboard.emergencyWarning')}
                                    </motion.div>
                                    <CreateComplaint emergency onSuccess={onComplaintSuccess} />
                              </div>
                        );
                  case 'notifications':
                        return <NotificationsPanel />;
                  case 'feedback':
                        return <FeedbackPanel />;
                  case 'profile':
                        return <CitizenProfile />;
                  case 'reports':
                        return <ResolutionReports />;
                  case 'settings':
                        return <CitizenSettings />;
                  default:
                        return <DashboardHome onNavigate={handleNavigate} />;
            }
      };

      return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/40 flex">
                  <CitizenSidebar
                        active={view}
                        onNavigate={handleNavigate}
                        user={user}
                        unreadCount={unread}
                        onLogout={handleLogout}
                        mobileOpen={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                  />

                  <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
                        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
                              <button type="button" onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
                                    <Menu className="w-5 h-5" />
                              </button>
                              <p className="text-sm font-bold text-slate-700 hidden sm:block">{t('dashboard.citizenDashboard')}</p>
                              <div className="flex items-center gap-2">
                                    <button
                                          type="button"
                                          onClick={() => setShowVoiceModal(true)}
                                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                                          title={t('voiceComplaint.title', 'Voice Complaint')}
                                    >
                                          <Mic className="w-5 h-5" />
                                    </button>
                                    <button
                                          type="button"
                                          onClick={() => handleNavigate('notifications')}
                                          className="relative p-2 rounded-lg hover:bg-slate-100"
                                    >
                                          <Bell className="w-5 h-5 text-slate-600" />
                                          {unread > 0 && (
                                                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                      {unread > 9 ? '9+' : unread}
                                                </span>
                                          )}
                                    </button>
                              </div>
                        </header>

                        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                              {renderView()}
                        </main>
                  </div>

                  <AIChatbot />

                  {/* Voice Complaint Modal */}
                  {showVoiceModal && (
                        <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                              onClick={handleVoiceModalClose}
                        >
                              <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto w-full max-w-2xl"
                                    onClick={(e) => e.stopPropagation()}
                              >
                                    <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                                          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                <Mic className="w-5 h-5 text-blue-600" />
                                                {t('voiceComplaint.title', 'Voice Complaint')}
                                          </h2>
                                          <button
                                                onClick={handleVoiceModalClose}
                                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                                          >
                                                <X className="w-5 h-5" />
                                          </button>
                                    </div>

                                    <div className="p-6">
                                          <VoiceComplaint
                                                setTitle={(title) => setVoiceFormData((p) => ({ ...p, title }))}
                                                setDescription={(description) => setVoiceFormData((p) => ({ ...p, description }))}
                                                setDepartment={(category) => setVoiceFormData((p) => ({ ...p, category }))}
                                                setPriority={() => { }}
                                                setCategory={() => { }}
                                                setEmergency={() => { }}
                                          />

                                          {voiceFormData.title && (
                                                <motion.div
                                                      initial={{ opacity: 0, y: 10 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      className="mt-6 pt-6 border-t border-slate-200 space-y-4"
                                                >
                                                      <button
                                                            onClick={() => {
                                                                  setView('create');
                                                                  handleVoiceModalClose();
                                                            }}
                                                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg transition-shadow"
                                                      >
                                                            📝 {t('complaint.submitComplaint', 'Submit Complaint')}
                                                      </button>
                                                </motion.div>
                                          )}
                                    </div>
                              </motion.div>
                        </motion.div>
                  )}
            </div>
      );
}
