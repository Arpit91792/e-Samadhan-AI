import React from 'react';
import { STATUS_CONFIG } from '../../utils/complaintConstants';

export default function StatusBadge({ status, className = '' }) {
      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
      return (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color} ${className}`}>
                  {cfg.label}
            </span>
      );
}
