/** Client-side AI routing preview (mirrors backend aiService) */
const CATEGORY_KEYWORDS = {
      electricity: ['electricity', 'power', 'light', 'outage', 'transformer', 'wiring'],
      water_supply: ['water', 'pipe', 'leak', 'supply', 'drainage', 'tap'],
      roads_transport: ['road', 'pothole', 'traffic', 'bridge', 'accident'],
      sanitation: ['garbage', 'waste', 'trash', 'drain', 'clean'],
      police: ['police', 'crime', 'theft', 'harassment', 'safety'],
      healthcare: ['hospital', 'doctor', 'ambulance', 'health', 'medical'],
      municipal: ['tax', 'property', 'permit', 'municipal', 'certificate'],
      education: ['school', 'teacher', 'student', 'education', 'college'],
};

const EMERGENCY_KW = ['fire', 'accident', 'death', 'urgent', 'emergency', 'critical', 'flood', 'collapse'];

export function analyzeComplaintLocal(title = '', description = '') {
      const text = `${title} ${description}`.toLowerCase();
      let category = 'other';
      let best = 0;
      for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
            const score = words.filter((w) => text.includes(w)).length;
            if (score > best) { best = score; category = cat; }
      }
      const isEmergency = EMERGENCY_KW.some((w) => text.includes(w));
      const priority = isEmergency ? 'emergency' : best > 0 ? 'high' : 'medium';
      return { suggestedCategory: category, suggestedPriority: priority, isEmergency };
}
