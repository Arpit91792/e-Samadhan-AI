import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';

export default function ResetPasswordPage() {
      const { token } = useParams();
      const navigate = useNavigate();
      const { resetPassword, getDashboardPath } = useAuth();
      const { t } = useTranslation();

      const [form, setForm] = useState({ password: '', confirmPassword: '' });
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirm, setShowConfirm] = useState(false);
      const [loading, setLoading] = useState(false);
      const [errors, setErrors] = useState({});

      const handleChange = (e) => {
            setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
            if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
      };

      const validate = () => {
            const errs = {};
            if (!form.password) errs.password = t('validation.passwordRequired');
            else if (form.password.length < 8) errs.password = t('validation.passwordMinLength');
            else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
                  errs.password = 'Must contain uppercase, lowercase, and a number';
            if (!form.confirmPassword) errs.confirmPassword = t('validation.confirmPasswordRequired');
            else if (form.password !== form.confirmPassword) errs.confirmPassword = t('validation.passwordMismatch');
            setErrors(errs);
            return Object.keys(errs).length === 0;
      };

      const handleSubmit = async (e) => {
            e.preventDefault();
            if (!validate()) return;
            setLoading(true);
            try {
                  const data = await resetPassword(token, form.password);
                  toast.success(data.message || 'Password reset successfully!');
                  navigate(getDashboardPath(data.user.role), { replace: true });
            } catch (err) {
                  const msg = err.response?.data?.message || 'Reset failed. The link may have expired.';
                  toast.error(msg);
                  setErrors({ general: msg });
            } finally {
                  setLoading(false);
            }
      };

      const passwordStrength = () => {
            const p = form.password;
            if (!p) return null;
            let score = 0;
            if (p.length >= 8) score++;
            if (/[A-Z]/.test(p)) score++;
            if (/[a-z]/.test(p)) score++;
            if (/\d/.test(p)) score++;
            if (/[^A-Za-z0-9]/.test(p)) score++;
            if (score <= 2) return { label: t('officerRegister.strength.weak'), color: 'bg-red-400', width: '33%' };
            if (score <= 3) return { label: t('officerRegister.strength.fair'), color: 'bg-amber-400', width: '60%' };
            return { label: t('officerRegister.strength.strong'), color: 'bg-emerald-500', width: '100%' };
      };
      const strength = passwordStrength();

      const inputClass = (err) =>
            `w-full pl-10 pr-11 py-3 bg-white border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${err ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`;

      return (
            <AuthLayout title={t('profile.changePassword')} subtitle={t('forgotPassword.subtitle')}>
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        {errors.general && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                    {errors.general}{' '}
                                    <Link to="/forgot-password" className="underline font-semibold">{t('forgotPassword.tryAgain')}</Link>
                              </motion.div>
                        )}

                        {/* New Password */}
                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('profile.newPassword')}</label>
                              <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
                                    <input type={showPassword ? 'text' : 'password'} name="password" value={form.password}
                                          onChange={handleChange} placeholder={t('form.placeholders.password')} autoComplete="new-password"
                                          className={inputClass(errors.password)} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                              </div>
                              {strength && (
                                    <div className="mt-2">
                                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: strength.width }}
                                                      className={`h-full ${strength.color} rounded-full`} />
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                                    </div>
                              )}
                              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('profile.confirmNewPassword')}</label>
                              <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
                                    <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword}
                                          onChange={handleChange} placeholder={t('form.placeholders.confirmPassword')} autoComplete="new-password"
                                          className={inputClass(errors.confirmPassword)} />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                              </div>
                              {form.confirmPassword && form.password === form.confirmPassword && (
                                    <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" /> {t('verification.verified')}
                                    </p>
                              )}
                              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                        </div>

                        <motion.button type="submit" disabled={loading}
                              whileHover={!loading ? { scale: 1.02, boxShadow: '0 10px 30px rgba(37,99,235,0.35)' } : {}}
                              whileTap={!loading ? { scale: 0.98 } : {}}
                              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                              {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</>
                                    : <>{t('profile.changePassword')} <ArrowRight className="w-4 h-4" /></>}
                        </motion.button>

                        <Link to="/login" className="block text-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
                              ← {t('forgotPassword.backToLogin')}
                        </Link>
                  </form>
            </AuthLayout>
      );
}
