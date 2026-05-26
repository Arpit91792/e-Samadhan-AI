import React from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_CONFIG } from '../../utils/complaintConstants';

export default function StatusBadge({ status, className = '' }) {
      const { t } = useTranslation();
      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
      // Use i18n key if available, fall back to the static label
      const label = t(`status.${status}`, { defaultValue: cfg.label });
      return (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color} ${className}`}>
                  {label}
            </span>
      );
}
