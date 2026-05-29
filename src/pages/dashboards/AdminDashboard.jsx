import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { getAdminDashboard } from '../../api/admin';
import { deptLabel, deptTheme } from '../../utils/departmentMeta';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminDashboardHome from '../../components/admin/AdminDashboardHome';
import AdminComplaints from '../../components/admin/AdminComplaints';
import AdminOfficers from '../../components/admin/AdminOfficers';
import AdminAnalytics from '../../components/admin/AdminAnalytics';
import AdminEmergencies from '../../components/admin/AdminEmergencies';
import AdminGovernance from '../../components/admin/AdminGovernance';

export default function AdminDashboard() {
      const { user, logout } = useAuth();
      const navigate = useNavigate();
      const [view, setView] = useState('home');
      const [mobileOpen, setMobileOpen] = useState(false);

      const deptSlug = user?.managedDepartment || user?.department;
      const departmentName = deptLabel(deptSlug);
      const theme = deptTheme(deptSlug);

      useSocket({
            onAdminAlert: () => {
                  toast('New alert', { icon: '🔔' });
            },
            onNotification: () => { },
      }, { role: 'admin' });

      const { t } = useTranslation();

      const handleLogout = async () => {
            await logout();
            toast.success(t('toast.loggedOut'));
            navigate('/admin/login');
      };

      const renderView = () => {
            switch (view) {
                  case 'complaints': return <AdminComplaints />;
                  case 'officers': return <AdminOfficers />;
                  case 'emergency': return <AdminEmergencies />;
                  case 'analytics': return <AdminAnalytics />;
                  case 'governance': return <AdminGovernance />;
                  default: return <AdminDashboardHome departmentName={departmentName} />;
            }
      };

      return (
            <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}/10 pointer-events-none opacity-30`} />

                  <div className="relative flex">
                        <AdminSidebar
                              active={view}
                              onNavigate={setView}
                              user={user}
                              onLogout={handleLogout}
                              mobileOpen={mobileOpen}
                              onClose={() => setMobileOpen(false)}
                              departmentName={departmentName}
                        />

                        <div className="flex-1 flex flex-col min-w-0">
                              <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 h-14 flex items-center gap-3">
                                    <button type="button" onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-white">
                                          <Menu className="w-5 h-5" />
                                    </button>
                                    <p className="text-sm font-bold text-white truncate">
                                          {departmentName} · {t('sidebar.dashboard')}
                                    </p>
                              </header>
                              <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                                    {renderView()}
                              </main>
                        </div>
                  </div>
            </div>
      );
}
