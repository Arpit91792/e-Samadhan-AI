// ── Server-side document validation (keyword + regex based) ──────────────────
// Tesseract OCR runs on the frontend; backend does secondary validation
// on the extracted text sent from the client.

export const DOC_RULES = {
      aadhaar: {
            label: 'Aadhaar Card',
            keywords: ['aadhaar', 'uidai', 'unique identification', 'government of india', 'आधार'],
            regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/,
            hint: 'Must contain a 12-digit Aadhaar number',
      },
      pan: {
            label: 'PAN Card',
            keywords: ['permanent account number', 'income tax', 'pan', 'govt. of india'],
            regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,
            hint: 'Must contain PAN format: ABCDE1234F',
      },
      voter_id: {
            label: 'Voter ID',
            keywords: ['election commission', 'voter', 'electors photo', 'epic'],
            regex: /\b[A-Z]{3}[0-9]{7}\b/,
            hint: 'Must contain Voter ID format: ABC1234567',
      },
      driving_license: {
            label: 'Driving License',
            keywords: ['driving licence', 'motor vehicles', 'transport', 'dl no'],
            regex: /\b[A-Z]{2}[0-9]{2}[0-9]{11}\b|\b[A-Z]{2}-\d{2}-\d{4}-\d{7}\b/,
            hint: 'Must contain a valid DL number',
      },
      passport: {
            label: 'Passport',
            keywords: ['republic of india', 'passport', 'ministry of external affairs', 'nationality'],
            regex: /\b[A-Z][0-9]{7}\b/,
            hint: 'Must contain Passport format: A1234567',
      },
};

/**
 * Validate extracted OCR text against selected document type
 * @param {string} text - OCR extracted text
 * @param {string} selectedType - e.g. 'aadhaar'
 * @returns {{ valid: boolean, detectedType: string|null, extractedNumber: string|null, message: string }}
 */
export const validateDocumentText = (text, selectedType) => {
      if (!text || !selectedType) {
            return { valid: false, detectedType: null, extractedNumber: null, message: 'No text extracted from document' };
      }

      const lower = text.toLowerCase();
      const rules = DOC_RULES[selectedType];

      if (!rules) {
            return { valid: false, detectedType: null, extractedNumber: null, message: 'Unknown document type' };
      }

      // 1. Detect what type the document actually IS
      let detectedType = null;
      let detectedScore = 0;

      for (const [type, rule] of Object.entries(DOC_RULES)) {
            const score = rule.keywords.filter(kw => lower.includes(kw)).length;
            if (score > detectedScore) {
                  detectedScore = score;
                  detectedType = type;
            }
      }

      // 2. Check if selected type matches detected type
      if (detectedType && detectedType !== selectedType && detectedScore >= 1) {
            return {
                  valid: false,
                  detectedType,
                  extractedNumber: null,
                  message: `This is not the selected document. You selected "${rules.label}" but uploaded a "${DOC_RULES[detectedType]?.label || detectedType}".`,
            };
      }

      // 3. Check keywords for selected type
      const keywordMatch = rules.keywords.some(kw => lower.includes(kw));

      // 4. Extract document number via regex
      const match = text.match(rules.regex);
      const extractedNumber = match ? match[0].replace(/\s/g, '') : null;

      if (!keywordMatch && !extractedNumber) {
            return {
                  valid: false,
                  detectedType: null,
                  extractedNumber: null,
                  message: `Could not verify this as a "${rules.label}". Please upload a clear image of the correct document.`,
            };
      }

      return {
            valid: true,
            detectedType: selectedType,
            extractedNumber: extractedNumber || 'Detected',
            message: `${rules.label} verified successfully!`,
      };
};
