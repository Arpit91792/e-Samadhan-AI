import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { validateDocumentText, DOC_RULES } from '../services/ocrService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// @desc  Verify document — validate OCR text from frontend
// @route POST /api/documents/verify
// @access Public (called during signup before account creation)
export const verifyDocument = async (req, res, next) => {
      try {
            const { ocrText, selectedType, userId } = req.body;

            if (!ocrText || !selectedType) {
                  return res.status(400).json({
                        success: false,
                        message: 'OCR text and document type are required',
                  });
            }

            const result = validateDocumentText(ocrText, selectedType);

            return res.status(result.valid ? 200 : 422).json({
                  success: result.valid,
                  message: result.message,
                  detectedType: result.detectedType,
                  extractedNumber: result.extractedNumber,
                  selectedType,
                  label: DOC_RULES[selectedType]?.label,
            });
      } catch (error) {
            next(error);
      }
};

// @desc  Upload document image + validate
// @route POST /api/documents/upload
// @access Public
export const uploadDocument = async (req, res, next) => {
      try {
            const { selectedType, ocrText } = req.body;

            if (!req.file) {
                  return res.status(400).json({ success: false, message: 'Document file is required' });
            }
            if (!selectedType) {
                  return res.status(400).json({ success: false, message: 'Document type is required' });
            }

            const fileUrl = `/uploads/govt-ids/${req.file.filename}`;

            // If OCR text provided, validate it
            let verificationResult = { valid: true, message: 'Document uploaded', extractedNumber: null };
            if (ocrText) {
                  verificationResult = validateDocumentText(ocrText, selectedType);
                  if (!verificationResult.valid) {
                        // Delete the uploaded file since it's wrong
                        const fullPath = path.join(__dirname, '..', fileUrl);
                        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

                        return res.status(422).json({
                              success: false,
                              message: verificationResult.message,
                              detectedType: verificationResult.detectedType,
                        });
                  }
            }

            return res.status(200).json({
                  success: true,
                  message: verificationResult.message,
                  fileUrl,
                  selectedType,
                  extractedNumber: verificationResult.extractedNumber,
                  label: DOC_RULES[selectedType]?.label,
            });
      } catch (error) {
            next(error);
      }
};

// @desc  Get supported document types
// @route GET /api/documents/types
// @access Public
export const getDocumentTypes = (req, res) => {
      const types = Object.entries(DOC_RULES).map(([value, rule]) => ({
            value,
            label: rule.label,
            hint: rule.hint,
      }));
      res.status(200).json({ success: true, types });
};
