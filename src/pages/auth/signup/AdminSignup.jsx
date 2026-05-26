import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
      User, Mail, Phone, Lock, Key, ShieldCheck, ArrowRight, Eye, EyeOff, Building2, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
      Field, Input, PasswordInput, PasswordStrength, PasswordMatch,
      SubmitButton, SectionHeader, ErrorAlert, OTPSection
} from './shared';
import useOTP from './useOTP';
import { ADMIN_LOGIN_DEPARTMENTS, getAdminDashboardPath } from '../../../utils/departmentMeta';

export default function AdminSignup() {
      const navigate = useNavigate();
      const { register, setSession } = useAuth();
      const { t } = useTranslation();
      const otpHook = useOTP();

      const [form, setForm] = useState({
            name: '',
            email: '',
            phone: '',
            department: '',
            adminSecretKey: '',
            password: '',
            confirmPassword: '',
      });
      const [errors, setErrors] = useState({});
      const [loading, setLoading] = useState(false);
      const [showPwd, setShowPwd] = useState(false);
      const [showConfirm, setShowConfirm] = useState(false);
      const [showSecret, setShowSecret] = useState(false);

      const set = (k, v) => {
            setForm((p) => ({ ...p, [k]: v }));
            if (errors[k]) setErrors((p) => ({ ...p, [k]: '' }));
      };

      const validate = () => {
            const e = {};
            if (!form.name.trim()) e.name = 'Full name is required';
            if (!form.phone) e.phone = 'Mobile number is required';
            else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit number';
            if (!form.email) e.email = 'Admin email is required';
            else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
            if (!form.department) e.department = 'Please select department';
            if (!form.adminSecretKey.trim()) e.adminSecretKey = 'Admin secret key is required';
            if (!form.password) e.password = 'Password is required';
            else if (form.password.length < 8) e.password = 'Min 8 characters';
            else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) {
                  e.password = 'Must include uppercase, lowercase & number';
            }
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
            if (!otpHook.otpVerified) e.otp = 'Please verify your email with OTP';
            setErrors(e);
            return Object.keys(e).length === 0;
      };

      const handleSubmit = async (e) => {
            e.preventDefault();
            if (!validate()) {
                  if (!form.department) toast.error('Please select department');
                  else toast.error('Please fix the errors below');
                  return;
            }

            setLoading(true);
            try {
                  const selected = ADMIN_LOGIN_DEPARTMENTS.find((d) => d.value === form.department);
                  const fd = new FormData();
                  fd.append('name', form.name.trim());
                  fd.append('email', form.email.trim());
                  fd.append('phone', form.phone);
                  fd.append('department', selected?.label || form.department);
                  fd.append('adminSecretKey', form.adminSecretKey);
                  fd.append('password', form.password);
                  fd.append('role', 'admin');
                  fd.append('otpVerified', 'true');

                  const data = await register(fd);
                  const deptSlug = data.user?.managedDepartment || form.department;
                  if (data.token && data.user) {
                        setSession(data.token, { ...data.user, managedDepartment: deptSlug });
                        sessionStorage.setItem('adminDepartment', deptSlug);
                  }
                  toast.success(data.message || 'Admin account created!');
                  navigate(getAdminDashboardPath(deptSlug), { replace: true });
            } catch (err) {
                  const msg = err.response?.data?.message || 'Registration failed';
                  const code = err.response?.data?.code;
                  if (code === 'DEPARTMENT_REQUIRED') {
                        toast.error('Please select department');
                        setErrors({ department: 'Please select department' });
                  } else if (code === 'INVALID_DEPARTMENT') {
                        toast.error('Invalid department selected');
                        setErrors({ department: 'Invalid department selected' });
                  } else if (code === 'INVALID_SECRET') {
                        toast.error('Invalid admin secret key');
                        setErrors({ adminSecretKey: 'Invalid admin secret key' });
                  } else {
                        toast.error(msg);
                        setErrors({ general: msg });
                  }
            } finally {
                  setLoading(false);
            }
      };

      return (
            <div className="glass rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
                        <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">👑</div>
                              <div>
                                    <h2 className="text-xl font-black text-white">{t('adminSignup.title')}</h2>
                                    <p className="text-amber-100 text-xs">{t('adminSignup.subtitle')}</p>
                              </div>
                        </div>
                  </div>

                  <div className="mx-6 mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                              <p className="text-sm font-bold text-amber-800">Restricted Access</p>
                              <p className="text-xs text-amber-600 mt-0.5">
                                    Choose your government department. You will only access that department&apos;s dashboard and data after login.
                              </p>
                        </div>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <ErrorAlert message={errors.general} />

                        <SectionHeader icon="👑" title="Admin Details" color="text-amber-700 bg-amber-50" />

                        <Field label="Full Name" error={errors.name} required>
                              <Input
                                    icon={User}
                                    value={form.name}
                                    onChange={(e) => set('name', e.target.value)}
                                    placeholder="Admin Name"
                                    error={errors.name}
                              />
                        </Field>

                        <Field label="Mobile Number" error={errors.phone} required>
                              <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
                                    <input
                                          type="tel"
                                          maxLength={10}
                                          value={form.phone}
                                          onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                          placeholder="9876543210"
                                          className={`w-full pl-16 pr-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all hover:border-amber-300 ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-amber-200 focus:border-amber-400'}`}
                                    />
                              </div>
                              {errors.phone && <p className="mt-1 text-xs text-red-500">⚠ {errors.phone}</p>}
                        </Field>

                        <Field label="Official Admin Email" error={errors.email} required>
                              <Input
                                    icon={Mail}
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => set('email', e.target.value)}
                                    placeholder="admin@esamadhan.gov.in"
                                    error={errors.email}
                              />
                        </Field>

                        {/* Department — between email and secret key */}
                        <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25 }}
                        >
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Department <span className="text-red-400">*</span>
                              </label>
                              <div className="relative group">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 w-[18px] h-[18px] z-10 pointer-events-none" />
                                    <select
                                          required
                                          value={form.department}
                                          onChange={(e) => set('department', e.target.value)}
                                          className={`w-full pl-10 pr-10 py-3 bg-white/90 backdrop-blur border-2 rounded-xl text-sm appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 hover:border-amber-400 hover:shadow-md ${errors.department
                                                ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                                : 'border-amber-200/80 focus:ring-amber-200 focus:border-amber-500 bg-gradient-to-r from-white to-amber-50/30'
                                                }`}
                                    >
                                          <option value="">Select Department</option>
                                          {ADMIN_LOGIN_DEPARTMENTS.map((d) => (
                                                <option key={d.value} value={d.value}>
                                                      {d.label}
                                                </option>
                                          ))}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-amber-600 transition-colors" />
                              </div>
                              {errors.department && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">⚠ {errors.department}</p>
                              )}
                              {form.department && !errors.department && (
                                    <p className="mt-1.5 text-xs text-amber-700 font-medium">
                                          Assigned: {ADMIN_LOGIN_DEPARTMENTS.find((d) => d.value === form.department)?.label}
                                    </p>
                              )}
                        </motion.div>

                        <SectionHeader icon="🔑" title="Admin Secret Key" color="text-red-700 bg-red-50" />
                        <Field label="Admin Secret Key" error={errors.adminSecretKey} required>
                              <div className="relative">
                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
                                    <input
                                          type={showSecret ? 'text' : 'password'}
                                          value={form.adminSecretKey}
                                          onChange={(e) => set('adminSecretKey', e.target.value)}
                                          placeholder="Enter admin secret key"
                                          className={`w-full pl-10 pr-11 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all font-mono ${errors.adminSecretKey ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-amber-200 focus:border-amber-400'}`}
                                    />
                                    <button
                                          type="button"
                                          onClick={() => setShowSecret(!showSecret)}
                                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                              </div>
                              {errors.adminSecretKey && <p className="mt-1 text-xs text-red-500">⚠ {errors.adminSecretKey}</p>}
                              <p className="mt-1.5 text-xs text-gray-400">
                                    Default dev key:{' '}
                                    <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-amber-600">ESAMADHAN_ADMIN_2025</code>
                              </p>
                        </Field>

                        <SectionHeader icon="🔒" title="Set Password" color="text-gray-700 bg-gray-50" />
                        <div className="grid sm:grid-cols-2 gap-4">
                              <Field label="Password" error={errors.password} required>
                                    <PasswordInput
                                          icon={Lock}
                                          show={showPwd}
                                          onToggle={() => setShowPwd(!showPwd)}
                                          value={form.password}
                                          onChange={(e) => set('password', e.target.value)}
                                          placeholder="Min 8 characters"
                                          error={errors.password}
                                    />
                                    <PasswordStrength password={form.password} />
                              </Field>
                              <Field label="Confirm Password" error={errors.confirmPassword} required>
                                    <PasswordInput
                                          icon={Lock}
                                          show={showConfirm}
                                          onToggle={() => setShowConfirm(!showConfirm)}
                                          value={form.confirmPassword}
                                          onChange={(e) => set('confirmPassword', e.target.value)}
                                          placeholder="Re-enter password"
                                          error={errors.confirmPassword}
                                    />
                                    <PasswordMatch password={form.password} confirm={form.confirmPassword} />
                              </Field>
                        </div>

                        <SectionHeader icon="✉️" title="Email OTP Verification" color="text-blue-700 bg-blue-50" />
                        {errors.otp && <p className="text-xs text-red-500">⚠ {errors.otp}</p>}
                        <OTPSection
                              email={form.email}
                              otpSent={otpHook.otpSent}
                              otpVerified={otpHook.otpVerified}
                              otp={otpHook.otp}
                              setOtp={otpHook.setOtp}
                              timer={otpHook.timer}
                              onSend={() => otpHook.sendOTP(form.email)}
                              onVerify={() => otpHook.verifyOTP(form.email)}
                              sending={otpHook.sending}
                              verifying={otpHook.verifying}
                        />

                        <SubmitButton loading={loading} gradient="from-amber-500 to-orange-500">
                              {t('adminSignup.createAdminAccount')} <ArrowRight className="w-4 h-4" />
                        </SubmitButton>

                        <p className="text-center text-sm text-gray-500">
                              Already have an account?{' '}
                              <a href="/admin/login" className="text-amber-600 font-semibold hover:underline">Admin sign in</a>
                        </p>
                  </form>
            </div>
      );
}
