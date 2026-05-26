import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getDepartments } from '../../api/admin';

export default function AdminDepartments() {
      const { t } = useTranslation();
      const [departments, setDepartments] = useState([]);

      useEffect(() => {
            getDepartments().then(({ data }) => setDepartments(data.departments || []));
      }, []);

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-black text-white">{t('adminDepartmentsPage.title')}</h1>
                  <div className="grid sm:grid-cols-2 gap-4">
                        {departments.map((d) => (
                              <div key={d._id} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                    <p className="font-bold text-white">{d.name}</p>
                                    <p className="text-xs text-slate-400 mt-1">{d.description}</p>
                                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                          <div>
                                                <p className="text-lg font-black text-white">{d.stats?.totalComplaints || 0}</p>
                                                <p className="text-[10px] text-slate-500">{t('adminDepartmentsPage.total')}</p>
                                          </div>
                                          <div>
                                                <p className="text-lg font-black text-emerald-400">{d.stats?.resolvedComplaints || 0}</p>
                                                <p className="text-[10px] text-slate-500">{t('adminDepartmentsPage.resolved')}</p>
                                          </div>
                                          <div>
                                                <p className="text-lg font-black text-amber-400">{d.stats?.pendingComplaints || 0}</p>
                                                <p className="text-[10px] text-slate-500">{t('adminDepartmentsPage.pending')}</p>
                                          </div>
                                    </div>
                              </div>
                        ))}
                  </div>
            </motion.div>
      );
}
