import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
      User, Mail, Phone, Key, ArrowLeft, ArrowRight, Loader2, ShieldAlert,
      Building2, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { FormField, PasswordStrength, OTPSection } from './FormField';
import { ADMIN_LOGIN_DEPARTMENTS, getAdminDashboardPath } from '../../../utils/departmentMeta';

export default function AdminSignup({ onBack }) {
      const navigate = useNavigate();
      const { register, setSession } = useAuth();
      const [loading, setLoading] = useState(false);
      const [otpVerified, setOtpVerified] = useState(false);
      const [errors, setErrors] = useState({});

      const [form, setForm] = useState({
            name: '',
            email: '',
            phone: '',
            department: '',
            adminSecretKey: '',
            password: '',
            confirmPassword: '',
      });

      const set = (field, value) => {
            setForm((p) => ({ ...p, [field]: value }));
            setErrors((p) => ({ ...p, [field]: '' }));
      };

      const validate = () => {
            const e = {};
            if (!form.name.trim() || form.name.length < 3) e.name = 'Enter full name';
            if (!form.phone || !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit mobile';
            if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter valid email';
            if (!form.department) e.department = 'Please select department';
            if (!form.adminSecretKey.trim()) e.adminSecretKey = 'Admin secret key is required';
            if (!form.password || form.password.length < 8) e.password = 'Min 8 characters';
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
            if (!otpVerified) e.otp = 'Please verify your email with OTP';
            setErrors(e);
            return Object.keys(e).length === 0;
      };

      const handleSubmit = async (e) => {
            e.preventDefault();
            if (!validate()) {
                  if (!form.department) toast.error('Please select department');
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
                  toast.error(msg);
                  setErrors({ general: msg });
                  if (err.response?.data?.code === 'DEPARTMENT_REQUIRED') {
                        setErrors({ department: 'Please select department' });
                  }
            } finally {
                  setLoading(false);
            }
      };

      return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                  <div className="flex items-center gap-3 mb-6">
                        <button type="button" onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                              <ArrowLeft className="w-4 h-4 text-gray-500" />
                        </button>
                        <div>
                              <h2 className="text-xl font-black text-gray-900">🔐 Admin Registration</h2>
                              <p className="text-xs text-gray-500">Department + secret key required</p>
                        </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5">
                        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                              <p className="text-sm font-semibold text-amber-800">Restricted Registration</p>
                              <p className="text-xs text-amber-600 mt-0.5">Select your department — access is limited to that department only.</p>
                        </div>
                  </div>

                  {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{errors.general}</div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField label="Full Name" icon={User} required error={errors.name}
                              value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Admin Full Name" />

                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number <span className="text-red-400">*</span></label>
                              <div className="flex">
                                    <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500">+91</span>
                                    <input
                                          type="tel"
                                          value={form.phone}
                                          onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                          placeholder="9876543210"
                                          maxLength={10}
                                          className={`flex-1 px-3 py-3 bg-white border rounded-r-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-amber-200 focus:border-amber-400'}`}
                                    />
                              </div>
                              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                        </div>

                        <FormField label="Official Admin Email" icon={Mail} type="email" required error={errors.email}
                              value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="admin@esamadhan.gov.in" />

                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Department <span className="text-red-400">*</span>
                              </label>
                              <div className="relative group">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 w-[18px] h-[18px] pointer-events-none z-10" />
                                    <select
                                          required
                                          value={form.department}
                                          onChange={(e) => set('department', e.target.value)}
                                          className={`w-full pl-10 pr-10 py-3 bg-gradient-to-r from-white to-amber-50/40 border-2 rounded-xl text-sm appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 hover:border-amber-400 hover:shadow-sm ${errors.department ? 'border-red-300 focus:ring-red-200' : 'border-amber-200 focus:ring-amber-200 focus:border-amber-500'}`}
                                    >
                                          <option value="">Select Department</option>
                                          {ADMIN_LOGIN_DEPARTMENTS.map((d) => (
                                                <option key={d.value} value={d.value}>{d.label}</option>
                                          ))}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-amber-600" />
                              </div>
                              {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                        </motion.div>

                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Secret Key <span className="text-red-400">*</span></label>
                              <div className="relative">
                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400 w-[18px] h-[18px]" />
                                    <input
                                          type="password"
                                          value={form.adminSecretKey}
                                          onChange={(e) => set('adminSecretKey', e.target.value)}
                                          placeholder="Enter admin secret key"
                                          className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.adminSecretKey ? 'border-red-300 focus:ring-red-200' : 'border-rose-200 focus:ring-rose-200 focus:border-rose-400'}`}
                                    />
                              </div>
                              {errors.adminSecretKey && <p className="mt-1 text-xs text-red-500">{errors.adminSecretKey}</p>}
                              <p className="mt-1 text-xs text-gray-400">Default dev key: <code className="bg-gray-100 px-1 rounded">ESAMADHAN_ADMIN_2025</code></p>
                        </div>

                        <FormField label="Password" type="password" required error={errors.password}
                              value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 8 characters" />
                        <PasswordStrength password={form.password} />
                        <FormField label="Confirm Password" type="password" required error={errors.confirmPassword}
                              value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Re-enter password" />

                        <OTPSection email={form.email} onVerified={() => setOtpVerified(true)} />
                        {errors.otp && <p className="text-xs text-red-500">{errors.otp}</p>}

                        <button type="submit" disabled={loading}
                              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
                              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Admin...</> : <>Create Admin Account <ArrowRight className="w-4 h-4" /></>}
                        </button>

                        <p className="text-center text-xs text-gray-400">
                              Already registered? <a href="/admin/login" className="text-rose-600 font-semibold">Admin sign in</a>
                        </p>
                  </form>
            </motion.div>
      );
}
