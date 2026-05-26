import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';

export default function NotificationsPanel() {
      const { t } = useTranslation();
      const [items, setItems] = useState([]);
      const [loading, setLoading] = useState(true);

      const load = () => {
            getNotifications({ limit: 30 })
                  .then(({ data }) => setItems(data.notifications || []))
                  .catch(() => { })
                  .finally(() => setLoading(false));
      };

      useEffect(() => {
            load();
            const timer = setInterval(load, 30000);
            return () => clearInterval(timer);
      }, []);

      const markAll = async () => {
            await markAllNotificationsRead();
            toast.success(t('notificationsPanel.allMarkedRead'));
            load();
      };

      const markOne = async (id) => {
            await markNotificationRead(id);
            load();
      };

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
                  <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                              <Bell className="w-6 h-6" /> {t('notificationsPanel.title')}
                        </h1>
                        <button type="button" onClick={markAll} className="text-sm font-bold text-blue-600 flex items-center gap-1">
                              <CheckCheck className="w-4 h-4" /> {t('notificationsPanel.markAllRead')}
                        </button>
                  </div>
                  {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  ) : items.length === 0 ? (
                        <p className="text-center text-slate-500 py-12">{t('notificationsPanel.noNotifications')}</p>
                  ) : (
                        <div className="space-y-2">
                              {items.map((n) => (
                                    <button
                                          key={n._id}
                                          type="button"
                                          onClick={() => !n.isRead && markOne(n._id)}
                                          className={`w-full text-left p-4 rounded-xl border transition-all ${n.isRead ? 'bg-white border-slate-100' : 'bg-blue-50 border-blue-200'}`}
                                    >
                                          <p className="font-bold text-sm text-slate-900">{n.title}</p>
                                          <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                                          <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                                    </button>
                              ))}
                        </div>
                  )}
            </motion.div>
      );
}
