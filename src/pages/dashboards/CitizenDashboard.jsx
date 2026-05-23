import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
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
import { useSocket } from '../../hooks/useSocket';

export default function CitizenDashboard() {
      const { user, logout } = useAuth();
      const navigate = useNavigate();
      const [view, setView] = useState('home');
      const [trackId, setTrackId] = useState('');
      const [mobileOpen, setMobileOpen] = useState(false);
      const [unread, setUnread] = useState(0);

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
            toast.success('Logged out');
            navigate('/login');
      };

      const onComplaintSuccess = (complaint) => {
            setTrackId(complaint?.complaintId || '');
            setView('track');
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
                                          Emergency complaints are fast-tracked to officers. Use only for crime, fire, accident, or medical emergencies.
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
                              <p className="text-sm font-bold text-slate-700 hidden sm:block">Citizen Dashboard</p>
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
                        </header>

                        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                              {renderView()}
                        </main>
                  </div>

                  <AIChatbot />
            </div>
      );
}
