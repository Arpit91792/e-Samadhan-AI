import express from "express";
import {
      analyzeVoiceComplaint,
      detectEmergency,
      detectLanguage,
      translateText
} from "../controllers/aiController.js";

const router = express.Router();

// POST /api/ai/voice-complaint — Analyze voice complaint with Gemini AI
router.post("/voice-complaint", analyzeVoiceComplaint);

// POST /api/ai/detect-emergency — Detect emergency keywords
router.post("/detect-emergency", detectEmergency);

// POST /api/ai/detect-language — Detect language of text
router.post("/detect-language", detectLanguage);

// POST /api/ai/translate — Translate text to target language
router.post("/translate", translateText);

export default router;
