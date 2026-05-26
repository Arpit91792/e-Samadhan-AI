import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
      Eye, EyeOff, Lock, ArrowRight, Loader2, BadgeCheck,
      ShieldAlert, CheckCircle2, Search, Mail, Building2, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/auth/AuthLayout';
import { checkEmployeeId, registerOfficer } from '../../api/officer';
import { persistOfficerSession } from '../../utils/authStorage';
import api from '../../api/axios';

export default function OfficerRegisterPage() {
      const navigate = useNavigate();
      const { t } = useTranslation();

      const DEPARTMENTS = [
            { value: 'police', label: t('departments.police') },
            { value: 'electricity', label: t('departments.electricity') },
            { value: 'water_supply', label: t('departments.water_supply') },
            { value: 'roads_transport', label: t('departments.roads_transport') },
            { value: 'healthcare', label: t('departments.healthcare') },
            { value: 'municipal', label: t('departments.municipal') },
            { value: 'sanitation', label: t('departments.sanitation') },
            { value: 'education', label: t('departments.education') },
      ];

      const STEP_LABELS = [
            t('officerRegister.stepLabels.verifyIdentity'),
            t('officerRegister.stepLabels.verifyEmail'),
            t('officerRegister.stepLabels.setPassword'),
      ];

      const [step, setStep] = useState(1);
      const [empId, setEmpId] = useState('');
      const [email, setEmail] = useState('');
      const [department, setDept] = useState('');
      const [verifying, setVerifying] = useState(false);
      const [officerInfo, setOfficerInfo] = useState(null);

      const [otp, setOtp] = useState(['', '', '', '', '', '']);
      const [sendingOtp, setSendingOtp] = useState(false);
      const [verifyingOtp, setVerifyingOtp] = useState(false);
      const otpRefs = useRef([]);

      const [password, setPassword] = useState('');
      const [confirm, setConfirm] = useState('');
      const [showPw, setShowPw] = useState(false);
      const [showCf, setShowCf] = useState(false);
      const [registering, setRegistering] = useState(false);
      const [errors, setErrors] = useState({});

      // ── Step 1 ────────────────────────────────────────────────────────────────
      const handleVerifyIdentity = async (e) => {
            e.preventDefault();
            const errs = {};
            if (!empId.trim()) errs.empId = t('validation.employeeIdRequired');
            if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) errs.email = t('validation.enterValidEmail');
            if (!department) errs.department = t('validation.departmentRequired');
            setErrors(errs);
            if (Object.keys(errs).length) return;

            setVerifying(true);
            try {
                  const res = await checkEmployeeId(empId.trim().toUpperCase(), email.trim().toLowerCase(), department);
                  setOfficerInfo(res.data.data);
                  toast.success(`Identity verified! Welcome, ${res.data.data.name}`);
                  setStep(2);
                  await handleSendOtp(email.trim().toLowerCase());
            } catch (err) {
                  const code = err.response?.data?.code;
                  const msg = err.response?.data?.message || 'Verification failed';
                  if (code === 'NOT_FOUND') setErrors({ empId: 'Employee ID not found. Contact your admin.' });
                  else if (code === 'EMAIL_MISMATCH') setErrors({ email: 'Email does not match this Employee ID.' });
                  else if (code === 'DEPARTMENT_MISMATCH') setErrors({ department: 'This Employee ID belongs to a different department.' });
                  else if (code === 'ALREADY_REGISTERED') { toast.error('Already registered. Please login.'); navigate('/login'); }
                  else if (code === 'ACCOUNT_BLOCKED') toast.error('Your account has been blocked by the department admin.');
                  else toast.error(msg);
            } finally {
                  setVerifying(false);
            }
      };

      // ── Step 2 OTP ────────────────────────────────────────────────────────────
      const handleSendOtp = async (targetEmail) => {
            setSendingOtp(true);
            try {
                  await api.post('/auth/send-otp', { email: targetEmail || email.trim().toLowerCase(), purpose: 'register' });
                  toast.success(t('verification.otpSent'));
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to send OTP');
            } finally {
                  setSendingOtp(false);
            }
      };

      const handleOtpChange = (index, value) => {
            if (!/^\d?$/.test(value)) return;
            const next = [...otp];
            next[index] = value;
            setOtp(next);
            if (value && index < 5) otpRefs.current[index + 1]?.focus();
      };

      const handleOtpKeyDown = (index, e) => {
            if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
      };

      const handleOtpPaste = (e) => {
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); }
      };

      const handleVerifyOtp = async (e) => {
            e.preventDefault();
            const code = otp.join('');
            if (code.length !== 6) { setErrors({ otp: 'Enter all 6 digits' }); return; }
            setVerifyingOtp(true);
            try {
                  await api.post('/auth/verify-otp', { email: email.trim().toLowerCase(), otp: code, purpose: 'register' });
                  toast.success(t('verification.verified'));
                  setStep(3);
            } catch (err) {
                  setErrors({ otp: err.response?.data?.message || t('verification.otpInvalid') });
            } finally {
                  setVerifyingOtp(false);
            }
      };

      // ── Step 3 Password ───────────────────────────────────────────────────────
      const handleRegister = async (e) => {
            e.preventDefault();
            const errs = {};
            if (!password || password.length < 8) errs.password = t('validation.passwordMinLength');
            if (!/[A-Z]/.test(password)) errs.password = 'Must contain at least one uppercase letter';
            if (!/\d/.test(password)) errs.password = 'Must contain at least one number';
            if (password !== confirm) errs.confirm = t('validation.passwordMismatch');
            setErrors(errs);
            if (Object.keys(errs).length) return;

            setRegistering(true);
            try {
                  const res = await registerOfficer({
                        employeeId: empId.trim().toUpperCase(),
                        email: email.trim().toLowerCase(),
                        department,
                        password,
                        confirmPassword: confirm,
                  });
                  const officerData = res.data.officer || res.data.user;
                  persistOfficerSession(res.data.token, officerData, { debug: import.meta.env.DEV });
                  toast.success(res.data.message || 'Registration complete!');
                  navigate('/officer/dashboard', { replace: true });
            } catch (err) {
                  const code = err.response?.data?.code;
                  const msg = err.response?.data?.message || 'Registration failed';
                  if (code === 'OTP_NOT_VERIFIED') {
                        toast.error('OTP verification expired. Please restart.');
                        setStep(2);
                        setOtp(['', '', '', '', '', '']);
                  } else if (code === 'ALREADY_REGISTERED') {
                        toast.error('Already registered. Please login.');
                        navigate('/login');
                  } else {
                        toast.error(msg);
                  }
            } finally {
                  setRegistering(false);
            }
      };

      const pwStrength = (() => {
            let score = 0;
            if (password.length >= 8) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/\d/.test(password)) score++;
            if (/[^A-Za-z0-9]/.test(password)) score++;
            return score;
      })();

      const pwStrengthLabels = ['', t('officerRegister.strength.weak'), t('officerRegister.strength.fair'), t('officerRegister.strength.good'), t('officerRegister.strength.strong')];
      const pwStrengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

      return (
            <AuthLayout title={t('officerRegister.title')} subtitle={t('officerRegister.subtitle')}>
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-8">
                        {STEP_LABELS.map((label, i) => {
                              const n = i + 1;
                              const done = step > n;
                              const active = step === n;
                              return (
                                    <React.Fragment key={label}>
                                          <div className="flex items-center gap-1.5">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                                      ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                      {done ? <CheckCircle2 className="w-4 h-4" /> : n}
                                                </div>
                                                <span className={`text-xs font-semibold hidden sm:block ${active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                      {label}
                                                </span>
                                          </div>
                                          {i < 2 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                                    </React.Fragment>
                              );
                        })}
                  </div>

                  <AnimatePresence mode="wait">
                        {/* ── STEP 1 ── */}
                        {step === 1 && (
                              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyIdentity} className="space-y-5" noValidate>

                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                                          <p className="font-semibold mb-1">{t('officerRegister.howToRegister')}</p>
                                          <p className="text-xs text-blue-600 leading-relaxed">{t('officerRegister.howToRegisterDesc')}</p>
                                    </div>

                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('officerRegister.employeeId')}</label>
                                          <div className="relative">
                                                <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                                                <input type="text" value={empId}
                                                      onChange={(e) => { setEmpId(e.target.value.toUpperCase()); setErrors((p) => ({ ...p, empId: '' })); }}
                                                      placeholder="POL-2026-001"
                                                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 transition-all
                                                            ${errors.empId ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                          </div>
                                          {errors.empId && <p className="mt-1 text-xs text-red-500">{errors.empId}</p>}
                                    </div>

                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('officerRegister.officialEmail')}</label>
                                          <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                                                <input type="email" value={email}
                                                      onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                                                      placeholder={t('form.placeholders.officerEmail')}
                                                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
                                                            ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                          </div>
                                          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                    </div>

                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('officerRegister.department')}</label>
                                          <div className="relative">
                                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
                                                <select value={department}
                                                      onChange={(e) => { setDept(e.target.value); setErrors((p) => ({ ...p, department: '' })); }}
                                                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all appearance-none
                                                            ${errors.department ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`}>
                                                      <option value="">{t('officerRegister.selectDepartment')}</option>
                                                      {DEPARTMENTS.map((d) => (
                                                            <option key={d.value} value={d.value}>{d.label}</option>
                                                      ))}
                                                </select>
                                          </div>
                                          {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                                    </div>

                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                          <p className="text-xs text-amber-700">{t('officerRegister.securityNote')}</p>
                                    </div>

                                    <motion.button type="submit" disabled={verifying}
                                          whileHover={!verifying ? { scale: 1.02 } : {}} whileTap={!verifying ? { scale: 0.98 } : {}}
                                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                                          {verifying
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('officerRegister.verifying')}</>
                                                : <><Search className="w-4 h-4" /> {t('officerRegister.verifyIdentity')}</>}
                                    </motion.button>

                                    <p className="text-center text-sm text-gray-500">
                                          {t('officerRegister.alreadyRegistered')}{' '}
                                          <Link to="/login" className="text-blue-600 font-semibold hover:underline">{t('officerRegister.signIn')}</Link>
                                    </p>
                              </motion.form>
                        )}

                        {/* ── STEP 2 ── */}
                        {step === 2 && (
                              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOtp} className="space-y-6" noValidate>

                                    {officerInfo && (
                                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg">
                                                            {officerInfo.name.charAt(0)}
                                                      </div>
                                                      <div>
                                                            <p className="font-bold text-emerald-800">{officerInfo.name}</p>
                                                            <p className="text-xs text-emerald-600">{officerInfo.employeeId}</p>
                                                      </div>
                                                      <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                                                </div>
                                          </div>
                                    )}

                                    <div className="text-center">
                                          <p className="text-sm text-gray-600">
                                                {t('officerRegister.otpSentTo')} <strong>{email.replace(/(.{2}).+(@.+)/, '$1***$2')}</strong>
                                          </p>
                                          <p className="text-xs text-gray-400 mt-1">{t('officerRegister.checkSpam')}</p>
                                    </div>

                                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                          {otp.map((digit, i) => (
                                                <input key={i} ref={(el) => (otpRefs.current[i] = el)}
                                                      type="text" inputMode="numeric" maxLength={1} value={digit}
                                                      onChange={(e) => handleOtpChange(i, e.target.value)}
                                                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                      className={`w-12 h-14 text-center text-xl font-black border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all
                                                            ${digit ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                                                            ${errors.otp ? 'border-red-400' : ''}`} />
                                          ))}
                                    </div>
                                    {errors.otp && <p className="text-center text-xs text-red-500">{errors.otp}</p>}

                                    <motion.button type="submit" disabled={verifyingOtp || otp.join('').length !== 6}
                                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                                          {verifyingOtp
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('officerRegister.verifyingOtp')}</>
                                                : <><CheckCircle2 className="w-4 h-4" /> {t('officerRegister.verifyOtp')}</>}
                                    </motion.button>

                                    <div className="flex items-center justify-between text-sm">
                                          <button type="button" onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 font-medium">
                                                {t('officerRegister.back')}
                                          </button>
                                          <button type="button" disabled={sendingOtp} onClick={() => handleSendOtp(email.trim().toLowerCase())}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
                                                {sendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                {t('officerRegister.resendOtp')}
                                          </button>
                                    </div>
                              </motion.form>
                        )}

                        {/* ── STEP 3 ── */}
                        {step === 3 && (
                              <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }} onSubmit={handleRegister} className="space-y-5" noValidate>

                                    {officerInfo && (
                                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                                <div className="text-sm">
                                                      <span className="font-bold text-slate-800">{officerInfo.name}</span>
                                                      <span className="text-slate-500 ml-2">{officerInfo.employeeId}</span>
                                                </div>
                                          </div>
                                    )}

                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                                          {t('officerRegister.emailVerified')}
                                    </div>

                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('officerRegister.password')}</label>
                                          <div className="relative">
                                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                                                <input type={showPw ? 'text' : 'password'} value={password}
                                                      onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                                                      placeholder={t('officerRegister.minChars')}
                                                      className={`w-full pl-10 pr-11 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
                                                            ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                                <button type="button" onClick={() => setShowPw(!showPw)}
                                                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                          </div>
                                          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}

                                          {password && (
                                                <div className="mt-2">
                                                      <div className="flex gap-1 mb-1">
                                                            {[1, 2, 3, 4].map((n) => (
                                                                  <div key={n} className={`flex-1 h-1.5 rounded-full transition-colors ${n <= pwStrength ? pwStrengthColors[pwStrength] : 'bg-gray-200'}`} />
                                                            ))}
                                                      </div>
                                                      {pwStrength > 0 && (
                                                            <p className="text-xs text-gray-500">{pwStrengthLabels[pwStrength]}</p>
                                                      )}
                                                </div>
                                          )}
                                    </div>

                                    <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('officerRegister.confirmPassword')}</label>
                                          <div className="relative">
                                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                                                <input type={showCf ? 'text' : 'password'} value={confirm}
                                                      onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: '' })); }}
                                                      placeholder={t('officerRegister.reEnterPassword')}
                                                      className={`w-full pl-10 pr-11 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
                                                            ${errors.confirm ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                                <button type="button" onClick={() => setShowCf(!showCf)}
                                                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                      {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                          </div>
                                          {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
                                    </div>

                                    <motion.button type="submit" disabled={registering}
                                          whileHover={!registering ? { scale: 1.02 } : {}} whileTap={!registering ? { scale: 0.98 } : {}}
                                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                                          {registering
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('officerRegister.registering')}</>
                                                : <><ArrowRight className="w-4 h-4" /> {t('officerRegister.completeRegistration')}</>}
                                    </motion.button>
                              </motion.form>
                        )}
                  </AnimatePresence>
            </AuthLayout>
      );
}
