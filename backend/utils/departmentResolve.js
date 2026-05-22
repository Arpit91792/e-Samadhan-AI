import { DEPT_SLUGS } from './adminScope.js';

const LABEL_TO_SLUG = {
      police: 'police',
      electricity: 'electricity',
      'water supply': 'water_supply',
      healthcare: 'healthcare',
      'roads & transport': 'roads_transport',
      'roads and transport': 'roads_transport',
      'municipal services': 'municipal',
      sanitation: 'sanitation',
      education: 'education',
};

/**
 * Accepts slug (police), label (Police), or API-style (Water Supply).
 * Returns canonical slug or null.
 */
export function resolveDepartmentSlug(input) {
      if (input == null || String(input).trim() === '') return null;

      const raw = String(input).trim();
      const lower = raw.toLowerCase();

      if (DEPT_SLUGS.includes(lower)) return lower;

      if (LABEL_TO_SLUG[lower]) return LABEL_TO_SLUG[lower];

      const slugified = lower.replace(/\s+/g, '_').replace(/&/g, 'and');
      if (DEPT_SLUGS.includes(slugified)) return slugified;

      const partial = DEPT_SLUGS.find((s) => lower.includes(s.replace(/_/g, ' ')) || s === slugified);
      if (partial) return partial;

      return null;
}

export function getDepartmentLabel(slug) {
      const labels = {
            police: 'Police',
            electricity: 'Electricity',
            water_supply: 'Water Supply',
            roads_transport: 'Roads & Transport',
            healthcare: 'Healthcare',
            municipal: 'Municipal Services',
            sanitation: 'Sanitation',
            education: 'Education',
      };
      return labels[slug] || slug;
}
