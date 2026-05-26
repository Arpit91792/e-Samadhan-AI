import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Siren, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getEmergencyComplaints } from '../../api/admin';
import StatusBadge from '../citizen/StatusBadge';
import { deptLabel } from '../../utils/departmentMeta';

export default function AdminEmergencies() {
      const { t } = useTranslation();
      const [items, setItems] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
            getEmergencyComplaints()
                  .then(({ data }) => setItems(data.complaints || []))
                  .finally(() => setLoading(false));
      }, []);

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Siren className="w-6 h-6 text-red-400" /> {t('adminEmergenciesPage.title')}
                  </h1>
                  {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto" />
                  ) : items.length === 0 ? (
                        <p className="text-center text-slate-500 py-12">{t('adminEmergenciesPage.noEmergencies')}</p>
                  ) : (
                        <div className="space-y-3">
                              {items.map((c) => (
                                    <div key={c._id} className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 flex justify-between gap-3">
                                          <div>
                                                <p className="font-bold text-white">{c.title}</p>
                                                <p className="text-xs text-red-300">{c.complaintId} · {deptLabel(c.category)}</p>
                                                <p className="text-xs text-slate-400 mt-1">{c.citizen?.name} · {c.citizen?.phone}</p>
                                          </div>
                                          <StatusBadge status={c.status} />
                                    </div>
                              ))}
                        </div>
                  )}
            </motion.div>
      );
}
