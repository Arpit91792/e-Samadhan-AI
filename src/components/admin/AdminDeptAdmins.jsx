import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getDepartmentAdmins, createDepartmentAdmin, removeDepartmentAdmin } from '../../api/admin';
import { DEPARTMENTS } from '../../utils/complaintConstants';
import { deptLabel } from '../../utils/departmentMeta';

export default function AdminDeptAdmins() {
      const { t } = useTranslation();
      const [admins, setAdmins] = useState([]);
      const [form, setForm] = useState({ name: '', email: '', password: '', department: 'police' });

      const load = () => {
            getDepartmentAdmins()
                  .then(({ data }) => setAdmins(data.admins || []))
                  .catch(() => toast.error(t('toast.failedToLoad')));
      };

      useEffect(() => { load(); }, []);

      const submit = async (e) => {
            e.preventDefault();
            try {
                  await createDepartmentAdmin(form);
                  toast.success(t('toast.success'));
                  setForm({ name: '', email: '', password: '', department: 'police' });
                  load();
            } catch (err) {
                  toast.error(err.response?.data?.message || t('toast.error'));
            }
      };

      const remove = async (id) => {
            if (!window.confirm(t('common.confirmDelete') || 'Deactivate this department admin?')) return;
            try {
                  await removeDepartmentAdmin(id);
                  toast.success(t('toast.success'));
                  load();
            } catch (err) {
                  toast.error(err.response?.data?.message || t('toast.error'));
            }
      };

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h1 className="text-2xl font-black text-white">Department Admins</h1>

                  <form onSubmit={submit} className="rounded-2xl bg-white/5 border border-white/10 p-5 grid sm:grid-cols-2 gap-3">
                        <input className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        <input className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        <input className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                        <select className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                              {DEPARTMENTS.filter((d) => d.value !== 'other').map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                              ))}
                        </select>
                        <button type="submit" className="sm:col-span-2 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl text-sm">{t('adminOfficersPage.createOfficerTitle')}</button>
                  </form>

                  <div className="space-y-2">
                        {admins.map((a) => (
                              <div key={a._id} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div>
                                          <p className="font-bold text-white">{a.name}</p>
                                          <p className="text-xs text-slate-400">{a.email} · {deptLabel(a.managedDepartment)}</p>
                                    </div>
                                    <button type="button" onClick={() => remove(a._id)} className="text-xs text-red-400 font-bold">Remove</button>
                              </div>
                        ))}
                  </div>
            </motion.div>
      );
}
