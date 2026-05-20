import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboard } from '../../api/admin';
import { deptLabel, deptTheme, isSuperAdmin } from '../../utils/departmentMeta';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminDashboardHome from '../../components/admin/AdminDashboardHome';
import AdminComplaints from '../../components/admin/AdminComplaints';
import AdminOfficers from '../../components/admin/AdminOfficers';
import AdminAnalytics from '../../components/admin/AdminAnalytics';
import AdminEmergencies from '../../components/admin/AdminEmergencies';
import AdminDeptAdmins from '../../components/admin/AdminDeptAdmins';
import AdminDepartments from '../../components/admin/AdminDepartments';

export default function AdminDashboard() {
      const { user, logout } = useAuth();
      const navigate = useNavigate();
      const [view, setView] = useState('home');
      const [mobileOpen, setMobileOpen] = useState(false);
      const [scope, setScope] = useState({ isSuper: true, departmentName: 'Platform' });

      const superAdmin = isSuperAdmin(user);
      const deptSlug = user?.managedDepartment;
      const theme = deptTheme(deptSlug);

      useEffect(() => {
            getAdminDashboard()
                  .then(({ data }) => {
                        if (data.scope) {
                              setScope({
                                    isSuper: data.scope.isSuper,
                                    departmentName: data.scope.departmentName || deptLabel(deptSlug),
                              });
                        }
                  })
                  .catch(() => {});
      }, [deptSlug]);

      const handleLogout = async () => {
            await logout();
            toast.success('Logged out');
            navigate('/login');
      };

      const departmentName = superAdmin
            ? (scope.departmentName || 'Super Admin')
            : deptLabel(deptSlug);

      const renderView = () => {
            switch (view) {
                  case 'complaints': return <AdminComplaints />;
                  case 'officers': return <AdminOfficers />;
                  case 'emergency': return <AdminEmergencies />;
                  case 'analytics': return <AdminAnalytics />;
                  case 'dept-admins': return superAdmin ? <AdminDeptAdmins /> : <AdminDashboardHome scope={scope} />;
                  case 'departments': return superAdmin ? <AdminDepartments /> : <AdminDashboardHome scope={scope} />;
                  default: return <AdminDashboardHome scope={scope} />;
            }
      };

      return (
            <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${superAdmin ? 'from-red-950/20 to-violet-950/20' : theme.gradient + '/10'} pointer-events-none opacity-30`} />

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
                                          {departmentName} {superAdmin ? '· Super Admin' : '· Admin Panel'}
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
