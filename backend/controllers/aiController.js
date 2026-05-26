import model from "../services/geminiService.js";
import asyncHandler from "../middleware/asyncHandler.js";

const DEPARTMENTS = [
      "Police",
      "Electricity",
      "Water",
      "Road",
      "Sanitation",
      "Agriculture",
      "Health",
      "Panchayat",
      "Education"
];

const PRIORITY_LEVELS = ["Low", "Medium", "High", "Emergency"];

const EMERGENCY_KEYWORDS = [
      "fire",
      "violence",
      "electric",
      "shock",
      "accident",
      "death",
      "rape",
      "murder",
      "stealing",
      "robbery",
      "gas leak",
      "collapse",
      "injury"
];

// Analyze voice complaint using Gemini AI
export const analyzeVoiceComplaint = asyncHandler(async (req, res) => {
      const { complaintText } = req.body;

      if (!complaintText || complaintText.trim().length === 0) {
            return res.status(400).json({
                  success: false,
                  message: "Complaint text is required"
            });
      }

      const prompt = `You are an AI complaint analyzer for an Indian rural government grievance platform called e-Samadhan AI.

Analyze the citizen complaint below and extract ONLY valid JSON response. Do NOT use markdown code blocks.

Complaint Text:
"${complaintText}"

IMPORTANT INSTRUCTIONS:
1. Detect the complaint language (en, hi, mr, bn, ta, te, gu, pa)
2. If not English, translate to English
3. Generate a SHORT complaint title (max 10 words)
4. Generate detailed complaint description (max 100 words)
5. Select MOST suitable government department
6. Determine complaint priority based on urgency
7. Detect if this is an emergency (life-threatening, immediate danger)
8. Identify complaint category (Infrastructure, Safety, Utility, Services, etc.)

Available Departments:
- Police, Electricity, Water, Road, Sanitation, Agriculture, Health, Panchayat, Education

Priority Levels:
- Low (minor issue, not urgent)
- Medium (affects multiple people, needs attention)
- High (significant impact, urgent)
- Emergency (life-threatening, needs immediate action)

RETURN ONLY THIS JSON (no markdown, no code blocks, no explanation):
{
  "title": "short title here",
  "description": "detailed description here",
  "category": "category type",
  "department": "selected department",
  "priority": "Low/Medium/High/Emergency",
  "emergency": true/false,
  "confidence": 85
}

Do not add any text before or after this JSON.`;

      try {
            console.log("🤖 [analyzeVoiceComplaint] Received complaint text:", complaintText.substring(0, 100) + "...");
            console.log("🤖 [analyzeVoiceComplaint] Sending to Gemini API...");

            if (!model) {
                  throw new Error("Gemini model not initialized - check GEMINI_API_KEY in .env");
            }

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            console.log("🤖 [analyzeVoiceComplaint] Raw Gemini response:", text.substring(0, 200) + "...");

            // Clean JSON response - remove markdown code blocks
            const cleaned = text
                  .replace(/```json\n?/g, "")
                  .replace(/```\n?/g, "")
                  .replace(/^[\s\n]*/, "")
                  .replace(/[\s\n]*$/, "")
                  .trim();

            console.log("🤖 [analyzeVoiceComplaint] Cleaned response:", cleaned.substring(0, 200) + "...");

            let aiData;
            try {
                  aiData = JSON.parse(cleaned);
                  console.log("✅ [analyzeVoiceComplaint] JSON parsed successfully");
            } catch (parseError) {
                  console.error("❌ [analyzeVoiceComplaint] JSON Parse Error:", parseError.message);
                  console.error("❌ [analyzeVoiceComplaint] Failed text:", cleaned);
                  return res.status(500).json({
                        success: false,
                        message: "Failed to parse AI response",
                        error: `JSON parsing failed: ${parseError.message}`,
                        receivedData: cleaned.substring(0, 200)
                  });
            }

            // Validate and normalize response
            if (!aiData.title) aiData.title = "Complaint";
            if (!aiData.description) aiData.description = complaintText;
            if (!aiData.category) aiData.category = "General";

            // Normalize department
            if (!DEPARTMENTS.includes(aiData.department)) {
                  console.warn("⚠️ [analyzeVoiceComplaint] Invalid department, defaulting to Panchayat:", aiData.department);
                  aiData.department = "Panchayat";
            }

            // Normalize priority
            if (!PRIORITY_LEVELS.includes(aiData.priority)) {
                  console.warn("⚠️ [analyzeVoiceComplaint] Invalid priority, defaulting to Medium:", aiData.priority);
                  aiData.priority = "Medium";
            }

            aiData = {
                  originalText: complaintText,
                  translatedText: aiData.translatedText || complaintText,
                  language: aiData.language || "en",
                  title: aiData.title,
                  description: aiData.description,
                  department: aiData.department,
                  category: aiData.category,
                  priority: aiData.priority,
                  emergency: aiData.emergency === true,
                  isDuplicate: false,
                  isFake: false,
                  confidence: aiData.confidence || 75,
                  keywords: [],
                  timestamp: new Date()
            };

            console.log("✅ [analyzeVoiceComplaint] Analysis complete:", {
                  title: aiData.title,
                  department: aiData.department,
                  priority: aiData.priority,
                  emergency: aiData.emergency
            });

            res.json({
                  success: true,
                  data: aiData
            });
      } catch (error) {
            console.error("❌ [analyzeVoiceComplaint] Gemini API Error:", {
                  message: error.message,
                  status: error.status,
                  errorCode: error.code
            });

            let errorMessage = "AI complaint analysis failed";

            if (error.message.includes("API_KEY")) {
                  errorMessage = "Gemini API key not configured";
            } else if (error.message.includes("timeout")) {
                  errorMessage = "AI analysis timed out";
            } else if (error.status === 429) {
                  errorMessage = "Too many requests to AI service";
            } else if (error.status === 401) {
                  errorMessage = "AI service authentication failed";
            } else if (error.status === 400) {
                  errorMessage = "Invalid request to AI service";
            }

            res.status(500).json({
                  success: false,
                  message: errorMessage,
                  error: error.message,
                  debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
      }
});

// Detect emergency keywords in complaint
export const detectEmergency = asyncHandler(async (req, res) => {
      const { complaintText } = req.body;

      const lowerText = complaintText.toLowerCase();
      const detectedEmergencies = EMERGENCY_KEYWORDS.filter(keyword =>
            lowerText.includes(keyword)
      );

      res.json({
            success: true,
            isEmergency: detectedEmergencies.length > 0,
            emergencyKeywords: detectedEmergencies
      });
});

// Detect language of complaint
export const detectLanguage = asyncHandler(async (req, res) => {
      const { complaintText } = req.body;

      if (!complaintText || complaintText.trim().length === 0) {
            return res.status(400).json({
                  success: false,
                  message: "Complaint text is required"
            });
      }

      const prompt = `Detect the language of this text and return ONLY the language code.
Text: "${complaintText}"

Return only one of these codes:
- en (English)
- hi (Hindi)
- mr (Marathi)
- bn (Bengali)
- ta (Tamil)
- te (Telugu)
- gu (Gujarati)
- pa (Punjabi)

Return only the language code, nothing else.`;

      try {
            console.log("🌐 [detectLanguage] Detecting language...");
            const result = await model.generateContent(prompt);
            const response = result.response;
            const languageCode = response.text().trim().toLowerCase();

            const validLanguages = ["en", "hi", "mr", "bn", "ta", "te", "gu", "pa"];
            const detectedLanguage = validLanguages.includes(languageCode)
                  ? languageCode
                  : "en";

            console.log("✅ [detectLanguage] Detected:", detectedLanguage);

            res.json({
                  success: true,
                  language: detectedLanguage
            });
      } catch (error) {
            console.error("❌ [detectLanguage] Error:", error.message);
            res.status(500).json({
                  success: false,
                  message: "Language detection failed",
                  error: error.message
            });
      }
});

// Translate text using Gemini
export const translateText = asyncHandler(async (req, res) => {
      const { text, targetLanguage } = req.body;

      if (!text || text.trim().length === 0) {
            return res.status(400).json({
                  success: false,
                  message: "Text to translate is required"
            });
      }

      const languageNames = {
            en: "English",
            hi: "Hindi",
            mr: "Marathi",
            bn: "Bengali",
            ta: "Tamil",
            te: "Telugu",
            gu: "Gujarati",
            pa: "Punjabi"
      };

      const targetName = languageNames[targetLanguage] || "English";

      const prompt = `Translate this text to ${targetName}. Return only the translated text, nothing else.

Text to translate:
"${text}"`;

      try {
            console.log("🌐 [translateText] Translating to:", targetLanguage);
            const result = await model.generateContent(prompt);
            const response = result.response;
            const translatedText = response.text().trim();

            console.log("✅ [translateText] Translation complete");

            res.json({
                  success: true,
                  originalText: text,
                  translatedText: translatedText,
                  targetLanguage: targetLanguage
            });
      } catch (error) {
            console.error("❌ [translateText] Error:", error.message);
            res.status(500).json({
                  success: false,
                  message: "Translation failed",
                  error: error.message
            });
      }
});
