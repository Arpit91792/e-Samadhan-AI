import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function ComplaintMapView({ lat, lng, address, height = 'h-48' }) {
      if (!lat || !lng) {
            return (
                  <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl">No map location recorded for this complaint.</p>
            );
      }

      const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      return (
            <div className="space-y-2">
                  {address && <p className="text-xs text-slate-600">{address}</p>}
                  {googleKey ? (
                        <iframe
                              title="Complaint location"
                              className={`w-full ${height} rounded-xl border border-slate-200`}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              src={`https://www.google.com/maps/embed/v1/place?key=${googleKey}&q=${lat},${lng}&zoom=16`}
                        />
                  ) : (
                        <iframe
                              title="Complaint location"
                              className={`w-full ${height} rounded-xl border border-slate-200`}
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
                        />
                  )}
                  <a
                        href={navUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                        <ExternalLink className="w-3.5 h-3.5" /> Open in Google Maps for navigation
                  </a>
            </div>
      );
}
