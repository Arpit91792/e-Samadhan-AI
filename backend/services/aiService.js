// ── AI Service — Smart complaint routing & priority detection ─────────────────
// Keyword-based AI routing (no external API needed — works offline)

const CATEGORY_KEYWORDS = {
      electricity: ['electricity', 'power', 'light', 'bulb', 'transformer', 'voltage', 'outage', 'blackout', 'electric', 'wiring', 'meter', 'bill', 'shock'],
      water_supply: ['water', 'pipe', 'leak', 'supply', 'drainage', 'sewage', 'flood', 'tap', 'bore', 'well', 'contamination', 'dirty water'],
      roads_transport: ['road', 'pothole', 'traffic', 'signal', 'bridge', 'footpath', 'divider', 'accident', 'speed', 'parking', 'bus', 'auto'],
      sanitation: ['garbage', 'waste', 'trash', 'dustbin', 'drain', 'smell', 'mosquito', 'rat', 'clean', 'sweeping', 'toilet', 'open defecation'],
      police: ['police', 'crime', 'theft', 'robbery', 'harassment', 'noise', 'fight', 'illegal', 'drug', 'violence', 'safety', 'security'],
      healthcare: ['hospital', 'doctor', 'medicine', 'ambulance', 'health', 'clinic', 'nurse', 'treatment', 'emergency', 'blood', 'vaccine'],
      municipal: ['tax', 'property', 'building', 'permit', 'certificate', 'license', 'birth', 'death', 'marriage', 'municipal', 'ward'],
      education: ['school', 'teacher', 'student', 'education', 'college', 'scholarship', 'midday meal', 'uniform', 'book', 'exam'],
};

const EMERGENCY_KEYWORDS = [
      'fire', 'accident', 'death', 'dying', 'urgent', 'emergency', 'critical', 'danger',
      'flood', 'collapse', 'explosion', 'gas leak', 'electrocution', 'drowning', 'attack',
];

const PRIORITY_KEYWORDS = {
      emergency: ['fire', 'accident', 'death', 'dying', 'urgent', 'emergency', 'critical', 'danger', 'flood', 'collapse', 'explosion'],
      high: ['broken', 'damaged', 'not working', 'failure', 'severe', 'major', 'serious', 'immediate'],
      medium: ['issue', 'problem', 'complaint', 'concern', 'request', 'need'],
      low: ['suggestion', 'minor', 'small', 'request', 'feedback'],
};

// ── Detect category from text ─────────────────────────────────────────────────
export const detectCategory = (text) => {
      if (!text) return 'other';
      const lower = text.toLowerCase();
      let bestMatch = 'other';
      let bestScore = 0;

      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            const score = keywords.filter(kw => lower.includes(kw)).length;
            if (score > bestScore) {
                  bestScore = score;
                  bestMatch = category;
            }
      }
      return bestMatch;
};

// ── Detect priority from text ─────────────────────────────────────────────────
export const detectPriority = (text) => {
      if (!text) return 'medium';
      const lower = text.toLowerCase();

      for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
            if (keywords.some(kw => lower.includes(kw))) return priority;
      }
      return 'medium';
};

// ── Detect if complaint is emergency ─────────────────────────────────────────
export const isEmergency = (text) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
};

// ── Full AI analysis of a complaint ──────────────────────────────────────────
export const analyzeComplaint = (title, description) => {
      const fullText = `${title} ${description}`;
      const suggestedPriority = detectPriority(fullText);
      const emergency = isEmergency(fullText);
      const reasons = [];
      if (emergency) reasons.push('Emergency keywords detected in description');
      else if (suggestedPriority === 'high') reasons.push('High-severity keywords detected');
      else if (suggestedPriority === 'medium') reasons.push('Standard grievance — medium priority');
      else reasons.push('Low-priority / suggestion-type complaint');

      return {
            suggestedCategory: detectCategory(fullText),
            suggestedPriority: emergency ? 'emergency' : suggestedPriority,
            isEmergency: emergency,
            aiPriorityReason: reasons.join('. '),
            confidence: 'rule-based',
            analyzedAt: new Date().toISOString(),
      };
};

export const buildAiPriorityReason = (ai, duplicateResult) => {
      const parts = [ai.aiPriorityReason];
      if (duplicateResult?.reason) parts.push(duplicateResult.reason);
      return parts.filter(Boolean).join(' · ');
};

// ── Generate complaint ID ─────────────────────────────────────────────────────
export const generateComplaintId = async (ComplaintModel) => {
      const count = await ComplaintModel.countDocuments();
      return `C-${String(count + 1).padStart(6, '0')}`;
};
