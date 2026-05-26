import React, { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';

import { Eye, EyeOff, Mail, Lock, Shield, Building2, ArrowRight, Loader2 } from 'lucide-react';

import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

import { adminLogin, verifyAdminSession } from '../../api/admin';

import { useAuth } from '../../context/AuthContext';

import { ADMIN_LOGIN_DEPARTMENTS, getAdminDashboardPath, deptLabel } from '../../utils/departmentMeta';
import { hasValidAdminSession } from '../../utils/authStorage';



const fieldVariants = {

      hidden: { opacity: 0, y: 8 },

      visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06 } }),

};



const emptyForm = { email: '', password: '', department: '' };



export default function AdminLoginPage() {

      const navigate = useNavigate();

      const { setAdminSession } = useAuth();
      const { t } = useTranslation();

      const [form, setForm] = useState(emptyForm);

      const [showPassword, setShowPassword] = useState(false);

      const [loading, setLoading] = useState(false);

      const [errors, setErrors] = useState({});



      const clearValidation = () => {

            setErrors({});

            toast.dismiss();

      };



      const validate = () => {

            const errs = {};

            if (!form.email.trim()) errs.email = t('validation.emailRequired');

            else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = t('validation.enterValidEmail');

            if (!form.password) errs.password = t('validation.passwordRequired');

            if (!form.department) errs.department = t('validation.departmentRequired');

            setErrors(errs);

            return Object.keys(errs).length === 0;

      };



      const handleSubmit = async (e) => {

            e.preventDefault();

            if (!validate()) {

                  toast.error('Please complete all fields');

                  return;

            }



            setLoading(true);

            clearValidation();

            try {

                  const { data } = await adminLogin(

                        form.email.trim(),

                        form.password,

                        form.department

                  );



                  const adminUser = data.admin || data.user;

                  if (!data.token || !adminUser) {

                        toast.error(t('adminLogin.invalidResponse'));

                        return;

                  }

                  if (adminUser.role !== 'admin') {

                        toast.error(t('adminLogin.unauthorized'));

                        return;

                  }



                  const deptSlug = data.department || adminUser.department || adminUser.managedDepartment || form.department;

                  const adminWithDept = {

                        ...adminUser,

                        role: 'admin',

                        department: deptSlug,

                        managedDepartment: deptSlug,

                  };



                  const ok = setAdminSession(data.token, adminWithDept);

                  if (!ok || !hasValidAdminSession()) {

                        toast.error(t('adminLogin.sessionError'));

                        return;

                  }

                  try {
                        await verifyAdminSession();
                  } catch (verifyErr) {
                        console.error('Post-login verify failed:', verifyErr?.response?.data);
                        toast.error(verifyErr.response?.data?.message || 'Login succeeded but session invalid. Try again.');
                        return;
                  }

                  clearValidation();

                  setForm(emptyForm);

                  toast.success(data.message || `Welcome to ${deptLabel(deptSlug)} Dashboard`);

                  navigate(getAdminDashboardPath(deptSlug), { replace: true });

            } catch (err) {

                  const msg = err.response?.data?.message || 'Login failed';

                  const code = err.response?.data?.code;



                  if (code === 'INVALID_EMAIL') {

                        toast.error('Invalid email');

                        setErrors({ email: 'Invalid email' });

                  } else if (code === 'INVALID_PASSWORD') {

                        toast.error('Invalid password');

                        setErrors({ password: 'Invalid password' });

                  } else if (code === 'DEPARTMENT_MISMATCH' || code === 'INVALID_DEPARTMENT') {

                        toast.error('Department does not match your account');

                        setErrors({ department: 'Department does not match your account' });

                  } else if (code === 'DEPARTMENT_REQUIRED') {

                        toast.error('Please select your department');

                        setErrors({ department: 'Department is required' });

                  } else if (code === 'UNAUTHORIZED') {

                        toast.error('Unauthorized access');

                        setErrors({ general: msg });

                  } else {

                        toast.error(msg);

                        setErrors({ general: msg });

                  }

            } finally {

                  setLoading(false);

            }

      };



      return (

            <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-red-950">

                  <motion.div

                        initial={{ opacity: 0, x: -20 }}

                        animate={{ opacity: 1, x: 0 }}

                        className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-red-800 via-rose-900 to-slate-900 flex-col justify-between p-12"

                  >

                        <div className="absolute inset-0 bg-grid opacity-10" />

                        <motion.div

                              initial={{ opacity: 0, y: 20 }}

                              animate={{ opacity: 1, y: 0 }}

                              transition={{ delay: 0.2 }}

                              className="relative z-10"

                        >

                              <div className="flex items-center gap-3 mb-8">

                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">

                                          <Shield className="w-6 h-6 text-white" />

                                    </div>

                                    <div>

                                          <p className="font-black text-white text-lg">e-Samadhan AI</p>

                                          <p className="text-red-200 text-xs font-semibold">Government Admin Portal</p>

                                    </div>

                              </div>

                              <h1 className="text-3xl font-black text-white leading-tight mb-4">

                                    Department-Based<br />Administration

                              </h1>

                              <p className="text-red-100/80 text-sm leading-relaxed max-w-sm">

                                    Email, password, and department are all required. Your selected department must match your registered admin account.

                              </p>

                        </motion.div>

                        <p className="relative z-10 text-xs text-red-200/60">© e-Samadhan AI — Smart Governance</p>

                  </motion.div>



                  <div className="flex-1 flex items-center justify-center p-6 sm:p-10">

                        <motion.div

                              initial={{ opacity: 0, y: 20, scale: 0.98 }}

                              animate={{ opacity: 1, y: 0, scale: 1 }}

                              transition={{ type: 'spring', stiffness: 120, damping: 18 }}

                              className="w-full max-w-md"

                        >

                              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">

                                    <motion.div

                                          initial={{ scale: 0.9, opacity: 0 }}

                                          animate={{ scale: 1, opacity: 1 }}

                                          className="lg:hidden flex items-center gap-2 mb-6"

                                    >

                                          <Shield className="w-6 h-6 text-red-400" />

                                          <span className="font-black text-white">Admin Login</span>

                                    </motion.div>

                                    <h2 className="text-2xl font-black text-white mb-1">{t('adminLogin.signIn')}</h2>

                                    <p className="text-slate-400 text-sm mb-6">

                                          {t('adminLogin.allRequired')}

                                    </p>



                                    <AnimatePresence>

                                          {errors.general && (

                                                <motion.div

                                                      initial={{ opacity: 0, height: 0 }}

                                                      animate={{ opacity: 1, height: 'auto' }}

                                                      exit={{ opacity: 0, height: 0 }}

                                                      className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300"

                                                >

                                                      {errors.general}

                                                </motion.div>

                                          )}

                                    </AnimatePresence>



                                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                                          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">

                                                <label className="block text-xs font-bold text-slate-300 mb-1.5">{t('auth.emailAddress')} *</label>

                                                <div className="relative">

                                                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                                                      <input

                                                            type="email"

                                                            autoComplete="email"

                                                            value={form.email}

                                                            onChange={(e) => {

                                                                  setForm({ ...form, email: e.target.value });

                                                                  if (errors.email) setErrors((p) => ({ ...p, email: '' }));

                                                            }}

                                                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-white text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-red-500/40 outline-none ${errors.email ? 'border-red-500/60' : 'border-white/10'}`}

                                                            placeholder="admin@department.gov.in"

                                                      />

                                                </div>

                                                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}

                                          </motion.div>



                                          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">

                                                <label className="block text-xs font-bold text-slate-300 mb-1.5">{t('auth.password')} *</label>

                                                <div className="relative">

                                                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                                                      <input

                                                            type={showPassword ? 'text' : 'password'}

                                                            autoComplete="current-password"

                                                            value={form.password}

                                                            onChange={(e) => {

                                                                  setForm({ ...form, password: e.target.value });

                                                                  if (errors.password) setErrors((p) => ({ ...p, password: '' }));

                                                            }}

                                                            className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white/5 border text-white text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-red-500/40 outline-none ${errors.password ? 'border-red-500/60' : 'border-white/10'}`}

                                                            placeholder="••••••••"

                                                      />

                                                      <button

                                                            type="button"

                                                            onClick={() => setShowPassword(!showPassword)}

                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"

                                                            aria-label={showPassword ? 'Hide password' : 'Show password'}

                                                      >

                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}

                                                      </button>

                                                </div>

                                                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}

                                          </motion.div>



                                          <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">

                                                <label className="block text-xs font-bold text-slate-300 mb-1.5">{t('auth.department')} *</label>

                                                <div className="relative">

                                                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />

                                                      <select

                                                            required

                                                            value={form.department}

                                                            onChange={(e) => {

                                                                  setForm({ ...form, department: e.target.value });

                                                                  if (errors.department) setErrors((p) => ({ ...p, department: '' }));

                                                            }}

                                                            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-white text-sm focus:ring-2 focus:ring-red-500/40 outline-none appearance-none cursor-pointer ${errors.department ? 'border-red-500/60' : 'border-white/10'}`}

                                                      >

                                                            <option value="" className="bg-slate-900 text-slate-400">{t('auth.selectDepartment')}</option>

                                                            {ADMIN_LOGIN_DEPARTMENTS.map((d) => (

                                                                  <option key={d.value} value={d.value} className="bg-slate-900">

                                                                        {d.label}

                                                                  </option>

                                                            ))}

                                                      </select>

                                                </div>

                                                {errors.department && (

                                                      <p className="text-xs text-red-400 mt-1">{errors.department}</p>

                                                )}

                                          </motion.div>



                                          <motion.button

                                                type="submit"

                                                disabled={loading}

                                                whileHover={{ scale: loading ? 1 : 1.02 }}

                                                whileTap={{ scale: 0.98 }}

                                                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-60"

                                          >

                                                {loading ? (

                                                      <>

                                                            <Loader2 className="w-5 h-5 animate-spin" />

                                                            {t('adminLogin.verifying')}

                                                      </>

                                                ) : (

                                                      <>

                                                            <ArrowRight className="w-5 h-5" />

                                                            {t('adminLogin.accessDashboard')}

                                                      </>

                                                )}

                                          </motion.button>

                                    </form>



                                    <p className="mt-6 text-center text-xs text-slate-500">

                                          {t('adminLogin.newAdmin')}{' '}

                                          <Link to="/admin/register" className="text-red-400 font-semibold hover:underline">{t('adminLogin.register')}</Link>

                                          {' · '}

                                          {t('adminLogin.citizenOrOfficer')}{' '}

                                          <Link to="/login" className="text-slate-400 font-semibold hover:underline">{t('adminLogin.standardLogin')}</Link>

                                    </p>

                              </div>

                        </motion.div>

                  </div>

            </div>

      );

}

