import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
      Eye, EyeOff, Mail, Lock, Shield, Building2, ArrowRight, Loader2,
      User, Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useOTP from '../auth/signup/useOTP';
import { OTPSection } from '../auth/signup/shared.jsx';
import { registerAdmin } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_LOGIN_DEPARTMENTS, getAdminDashboardPath, deptLabel } from '../../utils/departmentMeta';
import { hasValidAdminSession } from '../../utils/authStorage';

const fieldVariants = {
      hidden: { opacity: 0, y: 8 },
      visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }),
};

export default function AdminRegisterPage() {
      const navigate = useNavigate();
      const { setAdminSession } = useAuth();
      const [form, setForm] = useState({
            name: '', email: '', mobile: '', password: '', confirmPassword: '', department: '',
      });
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirm, setShowConfirm] = useState(false);
      const [loading, setLoading] = useState(false);
      const [errors, setErrors] = useState({});
      const otpHook = useOTP();

      const validate = () => {
            const e = {};
            if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Enter your full name';
            if (!form.email.trim()) e.email = 'Official email is required';
            else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
            if (!form.mobile.trim()) e.mobile = 'Mobile number is required';
            else if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\D/g, '').slice(-10))) {
                  e.mobile = 'Enter a valid 10-digit Indian mobile number';
            }
            if (!form.password) e.password = 'Password is required';
            else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
            if (!form.department) e.department = 'Please select department';
            if (!otpHook.otpVerified) e.otp = 'Please verify your email with OTP';
            setErrors(e);
            return Object.keys(e).length === 0;
      };

      const handleSubmit = async (ev) => {
            ev.preventDefault();
            if (!validate()) {
                  toast.error('Please fix the form errors');
                  return;
            }
            if (!otpHook.otpVerified) {
                  toast.error('Please verify your email before registering');
                  return;
            }

            const deptSlug = form.department;
            setLoading(true);
            setErrors({});
            toast.dismiss();
            try {
                  const { data } = await registerAdmin({
                        name: form.name.trim(),
                        email: form.email.trim(),
                        mobile: form.mobile.replace(/\D/g, '').slice(-10),
                        password: form.password,
                        confirmPassword: form.confirmPassword,
                        department: deptSlug,
                        otpVerified: true,
                  });

                  const adminUser = data.admin || data.user;
                  if (!data.token || !adminUser) {
                        toast.error('Invalid registration response from server');
                        return;
                  }
                  const adminWithDept = {
                        ...adminUser,
                        role: 'admin',
                        department: deptSlug,
                        managedDepartment: deptSlug,
                  };
                  const ok = setAdminSession(data.token, adminWithDept);
                  if (!ok || !hasValidAdminSession()) {
                        toast.error('Could not save session. Please try again.');
                        return;
                  }

                  setErrors({});
                  toast.success(data.message || `Welcome — ${deptLabel(deptSlug)} Admin`);
                  navigate(getAdminDashboardPath(deptSlug), { replace: true });
            } catch (err) {
                  const msg = err.response?.data?.message || 'Registration failed';
                  const code = err.response?.data?.code;

                  if (code === 'DUPLICATE_EMAIL') {
                        toast.error('This email is already registered');
                        setErrors({ email: 'An account with this email already exists' });
                  } else if (code === 'DEPARTMENT_REQUIRED') {
                        toast.error('Please select department');
                        setErrors({ department: 'Please select department' });
                  } else if (code === 'INVALID_DEPARTMENT') {
                        toast.error('Invalid department');
                        setErrors({ department: 'Invalid department selected' });
                  } else if (code === 'INVALID_REGISTER_SECRET') {
                        toast.error('Invalid registration key');
                        setErrors({ registerSecret: 'Invalid registration key' });
                  } else {
                        toast.error(msg);
                        setErrors({ general: msg });
                  }
            } finally {
                  setLoading(false);
            }
      };

      return (
            <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950">
                  <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-violet-800 via-indigo-900 to-slate-900 flex-col justify-between p-12"
                  >
                        <div className="absolute inset-0 bg-grid opacity-10" />
                        <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                          <Shield className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                          <p className="font-black text-white text-lg">e-Samadhan AI</p>
                                          <p className="text-violet-200 text-xs font-semibold">Department Admin Onboarding</p>
                                    </div>
                              </div>
                              <h1 className="text-3xl font-black text-white leading-tight mb-4">
                                    Register your<br />department access
                              </h1>
                              <p className="text-violet-100/80 text-sm leading-relaxed max-w-sm">
                                    Your selected department is saved permanently and used at login and in the dashboard. You will only manage complaints and officers for that department.
                              </p>
                        </div>
                        <p className="relative z-10 text-xs text-violet-200/60">© e-Samadhan AI</p>
                  </motion.div>

                  <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
                        <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full max-w-md py-8"
                        >
                              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
                                    <h2 className="text-2xl font-black text-white mb-1">Admin Registration</h2>
                                    <p className="text-slate-400 text-sm mb-6">Official credentials + department</p>

                                    <AnimatePresence>
                                          {errors.general && (
                                                <motion.div
                                                      initial={{ opacity: 0 }}
                                                      animate={{ opacity: 1 }}
                                                      className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300"
                                                >
                                                      {errors.general}
                                                </motion.div>
                                          )}
                                    </AnimatePresence>

                                    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                                          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                                                <label className="block text-xs font-bold text-slate-300 mb-1">Full name *</label>
                                                <div className="relative">
                                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                      <input
                                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/40 ${errors.name ? 'border-red-500/60' : 'border-white/10'}`}
                                                            placeholder="Raj Sharma"
                                                            value={form.name}
                                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                      />
                                                </div>
                                                {errors.name && <p className="text-xs text-red-400 mt-0.5">{errors.name}</p>}
                                          </motion.div>

                                          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                                                <label className="block text-xs font-bold text-slate-300 mb-1">Official email *</label>
                                                <div className="relative">
                                                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                      <input
                                                            type="email"
                                                            autoComplete="email"
                                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/40 ${errors.email ? 'border-red-500/60' : 'border-white/10'}`}
                                                            placeholder="admin@department.gov.in"
                                                            value={form.email}
                                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                      />
                                                </div>
                                                {errors.email && <p className="text-xs text-red-400 mt-0.5">{errors.email}</p>}
                                          </motion.div>

                                          <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                                                <OTPSection
                                                      email={form.email}
                                                      otpSent={otpHook.otpSent}
                                                      otpVerified={otpHook.otpVerified}
                                                      otp={otpHook.otp}
                                                      setOtp={otpHook.setOtp}
                                                      timer={otpHook.timer}
                                                      onSend={() => otpHook.sendOTP(form.email, 'register')}
                                                      onVerify={() => otpHook.verifyOTP(form.email, 'register')}
                                                      sending={otpHook.sending}
                                                      verifying={otpHook.verifying}
                                                />
                                                {errors.otp && <p className="text-xs text-red-400 mt-0.5">{errors.otp}</p>}
                                          </motion.div>

                                          <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
                                                <label className="block text-xs font-bold text-slate-300 mb-1">Mobile number *</label>
                                                <div className="relative">
                                                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                      <input
                                                            type="tel"
                                                            autoComplete="tel"
                                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/40 ${errors.mobile ? 'border-red-500/60' : 'border-white/10'}`}
                                                            placeholder="9876543210"
                                                            value={form.mobile}
                                                            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                                      />
                                                </div>
                                                {errors.mobile && <p className="text-xs text-red-400 mt-0.5">{errors.mobile}</p>}
                                          </motion.div>

                                          <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
                                                <label className="block text-xs font-bold text-slate-300 mb-1">Department *</label>
                                                <div className="relative">
                                                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                                      <select
                                                            required
                                                            value={form.department}
                                                            onChange={(e) => setForm({ ...form, department: e.target.value })}
                                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/40 appearance-none cursor-pointer ${errors.department ? 'border-red-500/60' : 'border-white/10'}`}
                                                      >
                                                            <option value="" className="bg-slate-900 text-slate-400">Select department</option>
                                                            {ADMIN_LOGIN_DEPARTMENTS.map((d) => (
                                                                  <option key={d.value} value={d.value} className="bg-slate-900">{d.label}</option>
                                                            ))}
                                                      </select>
                                                </div>
                                                {errors.department && <p className="text-xs text-red-400 mt-0.5">{errors.department}</p>}
                                          </motion.div>

                                          <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
                                                <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                                                <div className="relative">
                                                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                      <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            autoComplete="new-password"
                                                            className={`w-full pl-10 pr-11 py-2.5 rounded-xl bg-white/5 border text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/40 ${errors.password ? 'border-red-500/60' : 'border-white/10'}`}
                                                            placeholder="Min. 8 characters"
                                                            value={form.password}
                                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                      />
                                                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                      </button>
                                                </div>
                                                {errors.password && <p className="text-xs text-red-400 mt-0.5">{errors.password}</p>}
                                          </motion.div>

                                          <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible">
                                                <label className="block text-xs font-bold text-slate-300 mb-1">Confirm password *</label>
                                                <div className="relative">
                                                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                      <input
                                                            type={showConfirm ? 'text' : 'password'}
                                                            autoComplete="new-password"
                                                            className={`w-full pl-10 pr-11 py-2.5 rounded-xl bg-white/5 border text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/40 ${errors.confirmPassword ? 'border-red-500/60' : 'border-white/10'}`}
                                                            placeholder="Repeat password"
                                                            value={form.confirmPassword}
                                                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                                      />
                                                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowConfirm(!showConfirm)}>
                                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                      </button>
                                                </div>
                                                {errors.confirmPassword && <p className="text-xs text-red-400 mt-0.5">{errors.confirmPassword}</p>}
                                          </motion.div>

                                          <motion.button
                                                type="submit"
                                                disabled={loading}
                                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-3 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                                          >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                                {loading ? 'Creating account...' : 'Create admin account'}
                                          </motion.button>
                                    </form>

                                    <p className="mt-6 text-center text-xs text-slate-500">
                                          Already registered?{' '}
                                          <Link to="/admin/login" className="text-violet-400 font-semibold hover:underline">Admin sign in</Link>
                                    </p>
                              </div>
                        </motion.div>
                  </div>
            </div>
      );
}
