import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Upload, Sparkles, Siren, Loader2, LocateFixed, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { fileComplaint } from '../../api/complaints';
import { analyzeComplaintLocal } from '../../utils/complaintAI';
import { DEPARTMENTS, deptLabel } from '../../utils/complaintConstants';
import LocationMapPicker from '../maps/LocationMapPicker';
import VoiceComplaint from '../VoiceComplaint';

export default function CreateComplaint({ onSuccess, emergency = false }) {
      const { t } = useTranslation();
      const [form, setForm] = useState({
            title: '', description: '', category: '',
            address: '', city: '', state: '', pincode: '', lat: '', lng: '',
      });
      const [isEmergency, setIsEmergency] = useState(emergency);
      const [files, setFiles] = useState([]);
      const [previews, setPreviews] = useState([]);
      const [ai, setAi] = useState(null);
      const [loading, setLoading] = useState(false);
      const [locLoading, setLocLoading] = useState(false);

      const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

      const runAI = useCallback(() => {
            if (!form.title && !form.description) return;
            const result = analyzeComplaintLocal(form.title, form.description);
            setAi(result);
            if (!form.category) set('category', result.suggestedCategory);
      }, [form.title, form.description, form.category]);

      const onMapLocation = useCallback(({ lat, lng, address, city, state, pincode }) => {
            setForm((p) => ({
                  ...p,
                  lat: String(lat),
                  lng: String(lng),
                  address: address || p.address,
                  city: city || p.city,
                  state: state || p.state,
                  pincode: pincode || p.pincode,
            }));
      }, []);

      const fetchLocation = () => {
            if (!navigator.geolocation) return toast.error(t('toast.geolocationNotSupported'));
            setLocLoading(true);
            navigator.geolocation.getCurrentPosition(
                  async ({ coords }) => {
                        onMapLocation({ lat: coords.latitude, lng: coords.longitude });
                        try {
                              const res = await fetch(
                                    `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
                                    { headers: { 'Accept-Language': 'en' } }
                              );
                              const data = await res.json();
                              const a = data.address || {};
                              setForm((p) => ({
                                    ...p,
                                    lat: String(coords.latitude),
                                    lng: String(coords.longitude),
                                    address: data.display_name?.split(',').slice(0, 3).join(', ') || p.address,
                                    city: a.city || a.town || a.village || '',
                                    state: a.state || '',
                                    pincode: a.postcode || '',
                              }));
                              toast.success(t('toast.locationDetected'));
                        } catch {
                              toast.error(t('toast.couldNotResolveAddress'));
                        } finally {
                              setLocLoading(false);
                        }
                  },
                  () => { toast.error(t('toast.locationDenied')); setLocLoading(false); },
                  { enableHighAccuracy: true, timeout: 12000 }
            );
      };

      const onFiles = (e) => {
            const list = Array.from(e.target.files || []).slice(0, 5);
            setFiles(list);
            setPreviews(list.map((f) => URL.createObjectURL(f)));
      };

      const submit = async (e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.description.trim()) {
                  return toast.error(t('complaint.complaintTitle') + ' ' + t('complaint.describeIssue'));
            }
            if (!form.lat || !form.lng) {
                  return toast.error(t('complaint.complaintLocation'));
            }
            setLoading(true);
            try {
                  const fd = new FormData();
                  fd.append('title', form.title.trim());
                  fd.append('description', form.description.trim());
                  fd.append('category', form.category || ai?.suggestedCategory || 'other');

                  const location = {
                        address: form.address,
                        city: form.city,
                        state: form.state,
                        pincode: form.pincode,
                        coordinates: { lat: +form.lat, lng: +form.lng },
                  };
                  fd.append('location', JSON.stringify(location));
                  files.forEach((f) => fd.append('attachments', f));

                  const { data } = await fileComplaint(fd);
                  toast.success(data.message || t('toast.complaintFiled'));
                  onSuccess?.(data.complaint);
            } catch (err) {
                  toast.error(err.response?.data?.message || t('toast.failedToSubmit'));
            } finally {
                  setLoading(false);
            }
      };

      return (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="space-y-6 max-w-3xl">
                  <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                              {emergency && <Siren className="w-6 h-6 text-red-500" />}
                              {emergency ? t('complaint.emergencyComplaint') : t('complaint.createComplaint')}
                        </h1>
                        <p className="text-sm text-slate-500">{t('complaint.aiPriorityNote')}</p>
                  </div>

                  {/* AI Voice Complaint Component */}
                  <VoiceComplaint
                        setTitle={(title) => set('title', title)}
                        setDescription={(desc) => set('description', desc)}
                        setDepartment={(dept) => set('category', dept)}
                        setPriority={() => { }}
                        setCategory={() => { }}
                        setEmergency={setIsEmergency}
                  />

                  <div className="glass rounded-2xl border border-white/60 p-5 space-y-4 shadow-sm">
                        <input
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                              placeholder={t('complaint.complaintTitle')}
                              value={form.title}
                              onChange={(e) => set('title', e.target.value)}
                              onBlur={runAI}
                        />
                        <textarea
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                              placeholder={t('complaint.describeIssue')}
                              value={form.description}
                              onChange={(e) => set('description', e.target.value)}
                              onBlur={runAI}
                        />

                        {ai && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-2 text-xs text-indigo-800">
                                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                                    <div>
                                          <p className="font-bold">{t('complaint.aiAnalysis')}</p>
                                          <p>{t('complaint.department')} {deptLabel(ai.suggestedCategory)} · {t('complaint.priority')} <strong>{ai.suggestedPriority}</strong>{ai.isEmergency ? ' · EMERGENCY' : ''}</p>
                                          <p className="text-indigo-600 mt-1 flex items-center gap-1"><Shield className="w-3 h-3" /> {t('complaint.aiPriorityWarning')}</p>
                                    </div>
                              </motion.div>
                        )}

                        <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm">
                              <option value="">{t('complaint.departmentAiSuggested')}</option>
                              {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.icon} {d.label}</option>)}
                        </select>
                  </div>

                  <div className="glass rounded-2xl border border-white/60 p-5 space-y-4 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4" /> {t('complaint.complaintLocation')}</h3>
                        <button type="button" onClick={fetchLocation} disabled={locLoading}
                              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                              {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                              {t('complaint.useMyLocation')}
                        </button>
                        <LocationMapPicker lat={form.lat} lng={form.lng} onLocationChange={onMapLocation} />
                        <input className="w-full px-4 py-2.5 border rounded-xl text-sm" placeholder={t('complaint.address')} value={form.address} onChange={(e) => set('address', e.target.value)} />
                        <div className="grid grid-cols-2 gap-3">
                              <input className="px-4 py-2.5 border rounded-xl text-sm" placeholder={t('complaint.city')} value={form.city} onChange={(e) => set('city', e.target.value)} />
                              <input className="px-4 py-2.5 border rounded-xl text-sm" placeholder={t('complaint.pin')} value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
                        </div>
                  </div>

                  <div className="glass rounded-2xl border border-white/60 p-5 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Upload className="w-4 h-4" /> {t('complaint.evidence')}</h3>
                        <input type="file" accept="image/*,video/*" multiple onChange={onFiles} className="text-sm" />
                        <div className="flex gap-2 mt-3 flex-wrap">
                              {previews.map((src, i) => (
                                    <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                              ))}
                        </div>
                  </div>

                  <button type="submit" disabled={loading}
                        className={`w-full py-4 font-bold rounded-xl text-white shadow-lg flex items-center justify-center gap-2 ${emergency ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-blue-600 to-violet-600'}`}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {emergency ? t('complaint.submitEmergency') : t('complaint.submitComplaint')}
                  </button>
            </motion.form>
      );
}
