
import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
      User, Mail, Phone, Lock, MapPin, Building2, CreditCard,
      ArrowRight, ArrowLeft, CheckCircle2, LocateFixed,
      Satellite, AlertTriangle, Wifi, WifiOff, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
      Field, Input, PasswordInput, PasswordStrength, PasswordMatch,
      Select, SubmitButton, SectionHeader, ErrorAlert, OTPSection, StepProgress
} from './shared';
import useOTP from './useOTP';
import DocumentVerifier from './DocumentVerifier';
import LivenessVerifier from '../../../components/auth/signup/LivenessVerifier';

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = ['Personal', 'Location', 'Govt ID', 'Liveness', 'Verify'];

const STATES = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
      'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
      'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
      'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

const GOVT_IDS = [
      { value: 'aadhaar', label: '🪪 Aadhaar Card' },
      { value: 'pan', label: '💳 PAN Card' },
      { value: 'voter_id', label: '🗳️ Voter ID' },
      { value: 'driving_license', label: '🚗 Driving License' },
      { value: 'passport', label: '📘 Passport' },
];

const LOC = { IDLE: 'idle', REQUESTING: 'requesting', FETCHING: 'fetching', SUCCESS: 'success', DENIED: 'denied', ERROR: 'error' };

// ─── Component ────────────────────────────────────────────────────────────────
export default function CitizenSignup() {
      const navigate = useNavigate();
      const { register, getDashboardPath } = useAuth();
      const { t } = useTranslation();
      const otpHook = useOTP();

      // ── State ──────────────────────────────────────────────────────────────────
      const [step, setStep] = useState(0);
      const [loading, setLoading] = useState(false);
      const [showPwd, setShowPwd] = useState(false);
      const [showConfirm, setShowConfirm] = useState(false);
      const [errors, setErrors] = useState({});

      // Document
      const [govtIdFile, setGovtIdFile] = useState(null);
      const [docVerified, setDocVerified] = useState(false);

      // AI Liveness
      const [livenessVerified, setLivenessVerified] = useState(false);
      const [livenessScore, setLivenessScore] = useState(0);
      const [livenessSessionId, setLivenessSessionId] = useState(null);
      const [liveImage, setLiveImage] = useState(null);

      // Location
      const [locStatus, setLocStatus] = useState(LOC.IDLE);
      const [accuracy, setAccuracy] = useState(null);

      // Form
      const [form, setForm] = useState({
            name: '', email: '', phone: '', password: '', confirmPassword: '',
            nearbyLocation: '', completeAddress: '', city: '', state: '', pincode: '', latitude: '', longitude: '',
            govtIdType: 'aadhaar', govtIdNumber: '', dob: '', gender: '',
      });

      // ── Helpers ────────────────────────────────────────────────────────────────
      const set = (k, v) => {
            setForm(p => ({ ...p, [k]: v }));
            if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
      };

      // ── Location ───────────────────────────────────────────────────────────────
      const fetchLocation = useCallback(() => {
            if (!navigator.geolocation) { toast.error(t('toastMessages.geolocationNotSupported')); return; }
            setLocStatus(LOC.REQUESTING);
            navigator.geolocation.getCurrentPosition(
                  async ({ coords: { latitude, longitude, accuracy: acc } }) => {
                        setLocStatus(LOC.FETCHING);
                        setAccuracy(Math.round(acc));
                        try {
                              const res = await fetch(
                                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
                                    { headers: { 'Accept-Language': 'en-IN,en' } }
                              );
                              const data = await res.json();
                              const a = data.address || {};

                              // Build address — works for both urban and rural areas
                              const addressParts = [
                                    a.house_number,
                                    a.road || a.pedestrian || a.footway,
                                    a.neighbourhood || a.suburb,
                                    a.village || a.hamlet || a.locality,
                              ].filter(Boolean);
                              const address = addressParts.length > 0
                                    ? addressParts.join(', ')
                                    : (data.display_name?.split(',').slice(0, 4).join(', ') || '');

                              // City — rural areas use village/town/hamlet
                              const city = a.city || a.town || a.village || a.hamlet || a.county || '';

                              // State — normalize to match STATES array exactly
                              const rawState = a.state || '';
                              const matchedState = STATES.find(
                                    s => s.toLowerCase() === rawState.toLowerCase()
                              ) || STATES.find(
                                    s => rawState.toLowerCase().includes(s.toLowerCase())
                              ) || rawState;

                              const pincode = a.postcode || '';

                              setForm(p => ({
                                    ...p,
                                    nearbyLocation: address,
                                    city,
                                    state: matchedState,
                                    pincode,
                                    latitude: String(latitude),
                                    longitude: String(longitude),
                              }));
                              setErrors(p => ({ ...p, nearbyLocation: '', city: '', state: '' }));
                              setLocStatus(LOC.SUCCESS);
                              toast.success(t('toastMessages.locationDetected'));
                        } catch {
                              setLocStatus(LOC.ERROR);
                              toast.error(t('toastMessages.couldNotFetchAddress'));
                        }
                  },
                  (err) => {
                        setLocStatus(err.code === 1 ? LOC.DENIED : LOC.ERROR);
                        toast.error(err.code === 1 ? t('location.denied') : t('location.locationFailed'));
                  },
                  { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
      }, []);

      // ── Validation ─────────────────────────────────────────────────────────────
      const validateStep = (s) => {
            const e = {};
            if (s === 0) {
                  if (!form.name.trim()) e.name = 'Full name is required';
                  if (!form.email) e.email = 'Email is required';
                  else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
                  if (!form.phone) e.phone = 'Mobile number is required';
                  else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit number';
                  if (!form.password) e.password = 'Password is required';
                  else if (form.password.length < 8) e.password = 'Minimum 8 characters';
                  else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password))
                        e.password = 'Must include uppercase, lowercase & number';
                  if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
            }
            if (s === 1) {
                  if (!form.completeAddress.trim()) e.completeAddress = 'Complete address is required';
                  if (!form.city.trim()) e.city = 'City / Town is required';
                  if (!form.state) e.state = 'State is required';
            }
            if (s === 2) {
                  if (!docVerified) e.docVerified = 'Document verification is required. Upload and verify your government ID.';
            }
            if (s === 3) {
                  if (!livenessVerified) e.liveness = 'AI liveness verification is mandatory. Complete all live facial actions.';
            }
            if (s === 4) {
                  if (!otpHook.otpVerified) e.otp = 'Please verify your email with OTP first';
            }
            setErrors(e);
            return Object.keys(e).length === 0;
      };

      const nextStep = () => {
            if (validateStep(step)) {
                  setStep(s => Math.min(s + 1, STEPS.length - 1));
            } else {
                  if (step === 2 && !docVerified) toast.error(t('verification.documentRequired'));
                  else if (step === 3 && !livenessVerified) toast.error(t('verification.livenessRequired'));
                  else toast.error(t('validation.fillAllFields'));
            }
      };
      const prevStep = () => { setStep(s => Math.max(s - 1, 0)); setErrors({}); };

      // ── Submit ─────────────────────────────────────────────────────────────────
      const handleSubmit = async (e) => {
            e.preventDefault();
            if (!validateStep(4)) return;
            if (!livenessVerified) { toast.error(t('verification.livenessRequired')); setStep(3); return; }

            setLoading(true);
            try {
                  const fd = new FormData();
                  Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
                  fd.append('role', 'citizen');
                  fd.append('otpVerified', 'true');
                  fd.append('livenessVerified', 'true');
                  fd.append('livenessSessionId', livenessSessionId || '');
                  fd.append('livenessScore', String(livenessScore));
                  if (govtIdFile) fd.append('govtIdImage', govtIdFile);
                  if (liveImage) {
                        const blob = await fetch(liveImage).then(r => r.blob());
                        fd.append('liveImage', blob, 'liveness.jpg');
                  }
                  const data = await register(fd);
                  toast.success(data.message || t('toast.success'));
                  navigate(getDashboardPath('citizen'), { replace: true });
            } catch (err) {
                  const msg = err.response?.data?.message || t('signupValidationMessages.fieldRequired');
                  toast.error(msg);
                  setErrors({ general: msg });
            } finally {
                  setLoading(false);
            }
      };

      // ── Render ─────────────────────────────────────────────────────────────────
      const renderStep = () => (
            <AnimatePresence mode="wait">
                  <motion.div key={step}
                        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.3 }} className="space-y-5">

                        {/* ── STEP 0: Personal Info ── */}
                        {step === 0 && <>
                              <SectionHeader icon="👤" title="Personal Information" color="text-blue-700 bg-blue-50 border-blue-100" />
                              <div className="grid sm:grid-cols-2 gap-4">
                                    <Field label="Full Name" error={errors.name} required>
                                          <Input icon={User} value={form.name} onChange={e => set('name', e.target.value)}
                                                placeholder="Rajesh Kumar" error={errors.name} autoComplete="name" />
                                    </Field>
                                    <Field label="Mobile Number" error={errors.phone} required>
                                          <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-semibold">+91</span>
                                                <input type="tel" maxLength={10} value={form.phone}
                                                      onChange={e => set('phone', e.target.value.replace(/\D/, ''))}
                                                      placeholder="9876543210" autoComplete="tel"
                                                      className={`w-full pl-16 pr-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                          </div>
                                          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                    </Field>
                              </div>
                              <Field label="Email Address" error={errors.email} required>
                                    <Input icon={Mail} type="email" value={form.email} onChange={e => set('email', e.target.value)}
                                          placeholder="you@example.com" error={errors.email} autoComplete="email" />
                              </Field>
                              <div className="grid sm:grid-cols-2 gap-4">
                                    <Field label="Password" error={errors.password} required>
                                          <PasswordInput icon={Lock} show={showPwd} onToggle={() => setShowPwd(!showPwd)}
                                                value={form.password} onChange={e => set('password', e.target.value)}
                                                placeholder="Min 8 characters" error={errors.password} autoComplete="new-password" />
                                          <PasswordStrength password={form.password} />
                                    </Field>
                                    <Field label="Confirm Password" error={errors.confirmPassword} required>
                                          <PasswordInput icon={Lock} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
                                                value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                                                placeholder="Re-enter password" error={errors.confirmPassword} autoComplete="new-password" />
                                          <PasswordMatch password={form.password} confirm={form.confirmPassword} />
                                    </Field>
                              </div>
                        </>}

                        {/* ── STEP 1: Location ── */}
                        {step === 1 && <>
                              <SectionHeader icon="📍" title="Location Information" color="text-emerald-700 bg-emerald-50 border-emerald-100" />

                              {/* Location button */}
                              <motion.button type="button" onClick={fetchLocation}
                                    disabled={locStatus === LOC.REQUESTING || locStatus === LOC.FETCHING}
                                    whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all ${locStatus === LOC.SUCCESS
                                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200'
                                          : locStatus === LOC.REQUESTING || locStatus === LOC.FETCHING
                                                ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white cursor-not-allowed'
                                                : locStatus === LOC.DENIED || locStatus === LOC.ERROR
                                                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                                      : 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-200'
                                          }`}>
                                    {locStatus === LOC.REQUESTING || locStatus === LOC.FETCHING ? (
                                          <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                                <Satellite className="w-5 h-5" /></motion.div>
                                                <span>{locStatus === LOC.REQUESTING ? 'Requesting Permission...' : 'Fetching Address...'}</span></>
                                    ) : locStatus === LOC.SUCCESS ? (
                                          <><CheckCircle2 className="w-5 h-5" /><span>Location Detected — Click to Refresh</span></>
                                    ) : locStatus === LOC.DENIED ? (
                                          <><WifiOff className="w-5 h-5" /><span>Permission Denied — Click to Retry</span></>
                                    ) : (
                                          <><LocateFixed className="w-5 h-5" /><span>📍 Use Current Location</span></>
                                    )}
                              </motion.button>

                              {locStatus === LOC.SUCCESS && accuracy && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                                          <Wifi className="w-3.5 h-3.5" /><span>GPS accuracy: ±{accuracy}m — Fields auto-filled. You can edit them.</span>
                                    </div>
                              )}
                              {locStatus === LOC.DENIED && (
                                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700">
                                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                          <span>Allow location: click 🔒 in browser address bar → Allow Location → retry.</span>
                                    </div>
                              )}

                              <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-xs text-gray-400 px-2">or enter manually</span>
                                    <div className="flex-1 h-px bg-gray-200" />
                              </div>

                              <Field label="Nearby Location" hint="Auto-filled from GPS — shows your approximate area">
                                    <div className="relative">
                                          <MapPin className="absolute left-3.5 top-3.5 text-emerald-500 w-4 h-4" />
                                          <textarea value={form.nearbyLocation} readOnly rows={2}
                                                placeholder="Click 'Use Current Location' above to auto-detect"
                                                className="w-full pl-10 pr-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm resize-none text-emerald-800 cursor-default focus:outline-none" />
                                    </div>
                                    {form.nearbyLocation && (
                                          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Auto-detected from GPS
                                          </p>
                                    )}
                              </Field>

                              <Field label="Complete Address" error={errors.completeAddress} required hint="House No., Street, Village, Landmark, etc.">
                                    <div className="relative">
                                          <MapPin className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                                          <textarea value={form.completeAddress} onChange={e => set('completeAddress', e.target.value)} rows={3}
                                                placeholder="e.g. House No. 24, Near Water Tank, Minal Gate 2, Bhopal"
                                                className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition-all ${errors.completeAddress ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`} />
                                    </div>
                                    {errors.completeAddress && <p className="text-xs text-red-500 mt-1">{errors.completeAddress}</p>}
                              </Field>
                              <div className="grid sm:grid-cols-2 gap-4">
                                    <Field label="City / Town" error={errors.city} required>
                                          <Input icon={Building2} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" error={errors.city} />
                                    </Field>
                                    <Field label="State" error={errors.state} required>
                                          <Select icon={MapPin} value={form.state} onChange={e => set('state', e.target.value)} error={errors.state}>
                                                <option value="">Select State</option>
                                                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                          </Select>
                                    </Field>
                              </div>
                              <Field label="PIN Code">
                                    <Input icon={MapPin} value={form.pincode}
                                          onChange={e => set('pincode', e.target.value.replace(/\D/, '').slice(0, 6))}
                                          placeholder="400001" maxLength={6} />
                              </Field>
                        </>}

                        {/* ── STEP 2: Govt ID with OCR ── */}
                        {step === 2 && <>
                              <div className="flex items-center justify-between">
                                    <SectionHeader icon="🪪" title="Government ID Verification" color="text-violet-700 bg-violet-50 border-violet-100" />
                                    <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${docVerified ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200 animate-pulse'}`}>
                                          {docVerified ? '✓ VERIFIED' : 'REQUIRED'}
                                    </span>
                              </div>

                              {/* Auto-fill success banner */}
                              {docVerified && form.govtIdType === 'aadhaar' && (form.dob || form.gender) && (
                                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                          className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                          <p className="text-xs text-blue-700 font-medium">
                                                ✅ Aadhaar details auto-filled in your registration form
                                                {form.name ? ` — Name: ${form.name}` : ''}
                                          </p>
                                    </motion.div>
                              )}

                              {!docVerified && (
                                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                          <div>
                                                <p className="text-sm font-bold text-amber-800">Document Verification Required</p>
                                                <p className="text-xs text-amber-600 mt-0.5">Upload your government ID. AI will scan and verify it automatically.</p>
                                          </div>
                                    </div>
                              )}

                              {errors.docVerified && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{errors.docVerified}
                                    </motion.div>
                              )}

                              <Field label="Select Document Type" required>
                                    <Select icon={CreditCard} value={form.govtIdType}
                                          onChange={e => { set('govtIdType', e.target.value); setDocVerified(false); setGovtIdFile(null); }}>
                                          {GOVT_IDS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                    </Select>
                              </Field>

                              <DocumentVerifier
                                    selectedType={form.govtIdType}
                                    onVerified={(data) => {
                                          setDocVerified(true);
                                          setGovtIdFile(data.file);
                                          if (data.extractedNumber) set('govtIdNumber', data.extractedNumber);

                                          // Auto-fill form from Aadhaar OCR
                                          if (data.selectedType === 'aadhaar' && data.aadhaarDetails) {
                                                const { name, dob, gender } = data.aadhaarDetails;
                                                if (name && !form.name.trim()) set('name', name);
                                                if (dob) set('dob', dob);
                                                if (gender) set('gender', gender);
                                          }

                                          setErrors(p => ({ ...p, docVerified: '' }));
                                    }}
                                    onReset={() => { setDocVerified(false); setGovtIdFile(null); }}
                              />
                        </>}

                        {/* ── STEP 3: AI Face Verification ── */}
                        {step === 3 && <>
                              <div className="flex items-center justify-between">
                                    <SectionHeader icon="🛡️" title="AI Liveness Detection" color="text-indigo-700 bg-indigo-50 border-indigo-100" />
                                    <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${livenessVerified ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200 animate-pulse'}`}>
                                          {livenessVerified ? `✓ ${livenessScore}% LIVE` : 'REQUIRED'}
                                    </span>
                              </div>

                              {errors.liveness && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                          className="flex items-center gap-2.5 p-3.5 bg-red-50 border-2 border-red-300 rounded-xl">
                                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                          <div>
                                                <p className="text-sm font-bold text-red-700">Liveness Verification Required</p>
                                                <p className="text-xs text-red-600">{errors.liveness}</p>
                                          </div>
                                    </motion.div>
                              )}

                              {!govtIdFile && (
                                    <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                          <p className="text-xs text-amber-700 font-medium">
                                                Complete document verification in the previous step first to enable liveness check.
                                          </p>
                                    </div>
                              )}

                              <LivenessVerifier
                                    email={form.email}
                                    govtIdType={form.govtIdType}
                                    docVerified={docVerified}
                                    onVerified={({ sessionId, selfie, score }) => {
                                          setLivenessVerified(true);
                                          setLivenessScore(score);
                                          setLivenessSessionId(sessionId);
                                          setLiveImage(selfie);
                                          setErrors(p => ({ ...p, liveness: '' }));
                                    }}
                                    onReset={() => {
                                          setLivenessVerified(false);
                                          setLivenessScore(0);
                                          setLivenessSessionId(null);
                                          setLiveImage(null);
                                    }}
                              />

                              {livenessVerified && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                          className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                          <div>
                                                <p className="text-sm font-bold text-emerald-800">Live Presence Verified ✓</p>
                                                <p className="text-xs text-emerald-600">Liveness score: {livenessScore}% — Proceed to OTP verification.</p>
                                          </div>
                                    </motion.div>
                              )}
                        </>}

                        {/* ── STEP 4: OTP Verify ── */}
                        {step === 4 && <>
                              <SectionHeader icon="✉️" title="Email OTP Verification" color="text-blue-700 bg-blue-50 border-blue-100" />

                              {/* Verification badges */}
                              <div className="flex flex-wrap gap-2">
                                    {docVerified && (
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Document Verified
                                          </div>
                                    )}
                                    {livenessVerified && (
                                          <motion.div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Liveness Verified ({livenessScore}%)
                                          </motion.div>
                                    )}
                              </div>

                              <div className="p-4 bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">📧</div>
                                          <div>
                                                <p className="text-sm font-bold text-blue-900">Verify your email address</p>
                                                <p className="text-xs text-blue-600">OTP will be sent to <strong>{form.email}</strong></p>
                                          </div>
                                    </div>
                                    {errors.otp && (
                                          <p className="text-xs text-red-500 flex items-center gap-1 mb-2">
                                                <AlertTriangle className="w-3 h-3" />{errors.otp}
                                          </p>
                                    )}
                                    <OTPSection
                                          email={form.email}
                                          otpSent={otpHook.otpSent} otpVerified={otpHook.otpVerified}
                                          otp={otpHook.otp} setOtp={otpHook.setOtp} timer={otpHook.timer}
                                          onSend={() => otpHook.sendOTP(form.email, 'register')}
                                          onVerify={() => otpHook.verifyOTP(form.email, 'register')}
                                          sending={otpHook.sending} verifying={otpHook.verifying}
                                    />
                              </div>

                              {/* Summary */}
                              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registration Summary</p>
                                    {[
                                          { label: 'Name', value: form.name },
                                          { label: 'Email', value: form.email },
                                          { label: 'Mobile', value: form.phone ? `+91 ${form.phone}` : '' },
                                          { label: 'City', value: form.city },
                                          { label: 'State', value: form.state },
                                          { label: 'ID Type', value: GOVT_IDS.find(g => g.value === form.govtIdType)?.label },
                                          { label: 'Doc Verified', value: docVerified ? '✅ Verified' : '❌ Not verified' },
                                          { label: 'Liveness', value: livenessVerified ? `✅ ${livenessScore}% live` : '❌ Not verified' },
                                    ].filter(i => i.value).map(item => (
                                          <div key={item.label} className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500 font-medium">{item.label}</span>
                                                <span className="text-gray-800 font-semibold truncate max-w-[60%] text-right">{item.value}</span>
                                          </div>
                                    ))}
                              </div>

                              <ErrorAlert message={errors.general} />

                              <SubmitButton loading={loading} gradient="from-blue-600 to-violet-600" disabled={!otpHook.otpVerified}>
                                    🚀 Create Citizen Account <ArrowRight className="w-4 h-4" />
                              </SubmitButton>
                        </>}

                  </motion.div>
            </AnimatePresence>
      );

      return (
            <div className="glass rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-violet-600 px-6 py-5">
                        <div className="flex items-center gap-3 mb-4">
                              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-2xl border border-white/30">👤</div>
                              <div>
                                    <h2 className="text-xl font-black text-white">{t('citizenSignup.title')}</h2>
                                    <p className="text-blue-100 text-xs">AI-powered identity verification & signup</p>
                              </div>
                        </div>
                        <StepProgress steps={STEPS} current={step} />
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6">
                        {renderStep()}

                        {/* Navigation */}
                        <div className={`flex gap-3 mt-6 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
                              {step > 0 && (
                                    <motion.button type="button" onClick={prevStep}
                                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                          className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-all">
                                          <ArrowLeft className="w-4 h-4" /> Back
                                    </motion.button>
                              )}
                              {step < STEPS.length - 1 && (
                                    <motion.button type="button" onClick={nextStep}
                                          whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(37,99,235,0.3)' }} whileTap={{ scale: 0.98 }}
                                          disabled={(step === 2 && !docVerified) || (step === 3 && !livenessVerified)}
                                          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-sm shadow-lg transition-all ${(step === 2 && !docVerified) || (step === 3 && !livenessVerified)
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                                                }`}>
                                          {step === 2 && !docVerified ? '⚠️ Verify Document First'
                                                : step === 3 && !livenessVerified ? '⚠️ Complete Liveness First'
                                                      : 'Continue'}
                                          {!((step === 2 && !docVerified) || (step === 3 && !livenessVerified)) && <ArrowRight className="w-4 h-4" />}
                                    </motion.button>
                              )}
                        </div>

                        <p className="text-center text-sm text-gray-500 mt-4">
                              Already have an account?{' '}
                              <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
                        </p>
                  </form>
            </div>
      );
}
