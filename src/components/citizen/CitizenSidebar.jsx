import React from 'react';
import { motion } from 'framer-motion';
import {
      LayoutDashboard, PlusCircle, Search, History, Siren,
      Bell, MessageSquare, User, Settings, LogOut, Zap, ClipboardList
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

export default function CitizenSidebar({ active, onNavigate, user, unreadCount, onLogout, mobileOpen, onClose }) {
      const { t } = useTranslation();

      const NAV = [
            { id: 'home', label: t('sidebar.dashboardHome'), icon: LayoutDashboard },
            { id: 'create', label: t('sidebar.createComplaint'), icon: PlusCircle },
            { id: 'track', label: t('sidebar.trackComplaint'), icon: Search },
            { id: 'history', label: t('sidebar.complaintHistory'), icon: History },
            { id: 'reports', label: t('sidebar.resolutionReports', { defaultValue: 'Resolution Reports' }), icon: ClipboardList },
            { id: 'emergency', label: t('sidebar.emergency'), icon: Siren },
            { id: 'notifications', label: t('sidebar.notifications'), icon: Bell },
            { id: 'feedback', label: t('sidebar.feedbackRating'), icon: MessageSquare },
            { id: 'profile', label: t('sidebar.profile'), icon: User },
            { id: 'settings', label: t('sidebar.settings'), icon: Settings },
      ];

      return (
            <>
                  {mobileOpen && (
                        <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                              onClick={onClose}
                        />
                  )}
                  <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 flex flex-col transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                        {/* Logo */}
                        <div className="p-5 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg">
                                          <Zap className="w-5 h-5 text-white" fill="white" />
                                    </div>
                                    <div>
                                          <p className="font-black text-slate-900">e-Samadhan AI</p>
                                          <p className="text-[10px] text-slate-500 font-medium">{t('auth.citizenPortal')}</p>
                                    </div>
                              </div>
                        </div>

                        {/* Nav items */}
                        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                              {NAV.map((item) => (
                                    <button
                                          key={item.id}
                                          type="button"
                                          onClick={() => { onNavigate(item.id); onClose?.(); }}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active === item.id
                                                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md'
                                                : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                    >
                                          <item.icon className="w-4 h-4 flex-shrink-0" />
                                          {item.label}
                                          {item.id === 'notifications' && unreadCount > 0 && (
                                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                      {unreadCount}
                                                </span>
                                          )}
                                    </button>
                              ))}
                        </nav>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 space-y-2">
                              {/* Language switcher */}
                              <LanguageSwitcher variant="sidebar" dropUp />

                              {/* User info */}
                              <div className="flex items-center gap-3 px-2 pt-1">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                          {user?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                          <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                                          <p className="text-[10px] text-emerald-600 font-semibold">{t('auth.verifiedCitizen')}</p>
                                    </div>
                              </div>

                              {/* Logout */}
                              <button
                                    type="button"
                                    onClick={onLogout}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold"
                              >
                                    <LogOut className="w-4 h-4" /> {t('sidebar.logout')}
                              </button>
                        </div>
                  </aside>
            </>
      );
}
