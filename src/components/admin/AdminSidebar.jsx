import {
      LayoutDashboard, FileText, Users, BarChart3, Siren,
      LogOut, Zap, Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

export default function AdminSidebar({ active, onNavigate, user, onLogout, mobileOpen, onClose, departmentName }) {
      const { t } = useTranslation();

      const NAV_ITEMS = [
            { id: 'home', label: t('sidebar.dashboard'), icon: LayoutDashboard },
            { id: 'complaints', label: t('sidebar.complaints'), icon: FileText },
            { id: 'officers', label: t('sidebar.officers'), icon: Users },
            { id: 'emergency', label: t('sidebar.emergency'), icon: Siren },
            { id: 'analytics', label: t('sidebar.analytics'), icon: BarChart3 },
            { id: 'governance', label: t('sidebar.aiGovernance', { defaultValue: 'AI Governance' }), icon: Sparkles },
      ];

      return (
            <>
                  {mobileOpen && (
                        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} role="presentation" />
                  )}
                  <aside className={`fixed lg:sticky top-0 z-50 h-screen w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                        {/* Logo */}
                        <div className="p-5 border-b border-white/10">
                              <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                                          <Zap className="w-5 h-5 text-white" fill="white" />
                                    </div>
                                    <div>
                                          <p className="font-black text-white text-sm">e-Samadhan AI</p>
                                          <p className="text-[10px] text-red-300 font-semibold">{departmentName}</p>
                                    </div>
                              </div>
                        </div>

                        {/* Nav items */}
                        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                              {NAV_ITEMS.map((item) => (
                                    <button
                                          key={item.id}
                                          type="button"
                                          onClick={() => { onNavigate(item.id); onClose?.(); }}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active === item.id
                                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                    >
                                          <item.icon className="w-4 h-4" />
                                          {item.label}
                                    </button>
                              ))}
                        </nav>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 space-y-2">
                              {/* Language switcher — dark background variant */}
                              <LanguageSwitcher variant="sidebar" dropUp darkBg />

                              {/* User info */}
                              <div className="flex items-center gap-3 px-2 pt-1">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                          {user?.name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                          <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                                          <p className="text-[10px] text-red-300">{t('auth.departmentAdmin')}</p>
                                    </div>
                              </div>

                              {/* Logout */}
                              <button
                                    type="button"
                                    onClick={onLogout}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold"
                              >
                                    <LogOut className="w-4 h-4" /> {t('sidebar.logout')}
                              </button>
                        </div>
                  </aside>
            </>
      );
}
