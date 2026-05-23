import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Building2, Contact, ArrowLeft, ArrowRight, Loader2, Camera, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { persistAuthSession } from '../../../utils/authStorage';
import { FormField, PasswordStrength, OTPSection } from './FormField';
import LiveFaceCapture from './LiveFaceCapture';

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'];
const GOVT_IDS = [
      { value: 'aadhaar', label: 'Aadhaar Card' },
      { value: 'pan', label: 'PAN Card' },
      { value: 'voter_id', label: 'Voter ID' },
      { value: 'driving_license', label: 'Driving License' },
      { value: 'passport', label: 'Passport' },
];

const STEPS = ['Personal Info', 'Address & ID', 'Face Verification', 'Email Verification'];

export default function CitizenSignup({ onBack }) {
      const navigate = useNavigate();
      const { getDashboardPath } = useAuth();
      const [step, setStep] = useState(0);
      const [loading, setLoading] = useState(false);
      const [otpVerified, setOtpVerified] = useState(false);
      const [liveImage, setLiveImage] = useState(null);
      const [liveImageConfirmed, setLiveImageConfirmed] = useState(false);
      const [errors, setErrors] = useState({});

      const [form, setForm] = useState({
            name: '', email: '', phone: '', password: '', confirmPassword: '',
            address: '', city: '', state: '', govtIdType: 'aadhaar', govtIdNumber: '',
            govtIdImage: null,
      });

      const set = (field, value) => {
            setForm(p => ({ ...p, [field]: value }));
            setErrors(p => ({ ...p, [field]: '' }));
      };

      const validateStep = () => {
            const e = {};
            if (step === 0) {
                  if (!form.name.trim() || form.name.length < 3) e.name = 'Enter full name (min 3 chars)';
                  if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
                  if (!form.phone || !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit mobile';
                  if (!form.password || form.password.length < 8) e.password = 'Min 8 characters';
                  if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
            }
            if (step === 1) {
                  if (!form.address.trim()) e.address = 'Address is required';
                  if (!form.city.trim()) e.city = 'City is required';
                  if (!form.state) e.state = 'Select your state';
                  if (!form.govtIdNumber.trim()) e.govtIdNumber = 'Government ID number is required';
            }
            // ✅ MANDATORY: Face capture required
            if (step === 2) {
                  if (!liveImage || !liveImageConfirmed) {
                        e.face = 'Live face verification is mandatory. Please capture your selfie.';
                  }
            }
            if (step === 3) {
                  if (!otpVerified) e.otp = 'Please verify your email with OTP';
            }
            setErrors(e);
            return Object.keys(e).length === 0;
      };

      const next = () => {
            if (validateStep()) {
                  setStep(s => s + 1);
                  setErrors({});
            } else {
                  if (step === 2 && (!liveImage || !liveImageConfirmed)) {
                        toast.error('⚠️ Live face verification is mandatory. Please capture your selfie.');
                  } else {
                        toast.error('Please complete all required fields');
                  }
            }
      };
      const prev = () => setStep(s => s - 1);

      const handleSubmit = async (e) => {
            e.preventDefault();
            if (!validateStep()) return;

            // ✅ Double-check mandatory face verification
            if (!liveImage || !liveImageConfirmed) {
                  toast.error('⚠️ Live face verification is mandatory to complete registration.');
                  setStep(2);
                  return;
            }

            setLoading(true);
            try {
                  const fd = new FormData();
                  Object.entries(form).forEach(([k, v]) => { if (v && k !== 'govtIdImage') fd.append(k, v); });
                  fd.append('role', 'citizen');
                  fd.append('otpVerified', 'true');
                  if (form.govtIdImage) fd.append('govtIdImage', form.govtIdImage);
                  if (liveImage) {
                        // Convert base64 to blob
                        const res = await fetch(liveImage);
                        const blob = await res.blob();
                        fd.append('liveImage', blob, 'selfie.jpg');
                  }

                  const response = await fetch('/api/auth/register', { method: 'POST', body: fd });
                  const data = await response.json();

                  if (data.success) {
                        const saved = persistAuthSession(data.token, data.user, {
                              debug: import.meta.env.DEV,
                        });
                        if (!saved) {
                              throw new Error('Could not persist citizen session');
                        }
                        toast.success(data.message);
                        navigate(getDashboardPath('citizen'));
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
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                              <ArrowLeft className="w-4 h-4 text-gray-500" />
                        </button>
                        <div>
                              <h2 className="text-xl font-black text-gray-900">👤 Citizen Registration</h2>
                              <p className="text-xs text-gray-500">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
                        </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex gap-1.5 mb-6">
                        {STEPS.map((s, i) => (
                              <div key={s} className="flex-1">
                                    <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-blue-500 to-violet-500' : 'bg-gray-200'}`} />
                                    <p className={`text-[10px] mt-1 font-medium ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>{s}</p>
                              </div>
                        ))}
                  </div>

                  {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{errors.general}</div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                        {/* ── Step 0: Personal Info ── */}
                        {step === 0 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <FormField label="Full Name" icon={User} required error={errors.name}
                                          value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rajesh Kumar" />
                                    <FormField label="Email Address" icon={Mail} type="email" required error={errors.email}
                                          value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number <span className="text-red-400">*</span></label>
                                          <div className="relative flex">
                                                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-medium">+91</span>
                                                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                      placeholder="9876543210" maxLength={10}
                                                      className={`flex-1 px-3 py-3 bg-white border rounded-r-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                          </div>
                                          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                                    </div>
                                    <FormField label="Password" type="password" required error={errors.password}
                                          value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters">
                                          <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                                                placeholder="Min. 8 characters"
                                                className={`w-full pl-4 pr-11 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                    </FormField>
                                    <PasswordStrength password={form.password} />
                                    <FormField label="Confirm Password" type="password" required error={errors.confirmPassword}
                                          value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter password" />
                              </motion.div>
                        )}

                        {/* ── Step 1: Address & ID ── */}
                        {step === 1 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address <span className="text-red-400">*</span></label>
                                          <div className="relative">
                                                <MapPin className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                                                <textarea value={form.address} onChange={e => set('address', e.target.value)}
                                                      placeholder="House No., Street, Area" rows={2}
                                                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition-all ${errors.address ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                          </div>
                                          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                          <FormField label="City" icon={Building2} required error={errors.city}
                                                value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
                                          <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">State <span className="text-red-400">*</span></label>
                                                <select value={form.state} onChange={e => set('state', e.target.value)}
                                                      className={`w-full px-3 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.state ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`}>
                                                      <option value="">Select State</option>
                                                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                                          </div>
                                    </div>
                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Government ID Type <span className="text-red-400">*</span></label>
                                          <select value={form.govtIdType} onChange={e => set('govtIdType', e.target.value)}
                                                className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all">
                                                {GOVT_IDS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                          </select>
                                    </div>
                                    <FormField label="Government ID Number" icon={Contact} required error={errors.govtIdNumber}
                                          value={form.govtIdNumber} onChange={e => set('govtIdNumber', e.target.value)}
                                          placeholder={form.govtIdType === 'aadhaar' ? '12-digit Aadhaar' : 'Enter ID number'} />
                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Government ID <span className="text-gray-400 font-normal">(optional)</span></label>
                                          <input type="file" accept="image/*,.pdf"
                                                onChange={e => set('govtIdImage', e.target.files[0])}
                                                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all" />
                                    </div>
                              </motion.div>
                        )}

                        {/* ── Step 2: Face Verification ── */}
                        {step === 2 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    {/* Mandatory Warning */}
                                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg flex gap-3">
                                          <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                          <div>
                                                <p className="font-semibold text-blue-900 text-sm">Face Verification Required</p>
                                                <p className="text-xs text-blue-700 mt-1">You must capture a live selfie to complete your registration. This is a mandatory security requirement for government identity verification.</p>
                                          </div>
                                    </div>

                                    {/* Live Face Capture Component */}
                                    <LiveFaceCapture
                                          onCapture={setLiveImage}
                                          onConfirm={() => setLiveImageConfirmed(true)}
                                          label="📸 Live Face Verification"
                                          required={true}
                                          showIsMandatory={true}
                                    />

                                    {/* Error message if not captured */}
                                    {errors.face && (
                                          <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start"
                                          >
                                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-red-700 font-medium">{errors.face}</p>
                                          </motion.div>
                                    )}

                                    {/* Status Indicator */}
                                    {liveImageConfirmed && (
                                          <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-2 items-start"
                                          >
                                                <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                                                <p className="text-xs text-emerald-700 font-medium">✅ Face verification complete. You can proceed to email verification.</p>
                                          </motion.div>
                                    )}
                              </motion.div>
                        )}

                        {/* ── Step 3: Email Verification ── */}
                        {step === 3 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <OTPSection email={form.email} onVerified={() => setOtpVerified(true)} />
                                    {errors.otp && <p className="text-xs text-red-500">{errors.otp}</p>}
                              </motion.div>
                        )}

                        {/* Navigation */}
                        <div className="flex gap-3 pt-2">
                              {step > 0 && (
                                    <button type="button" onClick={prev}
                                          className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
                                          <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                              )}
                              {step < STEPS.length - 1 ? (
                                    <button type="button" onClick={next}
                                          disabled={step === 2 && (!liveImage || !liveImageConfirmed)}
                                          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                          Next <ArrowRight className="w-4 h-4" />
                                    </button>
                              ) : (
                                    <button type="submit" disabled={loading || !liveImage || !liveImageConfirmed}
                                          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                                    </button>
                              )}
                        </div>

                        <p className="text-center text-xs text-gray-400">
                              Already have an account? <a href="/login" className="text-blue-600 font-semibold">Sign in</a>
                        </p>
                  </form>
            </motion.div>
      );
}
