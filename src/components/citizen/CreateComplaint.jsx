import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Upload, Sparkles, Siren, Loader2, LocateFixed, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { fileComplaint } from '../../api/complaints';
import { analyzeComplaintLocal } from '../../utils/complaintAI';
import { DEPARTMENTS, deptLabel } from '../../utils/complaintConstants';
import LocationMapPicker from '../maps/LocationMapPicker';

export default function CreateComplaint({ onSuccess, emergency = false }) {
      const [form, setForm] = useState({
            title: '', description: '', category: '',
            address: '', city: '', state: '', pincode: '', lat: '', lng: '',
      });
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
            if (!navigator.geolocation) return toast.error('Geolocation not supported');
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
                              toast.success('Location detected');
                        } catch {
                              toast.error('Could not resolve address');
                        } finally {
                              setLocLoading(false);
                        }
                  },
                  () => { toast.error('Location permission denied'); setLocLoading(false); },
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
                  return toast.error('Title and description are required');
            }
            if (!form.lat || !form.lng) {
                  return toast.error('Please pin your complaint location on the map');
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
                  toast.success(data.message || 'Complaint filed!');
                  onSuccess?.(data.complaint);
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to submit complaint');
            } finally {
                  setLoading(false);
            }
      };

      return (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="space-y-6 max-w-3xl">
                  <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                              {emergency && <Siren className="w-6 h-6 text-red-500" />}
                              {emergency ? 'Emergency Complaint' : 'Create Complaint'}
                        </h1>
                        <p className="text-sm text-slate-500">AI sets priority automatically — you do not choose priority</p>
                  </div>

                  <div className="glass rounded-2xl border border-white/60 p-5 space-y-4 shadow-sm">
                        <input
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                              placeholder="Complaint title *"
                              value={form.title}
                              onChange={(e) => set('title', e.target.value)}
                              onBlur={runAI}
                        />
                        <textarea
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                              placeholder="Describe the issue in detail *"
                              value={form.description}
                              onChange={(e) => set('description', e.target.value)}
                              onBlur={runAI}
                        />

                        {ai && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-2 text-xs text-indigo-800">
                                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                                    <div>
                                          <p className="font-bold">AI Analysis</p>
                                          <p>Department: {deptLabel(ai.suggestedCategory)} · Priority: <strong>{ai.suggestedPriority}</strong>{ai.isEmergency ? ' · EMERGENCY' : ''}</p>
                                          <p className="text-indigo-600 mt-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Priority is assigned by AI and cannot be changed manually</p>
                                    </div>
                              </motion.div>
                        )}

                        <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm">
                              <option value="">Department (AI suggested if blank)</option>
                              {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.icon} {d.label}</option>)}
                        </select>
                  </div>

                  <div className="glass rounded-2xl border border-white/60 p-5 space-y-4 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4" /> Complaint Location *</h3>
                        <button type="button" onClick={fetchLocation} disabled={locLoading}
                              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                              {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                              Use My Current Location
                        </button>
                        <LocationMapPicker lat={form.lat} lng={form.lng} onLocationChange={onMapLocation} />
                        <input className="w-full px-4 py-2.5 border rounded-xl text-sm" placeholder="Address" value={form.address} onChange={(e) => set('address', e.target.value)} />
                        <div className="grid grid-cols-2 gap-3">
                              <input className="px-4 py-2.5 border rounded-xl text-sm" placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
                              <input className="px-4 py-2.5 border rounded-xl text-sm" placeholder="PIN" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
                        </div>
                  </div>

                  <div className="glass rounded-2xl border border-white/60 p-5 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Upload className="w-4 h-4" /> Evidence (images/videos)</h3>
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
                        {emergency ? 'Submit Emergency Complaint' : 'Submit Complaint'}
                  </button>
            </motion.form>
      );
}
