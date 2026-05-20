import React from 'react';
import { motion } from 'framer-motion';
import {
      LayoutDashboard, PlusCircle, Search, History, Siren,
      Bell, MessageSquare, User, Settings, LogOut, Zap,
} from 'lucide-react';

const NAV = [
      { id: 'home', label: 'Dashboard Home', icon: LayoutDashboard },
      { id: 'create', label: 'Create Complaint', icon: PlusCircle },
      { id: 'track', label: 'Track Complaint', icon: Search },
      { id: 'history', label: 'Complaint History', icon: History },
      { id: 'emergency', label: 'Emergency', icon: Siren },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'feedback', label: 'Feedback & Rating', icon: MessageSquare },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'settings', label: 'Settings', icon: Settings },
];

export default function CitizenSidebar({ active, onNavigate, user, unreadCount, onLogout, mobileOpen, onClose }) {
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
                        <div className="p-5 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg">
                                          <Zap className="w-5 h-5 text-white" fill="white" />
                                    </div>
                                    <div>
                                          <p className="font-black text-slate-900">e-Samadhan AI</p>
                                          <p className="text-[10px] text-slate-500 font-medium">Citizen Portal</p>
                                    </div>
                              </div>
                        </div>

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

                        <div className="p-4 border-t border-slate-100">
                              <div className="flex items-center gap-3 mb-3 px-2">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                                          {user?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                          <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                                          <p className="text-[10px] text-emerald-600 font-semibold">✓ Verified Citizen</p>
                                    </div>
                              </div>
                              <button
                                    type="button"
                                    onClick={onLogout}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold"
                              >
                                    <LogOut className="w-4 h-4" /> Logout
                              </button>
                        </div>
                  </aside>
            </>
      );
}
