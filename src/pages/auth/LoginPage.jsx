import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, BadgeCheck, Building2, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { loginOfficer } from '../../api/officer';
import {
      hasValidSession,
      hasValidOfficerSession,
      readStoredAuth,
      readStoredOfficer,
      persistOfficerSession,
} from '../../utils/authStorage';

export default function LoginPage() {
      const navigate = useNavigate();
      const location = useLocation();
      const { login, setSession, getDashboardPath } = useAuth();
      const { t } = useTranslation();

      const DEPARTMENTS = [
            { value: 'electricity', label: t('departments.electricity') },
            { value: 'water_supply', label: t('departments.water_supply') },
            { value: 'roads_transport', label: t('departments.roads_transport') },
            { value: 'sanitation', label: t('departments.sanitation') },
            { value: 'police', label: t('departments.police') },
            { value: 'healthcare', label: t('departments.healthcare') },
            { value: 'municipal', label: t('departments.municipal') },
            { value: 'education', label: t('departments.education') },
      ];

      const [role, setRole] = useState('citizen');
      const [form, setForm] = useState({ email: '', password: '', rememberMe: false, employeeId: '', department: '' });
      const [showPassword, setShowPassword] = useState(false);
      const [loading, setLoading] = useState(false);
      const [errors, setErrors] = useState({});
      const [blockedInfo, setBlockedInfo] = useState(null);

      const from = location.state?.from?.pathname || null;

      const validate = () => {
            const errs = {};
            if (role === 'citizen') {
                  if (!form.email) errs.email = t('validation.emailRequired');
                  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = t('validation.enterValidEmail');
            } else {
                  if (!form.employeeId.trim()) errs.employeeId = t('validation.employeeIdRequired');
                  if (!form.email) errs.email = t('validation.emailRequired');
                  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = t('validation.enterValidEmail');
                  if (!form.department) errs.department = t('validation.departmentRequired');
            }
            if (!form.password) errs.password = t('validation.passwordRequired');
            else if (form.password.length < 8) errs.password = t('validation.passwordMinLength');
            setErrors(errs);
            return Object.keys(errs).length === 0;
      };

      const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
            if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
            if (blockedInfo) setBlockedInfo(null);
      };

      const handleSubmit = async (e) => {
            e.preventDefault();
            if (!validate()) return;
            setLoading(true);
            try {
                  let data;
                  if (role === 'citizen') {
                        data = await login(form.email, form.password);
                  } else {
                        const response = await loginOfficer({
                              employeeId: form.employeeId.trim(),
                              email: form.email.trim(),
                              department: form.department,
                              password: form.password,
                        });
                        data = response.data;
                        if (!data?.token || !data?.user) throw new Error('Invalid login response from server');
                        const saved = persistOfficerSession(data.token, data.officer || data.user, { debug: import.meta.env.DEV });
                        if (!saved) throw new Error('Could not save officer session');
                        if (!hasValidOfficerSession()) throw new Error('Officer session could not be verified. Please try again.');
                        setErrors({});
                        toast.success(data.message || t('toast.welcomeBack'));
                        navigate('/officer/dashboard', { replace: true });
                        return;
                  }
                  const authUser = readStoredAuth() || data.user;
                  if (!hasValidSession() || !authUser?.role) throw new Error('Session could not be saved. Please try again.');
                  setErrors({});
                  toast.success(data.message || t('toast.welcomeBack'));
                  const dest = from || getDashboardPath(authUser.role);
                  navigate(dest, { replace: true });
            } catch (err) {
                  const code = err.response?.data?.code;
                  const msg = err.response?.data?.message || t('toast.loginFailed');
                  if (code === 'ACCOUNT_BLOCKED' || code === 'ACCOUNT_SUSPENDED') {
                        setBlockedInfo({ message: msg });
                        return;
                  }
                  toast.error(msg);
                  setErrors({ general: msg });
            } finally {
                  setLoading(false);
            }
      };

      return (
            <AuthLayout title={t('auth.welcomeBack')} subtitle={t('auth.signInSubtitle')}>
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">

                        {/* Role selector */}
                        <div className="flex items-center gap-2 justify-center mb-3">
                              <button type="button"
                                    onClick={() => { setRole('citizen'); setBlockedInfo(null); setErrors({}); }}
                                    className={`flex-1 py-2 rounded-2xl text-sm font-semibold transition ${role === 'citizen' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                                    {t('auth.citizen')}
                              </button>
                              <button type="button"
                                    onClick={() => { setRole('officer'); setBlockedInfo(null); setErrors({}); }}
                                    className={`flex-1 py-2 rounded-2xl text-sm font-semibold transition ${role === 'officer' ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                                    {t('auth.officer')}
                              </button>
                        </div>

                        {/* Blocked account alert */}
                        {blockedInfo && (
                              <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-red-600">
                                          <ShieldOff className="w-5 h-5 text-white flex-shrink-0" />
                                          <span className="text-white font-bold text-sm">{t('auth.accessDenied')}</span>
                                    </div>
                                    <div className="px-4 py-4 space-y-2">
                                          <p className="text-red-800 font-semibold text-sm">{t('auth.accountBlocked')}</p>
                                          <p className="text-red-600 text-xs leading-relaxed">{blockedInfo.message || t('auth.contactAdmin')}</p>
                                          <div className="mt-3 p-3 bg-red-100 rounded-xl border border-red-200">
                                                <p className="text-xs text-red-700 font-medium">{t('auth.whatThisMeans')}</p>
                                                <ul className="mt-1.5 space-y-1 text-xs text-red-600">
                                                      <li>{t('auth.cannotLogin')}</li>
                                                      <li>{t('auth.cannotAccessDashboard')}</li>
                                                      <li>{t('auth.cannotManageComplaints')}</li>
                                                      <li>{t('auth.contactToUnblock')}</li>
                                                </ul>
                                          </div>
                                    </div>
                              </motion.div>
                        )}

                        {/* General error */}
                        {errors.general && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">!</span>
                                    {errors.general}
                              </motion.div>
                        )}

                        {/* Officer fields */}
                        {role === 'officer' && (
                              <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.employeeId')}</label>
                                          <div className="relative">
                                                <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                                                <input type="text" name="employeeId" value={form.employeeId} onChange={handleChange}
                                                      placeholder="POL-2026-001"
                                                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm font-mono tracking-wider text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${errors.employeeId ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                          </div>
                                          {errors.employeeId && <p className="mt-1 text-xs text-red-500">{errors.employeeId}</p>}
                                    </div>
                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.department')}</label>
                                          <div className="relative">
                                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
                                                <select name="department" value={form.department} onChange={handleChange}
                                                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all appearance-none ${errors.department ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`}>
                                                      <option value="">{t('auth.selectDepartment')}</option>
                                                      {DEPARTMENTS.map((d) => (
                                                            <option key={d.value} value={d.value}>{d.label}</option>
                                                      ))}
                                                </select>
                                          </div>
                                          {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                                    </div>
                              </div>
                        )}

                        {/* Email */}
                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.emailAddress')}</label>
                              <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                                    <input type="email" name="email" value={form.email} onChange={handleChange}
                                          placeholder={role === 'officer' ? 'officer@gov.in' : 'you@example.com'}
                                          autoComplete="email"
                                          className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                              </div>
                              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                              <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-semibold text-gray-700">{t('auth.password')}</label>
                                    <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                          {t('auth.forgotPassword')}
                                    </Link>
                              </div>
                              <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
                                    <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                                          placeholder={t('auth.password')} autoComplete="current-password"
                                          className={`w-full pl-10 pr-11 py-3 bg-white border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                              </div>
                              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2">
                              <input type="checkbox" id="rememberMe" name="rememberMe" checked={form.rememberMe} onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                              <label htmlFor="rememberMe" className="text-sm text-gray-600">{t('auth.rememberMe')}</label>
                        </div>

                        {/* Submit */}
                        <motion.button type="submit" disabled={loading}
                              whileHover={!loading ? { scale: 1.02, boxShadow: '0 10px 30px rgba(37,99,235,0.35)' } : {}}
                              whileTap={!loading ? { scale: 0.98 } : {}}
                              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                              {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />{t('auth.signingIn')}</>
                              ) : (
                                    <>{t('auth.signIn')}<ArrowRight className="w-4 h-4" /></>
                              )}
                        </motion.button>

                        {/* Divider */}
                        <div className="relative flex items-center gap-3">
                              <div className="flex-1 h-px bg-gray-200" />
                              <span className="text-xs text-gray-400 font-medium">{t('auth.newToApp')}</span>
                              <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Sign up link */}
                        <Link to="/signup">
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-blue-600 font-bold rounded-xl border-2 border-blue-200 hover:border-blue-400 text-sm transition-all cursor-pointer">
                                    {t('auth.createFreeAccount')}
                              </motion.div>
                        </Link>

                        {/* Officer registration link */}
                        {role === 'officer' && (
                              <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                          {t('auth.firstTime')}{' '}
                                          <Link to="/officer/register" className="text-violet-600 font-semibold hover:underline">
                                                {t('auth.registerAsOfficer')}
                                          </Link>
                                    </p>
                              </div>
                        )}

                        {/* Demo credentials */}
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                              <p className="text-xs font-semibold text-blue-700 mb-2">{t('auth.demoCredentials')}</p>
                              <div className="space-y-1 text-xs text-blue-600">
                                    <p>Citizen: citizen@demo.com / Demo@1234</p>
                                    <p>Officer: officer@demo.com / Demo@1234</p>
                                    <p>Admin: admin@demo.com / Demo@1234</p>
                              </div>
                        </div>
                  </form>
            </AuthLayout>
      );
}
