import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Building2, Contact, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { persistOfficerSession } from '../../../utils/authStorage';
import { FormField, PasswordStrength, OTPSection } from './FormField';
import WebcamCapture from './WebcamCapture';

const DEPARTMENTS = [
      { value: 'electricity', label: '⚡ Electricity' },
      { value: 'water_supply', label: '💧 Water Supply' },
      { value: 'roads_transport', label: '🚗 Roads & Transport' },
      { value: 'sanitation', label: '🗑️ Sanitation' },
      { value: 'police', label: '🛡️ Police' },
      { value: 'healthcare', label: '❤️ Healthcare' },
      { value: 'municipal', label: '🏛️ Municipal Services' },
      { value: 'education', label: '🎓 Education' },
];

const STEPS = ['Personal Info', 'Department', 'Verification'];

export default function OfficerSignup({ onBack }) {
      const navigate = useNavigate();
      const { getDashboardPath } = useAuth();
      const [step, setStep] = useState(0);
      const [loading, setLoading] = useState(false);
      const [otpVerified, setOtpVerified] = useState(false);
      const [liveImage, setLiveImage] = useState(null);
      const [errors, setErrors] = useState({});

      const [form, setForm] = useState({
            name: '', email: '', phone: '', password: '', confirmPassword: '',
            department: '', employeeId: '', governmentId: '', govtIdImage: null,
      });

      const set = (field, value) => {
            setForm(p => ({ ...p, [field]: value }));
            setErrors(p => ({ ...p, [field]: '' }));
      };

      const validateStep = () => {
            const e = {};
            if (step === 0) {
                  if (!form.name.trim() || form.name.length < 3) e.name = 'Enter full name';
                  if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter valid official email';
                  if (!form.phone || !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit mobile';
                  if (!form.password || form.password.length < 8) e.password = 'Min 8 characters';
                  if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
            }
            if (step === 1) {
                  if (!form.department) e.department = 'Select your department';
                  if (!form.employeeId.trim()) e.employeeId = 'Employee ID is required';
            }
            if (step === 2) {
                  if (!otpVerified) e.otp = 'Please verify your email with OTP';
            }
            setErrors(e);
            return Object.keys(e).length === 0;
      };

      const next = () => { if (validateStep()) setStep(s => s + 1); };
      const prev = () => setStep(s => s - 1);

      const handleSubmit = async (e) => {
            e.preventDefault();
            if (!validateStep()) return;
            setLoading(true);
            try {
                  const fd = new FormData();
                  Object.entries(form).forEach(([k, v]) => { if (v && k !== 'govtIdImage') fd.append(k, v); });
                  fd.append('role', 'officer');
                  fd.append('otpVerified', 'true');
                  if (form.govtIdImage) fd.append('govtIdImage', form.govtIdImage);
                  if (liveImage) {
                        const res = await fetch(liveImage);
                        const blob = await res.blob();
                        fd.append('liveImage', blob, 'selfie.jpg');
                  }

                  const response = await fetch('/api/auth/register', { method: 'POST', body: fd });
                  const data = await response.json();

                  if (data.success) {
                        const saved = persistOfficerSession(data.token, data.officer || data.user, {
                              debug: import.meta.env.DEV,
                        });
                        if (!saved) {
                              throw new Error('Could not persist officer session');
                        }
                        toast.success(data.message);
                        navigate(getDashboardPath('officer'));
                  } else {
                        toast.error(data.message);
                        setErrors({ general: data.message });
                  }
            } catch {
                  toast.error('Registration failed. Please try again.');
            } finally {
                  setLoading(false);
            }
      };

      return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                  <div className="flex items-center gap-3 mb-6">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                              <ArrowLeft className="w-4 h-4 text-gray-500" />
                        </button>
                        <div>
                              <h2 className="text-xl font-black text-gray-900">🏛️ Officer Registration</h2>
                              <p className="text-xs text-gray-500">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
                        </div>
                  </div>

                  <div className="flex gap-1.5 mb-6">
                        {STEPS.map((s, i) => (
                              <div key={s} className="flex-1">
                                    <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-violet-500 to-purple-600' : 'bg-gray-200'}`} />
                                    <p className={`text-[10px] mt-1 font-medium ${i === step ? 'text-violet-600' : 'text-gray-400'}`}>{s}</p>
                              </div>
                        ))}
                  </div>

                  {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{errors.general}</div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                        {step === 0 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <FormField label="Full Name" icon={User} required error={errors.name}
                                          value={form.name} onChange={e => set('name', e.target.value)} placeholder="Officer Full Name" />
                                    <FormField label="Official Government Email" icon={Mail} type="email" required error={errors.email}
                                          value={form.email} onChange={e => set('email', e.target.value)} placeholder="officer@gov.in" />
                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number <span className="text-red-400">*</span></label>
                                          <div className="flex">
                                                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500">+91</span>
                                                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                      placeholder="9876543210" maxLength={10}
                                                      className={`flex-1 px-3 py-3 bg-white border rounded-r-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                          </div>
                                          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                                    </div>
                                    <FormField label="Password" type="password" required error={errors.password}
                                          value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" />
                                    <PasswordStrength password={form.password} />
                                    <FormField label="Confirm Password" type="password" required error={errors.confirmPassword}
                                          value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter password" />
                              </motion.div>
                        )}

                        {step === 1 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department <span className="text-red-400">*</span></label>
                                          <select value={form.department} onChange={e => set('department', e.target.value)}
                                                className={`w-full px-3 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.department ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`}>
                                                <option value="">Select Department</option>
                                                {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                          </select>
                                          {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                                    </div>
                                    <FormField label="Employee ID" icon={Contact} required error={errors.employeeId}
                                          value={form.employeeId} onChange={e => set('employeeId', e.target.value)} placeholder="EMP-2025-XXXXX" />
                                    <FormField label="Government ID Number" icon={Contact} error={errors.governmentId}
                                          value={form.governmentId} onChange={e => set('governmentId', e.target.value)} placeholder="Official ID number" />
                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Government ID <span className="text-gray-400 font-normal">(optional)</span></label>
                                          <input type="file" accept="image/*,.pdf"
                                                onChange={e => set('govtIdImage', e.target.files[0])}
                                                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-600 hover:file:bg-violet-100" />
                                    </div>
                              </motion.div>
                        )}

                        {step === 2 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <WebcamCapture label="Live Face Capture (optional)" onCapture={setLiveImage} />
                                    <OTPSection email={form.email} onVerified={() => setOtpVerified(true)} />
                                    {errors.otp && <p className="text-xs text-red-500">{errors.otp}</p>}
                              </motion.div>
                        )}

                        <div className="flex gap-3 pt-2">
                              {step > 0 && (
                                    <button type="button" onClick={prev}
                                          className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
                                          <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                              )}
                              {step < STEPS.length - 1 ? (
                                    <button type="button" onClick={next}
                                          className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg text-sm flex items-center justify-center gap-2">
                                          Next <ArrowRight className="w-4 h-4" />
                                    </button>
                              ) : (
                                    <button type="submit" disabled={loading}
                                          className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                                          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Register as Officer <ArrowRight className="w-4 h-4" /></>}
                                    </button>
                              )}
                        </div>
                        <p className="text-center text-xs text-gray-400">
                              Already have an account? <a href="/login" className="text-violet-600 font-semibold">Sign in</a>
                        </p>
                  </form>
            </motion.div>
      );
}
