import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, Building2, CreditCard, Camera, Upload, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { registerOfficer } from '../../../api/officer';
import {
      Field, Input, PasswordInput, PasswordStrength, PasswordMatch,
      Select, SubmitButton, SectionHeader, ErrorAlert, OTPSection
} from './shared';
import useOTP from './useOTP';

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

export default function OfficerSignup() {
      const navigate = useNavigate();
      const { setSession, getDashboardPath } = useAuth();
      const { t } = useTranslation();
      const otpHook = useOTP();

      const [form, setForm] = useState({
            name: '', email: '', phone: '', employeeId: '', department: 'electricity',
            password: '', confirmPassword: '',
      });
      const [errors, setErrors] = useState({});
      const [loading, setLoading] = useState(false);
      const [showPwd, setShowPwd] = useState(false);
      const [showConfirm, setShowConfirm] = useState(false);
      const [govtIdFile, setGovtIdFile] = useState(null);
      const [liveImage, setLiveImage] = useState(null);
      const [showCam, setShowCam] = useState(false);
      const webcamRef = useRef(null);

      const set = (k, v) => {
            setForm(p => ({ ...p, [k]: v }));
            if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
      };

      const capture = useCallback(() => {
            const img = webcamRef.current?.getScreenshot();
            if (img) { setLiveImage(img); setShowCam(false); toast.success(t('toastMessages.selfieCapturing')); }
      }, []);

      const validate = () => {
            const e = {};
            if (!form.name.trim()) e.name = t('validation.fullNameRequired');
            if (!form.email) e.email = 'Official email is required';
            else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
            if (!form.phone) e.phone = 'Mobile number is required';
            else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit number';
            if (!form.employeeId.trim()) e.employeeId = 'Employee ID is required';
            if (!form.department) e.department = 'Department is required';
            if (!form.password) e.password = 'Password is required';
            else if (form.password.length < 8) e.password = 'Min 8 characters';
            else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) e.password = 'Must include uppercase, lowercase & number';
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
            if (!otpHook.otpVerified) e.otp = 'Please verify your email with OTP';
            setErrors(e);
            return Object.keys(e).length === 0;
      };

      const handleSubmit = async (e) => {
            e.preventDefault();
            if (!validate()) { toast.error(t('toastMessages.pleaseFixErrors')); return; }

            setLoading(true);
            try {
                  const fd = new FormData();
                  Object.entries(form).forEach(([k, v]) => fd.append(k, v));
                  fd.append('otpVerified', 'true');
                  if (govtIdFile) fd.append('govtIdImage', govtIdFile);
                  if (liveImage) {
                        const blob = await fetch(liveImage).then(r => r.blob());
                        fd.append('liveImage', blob, 'selfie.jpg');
                  }

                  const { data } = await registerOfficer(fd);
                  setSession(data.token, data.user);
                  toast.success(data.message || 'Officer account created!');
                  navigate(getDashboardPath('officer'), { replace: true });
            } catch (err) {
                  const msg = err.response?.data?.message || 'Registration failed';
                  toast.error(msg);
                  setErrors({ general: msg });
            } finally {
                  setLoading(false);
            }
      };

      return (
            <div className="glass rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
                        <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🏛️</div>
                              <div>
                                    <h2 className="text-xl font-black text-white">{t('officerSignup.title')}</h2>
                                    <p className="text-violet-100 text-xs">Government officer account with department access</p>
                              </div>
                        </div>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <ErrorAlert message={errors.general} />

                        {/* Personal Info */}
                        <SectionHeader icon="👤" title="Officer Details" color="text-violet-700 bg-violet-50" />
                        <div className="grid sm:grid-cols-2 gap-4">
                              <Field label="Full Name" error={errors.name} required>
                                    <Input icon={User} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Officer Name" error={errors.name} />
                              </Field>
                              <Field label="Employee ID" error={errors.employeeId} required>
                                    <Input icon={CreditCard} value={form.employeeId} onChange={e => set('employeeId', e.target.value)} placeholder="EMP-12345" error={errors.employeeId} />
                              </Field>
                        </div>

                        <Field label="Official Government Email" error={errors.email} required>
                              <Input icon={Mail} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="officer@gov.in" error={errors.email} />
                        </Field>

                        <div className="grid sm:grid-cols-2 gap-4">
                              <Field label="Mobile Number" error={errors.phone} required>
                                    <div className="relative">
                                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
                                          <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
                                          <input type="tel" maxLength={10} value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/, ''))}
                                                placeholder="9876543210"
                                                className={`w-full pl-16 pr-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                    </div>
                              </Field>
                              <Field label="Department" error={errors.department} required>
                                    <Select icon={Building2} value={form.department} onChange={e => set('department', e.target.value)} error={errors.department}>
                                          {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    </Select>
                              </Field>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                              <Field label="Password" error={errors.password} required>
                                    <PasswordInput icon={Lock} show={showPwd} onToggle={() => setShowPwd(!showPwd)}
                                          value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" error={errors.password} />
                                    <PasswordStrength password={form.password} />
                              </Field>
                              <Field label="Confirm Password" error={errors.confirmPassword} required>
                                    <PasswordInput icon={Lock} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
                                          value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter password" error={errors.confirmPassword} />
                                    <PasswordMatch password={form.password} confirm={form.confirmPassword} />
                              </Field>
                        </div>

                        {/* Upload Govt ID */}
                        <SectionHeader icon="🪪" title="Government ID Upload" color="text-violet-700 bg-violet-50" />
                        <Field label="Upload Official Government ID">
                              <label className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-all">
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-500">{govtIdFile ? govtIdFile.name : 'Upload ID card / badge (JPG/PNG)'}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={e => setGovtIdFile(e.target.files[0])} />
                              </label>
                        </Field>

                        {/* Live Camera */}
                        <SectionHeader icon="📸" title="Live Face Verification" color="text-amber-700 bg-amber-50" />
                        <div className="space-y-3">
                              {!showCam && !liveImage && (
                                    <button type="button" onClick={() => setShowCam(true)}
                                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 font-semibold text-sm hover:bg-amber-50 transition-all">
                                          <Camera className="w-5 h-5" /> Open Camera & Capture Selfie
                                    </button>
                              )}
                              {showCam && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                                          <div className="rounded-2xl overflow-hidden border-2 border-amber-300 shadow-lg">
                                                <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full" videoConstraints={{ facingMode: 'user' }} />
                                          </div>
                                          <div className="flex gap-2">
                                                <button type="button" onClick={capture}
                                                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-sm">
                                                      📸 Capture
                                                </button>
                                                <button type="button" onClick={() => setShowCam(false)}
                                                      className="px-4 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm">
                                                      Cancel
                                                </button>
                                          </div>
                                    </motion.div>
                              )}
                              {liveImage && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                                          <img src={liveImage} alt="Selfie" className="w-full max-h-48 object-cover rounded-2xl border-2 border-emerald-300 shadow-md" />
                                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Captured
                                          </div>
                                          <button type="button" onClick={() => { setLiveImage(null); setShowCam(true) }}
                                                className="mt-2 w-full py-2 text-xs text-amber-600 font-semibold hover:underline">
                                                Retake
                                          </button>
                                    </motion.div>
                              )}
                        </div>

                        {/* OTP */}
                        <SectionHeader icon="✉️" title="Email OTP Verification" color="text-blue-700 bg-blue-50" />
                        {errors.otp && <p className="text-xs text-red-500">⚠ {errors.otp}</p>}
                        <OTPSection
                              email={form.email} otpSent={otpHook.otpSent} otpVerified={otpHook.otpVerified}
                              otp={otpHook.otp} setOtp={otpHook.setOtp} timer={otpHook.timer}
                              onSend={() => otpHook.sendOTP(form.email)} onVerify={() => otpHook.verifyOTP(form.email)}
                              sending={otpHook.sending} verifying={otpHook.verifying}
                        />

                        <SubmitButton loading={loading} gradient="from-violet-600 to-purple-600">
                              Create Officer Account <ArrowRight className="w-4 h-4" />
                        </SubmitButton>

                        <p className="text-center text-sm text-gray-500">
                              Already have an account?{' '}
                              <a href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</a>
                        </p>
                  </form>
            </div>
      );
}
