import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

function loadGoogleMaps(apiKey) {
      if (window.google?.maps) return Promise.resolve();
      return new Promise((resolve, reject) => {
            const id = 'google-maps-script';
            if (document.getElementById(id)) {
                  document.getElementById(id).addEventListener('load', resolve);
                  return;
            }
            const script = document.createElement('script');
            script.id = id;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
      });
}

function loadLeaflet() {
      if (window.L) return Promise.resolve();
      return new Promise((resolve) => {
            if (!document.getElementById('leaflet-css')) {
                  const link = document.createElement('link');
                  link.id = 'leaflet-css';
                  link.rel = 'stylesheet';
                  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                  document.head.appendChild(link);
            }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            document.head.appendChild(script);
      });
}

async function reverseGeocode(lat, lng) {
      const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en-IN,en' } }
      );
      const data = await res.json();
      const a = data.address || {};

      // Build address — covers urban roads and rural villages/hamlets
      const parts = [
            a.house_number,
            a.road || a.pedestrian || a.footway,
            a.neighbourhood || a.suburb,
            a.village || a.hamlet || a.locality,
      ].filter(Boolean);

      return {
            address: parts.length > 0
                  ? parts.join(', ')
                  : (data.display_name?.split(',').slice(0, 4).join(', ') || ''),
            city: a.city || a.town || a.village || a.hamlet || a.county || '',
            state: a.state || '',
            pincode: a.postcode || '',
      };
}

/**
 * Interactive map — Google Maps when VITE_GOOGLE_MAPS_API_KEY is set, else Leaflet/OSM.
 */
export default function LocationMapPicker({ lat, lng, onLocationChange }) {
      const mapDivRef = useRef(null);
      const mapRef = useRef(null);
      const markerRef = useRef(null);
      const [loading, setLoading] = useState(true);
      const [mapMode, setMapMode] = useState('google');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      const applyLocation = useCallback(async (newLat, newLng) => {
            try {
                  const addr = await reverseGeocode(newLat, newLng);
                  onLocationChange?.({
                        lat: newLat,
                        lng: newLng,
                        ...addr,
                  });
            } catch {
                  onLocationChange?.({ lat: newLat, lng: newLng });
            }
      }, [onLocationChange]);

      useEffect(() => {
            let cancelled = false;

            const init = async () => {
                  setLoading(true);
                  const center = lat && lng ? { lat: +lat, lng: +lng } : DEFAULT_CENTER;

                  try {
                        if (apiKey) {
                              await loadGoogleMaps(apiKey);
                              if (cancelled || !mapDivRef.current) return;

                              const map = new window.google.maps.Map(mapDivRef.current, {
                                    center,
                                    zoom: 15,
                                    mapTypeControl: false,
                                    streetViewControl: false,
                              });
                              const marker = new window.google.maps.Marker({
                                    map,
                                    position: center,
                                    draggable: true,
                              });

                              const setPos = async (pos) => {
                                    marker.setPosition(pos);
                                    map.panTo(pos);
                                    await applyLocation(pos.lat(), pos.lng());
                              };

                              marker.addListener('dragend', () => {
                                    const p = marker.getPosition();
                                    setPos(p);
                              });
                              map.addListener('click', (e) => setPos(e.latLng));

                              mapRef.current = map;
                              markerRef.current = marker;
                              setMapMode('google');
                        } else {
                              await loadLeaflet();
                              if (cancelled || !mapDivRef.current) return;

                              const map = window.L.map(mapDivRef.current).setView([center.lat, center.lng], 15);
                              window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                    attribution: '© OpenStreetMap',
                              }).addTo(map);

                              const marker = window.L.marker([center.lat, center.lng], { draggable: true }).addTo(map);
                              const setPos = async (newLat, newLng) => {
                                    marker.setLatLng([newLat, newLng]);
                                    map.setView([newLat, newLng], map.getZoom());
                                    await applyLocation(newLat, newLng);
                              };

                              marker.on('dragend', () => {
                                    const p = marker.getLatLng();
                                    setPos(p.lat, p.lng);
                              });
                              map.on('click', (e) => setPos(e.latlng.lat, e.latlng.lng));

                              mapRef.current = map;
                              markerRef.current = marker;
                              setMapMode('osm');
                        }
                  } catch {
                        setMapMode('error');
                  } finally {
                        if (!cancelled) setLoading(false);
                  }
            };

            init();
            return () => {
                  cancelled = true;
                  if (mapRef.current?.remove) mapRef.current.remove();
                  mapRef.current = null;
            };
      }, [apiKey, applyLocation]);

      useEffect(() => {
            if (!lat || !lng || !markerRef.current) return;
            if (mapMode === 'google' && markerRef.current.setPosition) {
                  markerRef.current.setPosition({ lat: +lat, lng: +lng });
                  mapRef.current?.panTo({ lat: +lat, lng: +lng });
            } else if (mapMode === 'osm' && markerRef.current.setLatLng) {
                  markerRef.current.setLatLng([+lat, +lng]);
                  mapRef.current?.setView([+lat, +lng], mapRef.current.getZoom());
            }
      }, [lat, lng, mapMode]);

      return (
            <div className="space-y-2">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Click the map or drag the pin to set exact complaint location
                        {apiKey ? ' (Google Maps)' : ' (OpenStreetMap — add VITE_GOOGLE_MAPS_API_KEY for Google Maps)'}
                  </p>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 h-56 bg-slate-100">
                        {loading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
                                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                              </div>
                        )}
                        <div ref={mapDivRef} className="w-full h-full" />
                  </div>
            </div>
      );
}
