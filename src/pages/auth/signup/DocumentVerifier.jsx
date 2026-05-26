import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
      Upload, FileText, CheckCircle2, XCircle, Loader2,
      AlertTriangle, ScanLine, RefreshCw, Eye, ShieldCheck, FileX
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import api from '../../../api/axios';

// ── Document rules (mirrors backend) ─────────────────────────────────────────
const DOC_RULES = {
      aadhaar: {
            label: 'Aadhaar Card',
            emoji: '🪪',
            keywords: ['aadhaar', 'uidai', 'unique identification', 'government of india', 'आधार'],
            regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/,
            hint: '12-digit Aadhaar number',
            color: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50 border-blue-200',
      },
      pan: {
            label: 'PAN Card',
            emoji: '💳',
            keywords: ['permanent account number', 'income tax', 'pan'],
            regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,
            hint: 'Format: ABCDE1234F',
            color: 'from-violet-500 to-purple-600',
            bg: 'bg-violet-50 border-violet-200',
      },
      voter_id: {
            label: 'Voter ID',
            emoji: '🗳️',
            keywords: ['election commission', 'voter', 'electors photo', 'epic'],
            regex: /\b[A-Z]{3}[0-9]{7}\b/,
            hint: 'Format: ABC1234567',
            color: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50 border-emerald-200',
      },
      driving_license: {
            label: 'Driving License',
            emoji: '🚗',
            keywords: ['driving licence', 'motor vehicles', 'transport'],
            regex: /\b[A-Z]{2}[0-9]{2}[0-9]{4,11}\b/,
            hint: 'State code + number',
            color: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-50 border-amber-200',
      },
      passport: {
            label: 'Passport',
            emoji: '📘',
            keywords: ['republic of india', 'passport', 'ministry of external affairs'],
            regex: /\b[A-Z][0-9]{7}\b/,
            hint: 'Format: A1234567',
            color: 'from-rose-500 to-red-600',
            bg: 'bg-rose-50 border-rose-200',
      },
};

// ── Aadhaar-specific detail extractor ────────────────────────────────────────
const extractAadhaarDetails = (text) => {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      // Aadhaar number — 4+4+4 digits with optional spaces
      const aadhaarMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
      const aadhaarNumber = aadhaarMatch ? aadhaarMatch[0].replace(/\s/g, '') : null;

      // DOB — DD/MM/YYYY or DD-MM-YYYY or Year of Birth: YYYY
      const dobMatch = text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/)
            || text.match(/(?:DOB|Date of Birth|Year of Birth)[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4})/i);
      const dob = dobMatch ? dobMatch[1] || dobMatch[0] : null;

      // Gender
      const genderMatch = text.match(/\b(MALE|FEMALE|Male|Female|पुरुष|महिला)\b/);
      const gender = genderMatch
            ? (['male', 'पुरुष'].includes(genderMatch[0].toLowerCase()) ? 'Male' : 'Female')
            : null;

      // Name — heuristic: line after "Government of India" or before DOB line,
      // not a keyword line, not all-caps header, min 3 chars, contains space
      const skipPatterns = /government|india|uidai|aadhaar|आधार|unique|identification|authority|dob|date|birth|male|female|पुरुष|महिला|\d{4}/i;
      let name = null;
      for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Skip short lines, all-digit lines, keyword lines
            if (line.length < 3) continue;
            if (skipPatterns.test(line)) continue;
            // Must contain at least one space (first + last name) or be a single proper name
            if (/^[A-Za-z\s\.]+$/.test(line) && line.length >= 4) {
                  name = line.replace(/\s+/g, ' ').trim();
                  break;
            }
      }

      return { aadhaarNumber, dob, gender, name };
};

const STATUS = { IDLE: 'idle', UPLOADING: 'uploading', SCANNING: 'scanning', SUCCESS: 'success', MISMATCH: 'mismatch', ERROR: 'error' };

// ── Client-side OCR validation ────────────────────────────────────────────────
const validateLocally = (text, selectedType) => {
      const lower = text.toLowerCase();
      const rules = DOC_RULES[selectedType];
      if (!rules) return { valid: false, message: 'Unknown document type' };

      // Detect what the document actually is
      let detectedType = null;
      let bestScore = 0;
      for (const [type, rule] of Object.entries(DOC_RULES)) {
            const score = rule.keywords.filter(kw => lower.includes(kw)).length;
            if (score > bestScore) { bestScore = score; detectedType = type; }
      }

      if (detectedType && detectedType !== selectedType && bestScore >= 1) {
            return {
                  valid: false,
                  mismatch: true,
                  detectedType,
                  message: `This is not the selected document. You selected "${rules.label}" but uploaded a "${DOC_RULES[detectedType]?.label}".`,
            };
      }

      const keywordMatch = rules.keywords.some(kw => lower.includes(kw));
      const numMatch = text.match(rules.regex);

      if (!keywordMatch && !numMatch) {
            return {
                  valid: false,
                  message: `Could not verify this as "${rules.label}". Upload a clear image of the correct document.`,
            };
      }

      return {
            valid: true,
            extractedNumber: numMatch ? numMatch[0].replace(/\s/g, '') : 'Detected',
            message: `${rules.label} verified successfully!`,
      };
};

// ─────────────────────────────────────────────────────────────────────────────
export default function DocumentVerifier({ selectedType, onVerified, onReset }) {
      const [status, setStatus] = useState(STATUS.IDLE);
      const [file, setFile] = useState(null);
      const [preview, setPreview] = useState(null);
      const [ocrProgress, setOcrProgress] = useState(0);
      const [ocrText, setOcrText] = useState('');
      const [result, setResult] = useState(null);
      const [dragOver, setDragOver] = useState(false);
      const [aadhaarDetails, setAadhaarDetails] = useState(null);
      const inputRef = useRef(null);

      const rules = DOC_RULES[selectedType];

      const reset = () => {
            setStatus(STATUS.IDLE);
            setFile(null);
            setPreview(null);
            setOcrProgress(0);
            setOcrText('');
            setResult(null);
            setAadhaarDetails(null);
            onReset?.();
      };

      const processFile = useCallback(async (f) => {
            if (!f) return;

            // Validate file type
            const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
            if (!allowed.includes(f.type)) {
                  setResult({ valid: false, message: 'Only JPG, PNG, WebP, or PDF files are allowed.' });
                  setStatus(STATUS.ERROR);
                  return;
            }
            if (f.size > 5 * 1024 * 1024) {
                  setResult({ valid: false, message: 'File size must be under 5MB.' });
                  setStatus(STATUS.ERROR);
                  return;
            }

            setFile(f);
            setStatus(STATUS.UPLOADING);

            // Create preview
            if (f.type !== 'application/pdf') {
                  const url = URL.createObjectURL(f);
                  setPreview(url);
            } else {
                  setPreview(null);
            }

            // Run OCR
            setStatus(STATUS.SCANNING);
            setOcrProgress(0);

            try {
                  const worker = await createWorker('eng', 1, {
                        logger: (m) => {
                              if (m.status === 'recognizing text') {
                                    setOcrProgress(Math.round(m.progress * 100));
                              }
                        },
                  });

                  const { data: { text } } = await worker.recognize(f);
                  await worker.terminate();

                  setOcrText(text);
                  setOcrProgress(100);

                  // Extract Aadhaar-specific details if applicable
                  let extracted = null;
                  if (selectedType === 'aadhaar') {
                        extracted = extractAadhaarDetails(text);
                        setAadhaarDetails(extracted);
                  }

                  // Validate locally first
                  const localResult = validateLocally(text, selectedType);
                  setResult(localResult);

                  if (localResult.mismatch) {
                        setStatus(STATUS.MISMATCH);
                        return;
                  }

                  // Also validate on backend
                  try {
                        const { data } = await api.post('/documents/verify', {
                              ocrText: text,
                              selectedType,
                        });
                        setResult({ valid: data.success, message: data.message, extractedNumber: data.extractedNumber });
                        setStatus(data.success ? STATUS.SUCCESS : STATUS.MISMATCH);
                        if (data.success) {
                              onVerified?.({
                                    file: f,
                                    ocrText: text,
                                    extractedNumber: data.extractedNumber,
                                    selectedType,
                                    aadhaarDetails: extracted,
                              });
                        }
                  } catch {
                        // Backend unavailable — use local result
                        setStatus(localResult.valid ? STATUS.SUCCESS : STATUS.ERROR);
                        if (localResult.valid) {
                              onVerified?.({
                                    file: f,
                                    ocrText: text,
                                    extractedNumber: localResult.extractedNumber,
                                    selectedType,
                                    aadhaarDetails: extracted,
                              });
                        }
                  }
            } catch (err) {
                  console.error('OCR error:', err);
                  setResult({ valid: false, message: 'OCR scanning failed. Please upload a clearer image.' });
                  setStatus(STATUS.ERROR);
            }
      }, [selectedType, onVerified]);

      const handleDrop = (e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) processFile(f);
      };

      const handleFileChange = (e) => {
            const f = e.target.files[0];
            if (f) processFile(f);
      };

      if (!selectedType) return null;

      return (
            <div className="space-y-4">
                  {/* Document type badge */}
                  <div className={`flex items-center gap-2.5 p-3 ${rules.bg} border rounded-xl`}>
                        <span className="text-xl">{rules.emoji}</span>
                        <div>
                              <p className="text-sm font-bold text-gray-800">Upload {rules.label}</p>
                              <p className="text-xs text-gray-500">{rules.hint} • JPG, PNG, PDF up to 5MB</p>
                        </div>
                        {status === STATUS.SUCCESS && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                                    className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-emerald-100 border border-emerald-200 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-700">Verified</span>
                              </motion.div>
                        )}
                  </div>

                  <AnimatePresence mode="wait">
                        {/* ── IDLE: Drop zone ── */}
                        {status === STATUS.IDLE && (
                              <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <div
                                          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                          onDragLeave={() => setDragOver(false)}
                                          onDrop={handleDrop}
                                          onClick={() => inputRef.current?.click()}
                                          className={`relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${dragOver
                                                ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                                                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                                                }`}
                                    >
                                          <motion.div
                                                animate={dragOver ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
                                                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${rules.color} flex items-center justify-center shadow-lg`}
                                          >
                                                <Upload className="w-7 h-7 text-white" />
                                          </motion.div>
                                          <div className="text-center">
                                                <p className="text-sm font-bold text-gray-700">
                                                      {dragOver ? 'Drop your document here' : 'Drag & drop or click to upload'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, WebP, PDF</p>
                                          </div>
                                          <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                                    </div>
                              </motion.div>
                        )}

                        {/* ── UPLOADING / SCANNING: OCR in progress ── */}
                        {(status === STATUS.UPLOADING || status === STATUS.SCANNING) && (
                              <motion.div key="scanning" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    className="space-y-4">
                                    {/* Preview */}
                                    {preview && (
                                          <div className="relative rounded-2xl overflow-hidden border-2 border-blue-200 shadow-md">
                                                <img src={preview} alt="Document" className="w-full max-h-48 object-cover" />
                                                <div className="absolute inset-0 bg-blue-900/40 flex flex-col items-center justify-center gap-2">
                                                      {/* Scanning animation */}
                                                      <motion.div
                                                            animate={{ y: [-60, 60, -60] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                            className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent absolute"
                                                      />
                                                      <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                                                            <ScanLine className="w-4 h-4 text-blue-300 animate-pulse" />
                                                            <span className="text-white text-xs font-semibold">AI Scanning Document...</span>
                                                      </div>
                                                </div>
                                          </div>
                                    )}

                                    {/* Progress */}
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                                          <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                                      <span className="font-semibold text-blue-800">
                                                            {status === STATUS.UPLOADING ? 'Preparing document...' : `OCR Scanning: ${ocrProgress}%`}
                                                      </span>
                                                </div>
                                                <span className="text-blue-600 font-bold">{ocrProgress}%</span>
                                          </div>
                                          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                                                <motion.div
                                                      animate={{ width: `${ocrProgress}%` }}
                                                      transition={{ duration: 0.3 }}
                                                      className={`h-full bg-gradient-to-r ${rules.color} rounded-full`}
                                                />
                                          </div>
                                          <p className="text-xs text-blue-600">Extracting text and validating document type...</p>
                                    </div>
                              </motion.div>
                        )}

                        {/* ── SUCCESS ── */}
                        {status === STATUS.SUCCESS && (
                              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    className="space-y-3">
                                    {preview && (
                                          <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md">
                                                <img src={preview} alt="Document" className="w-full max-h-48 object-cover" />
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                      className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                                                            className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl">
                                                            <CheckCircle2 className="w-8 h-8 text-white" />
                                                      </motion.div>
                                                </motion.div>
                                          </div>
                                    )}
                                    <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                          <div className="flex-1">
                                                <p className="text-sm font-bold text-emerald-800">Document Verified ✓</p>
                                                <p className="text-xs text-emerald-600 mt-0.5">{result?.message}</p>
                                                {result?.extractedNumber && result.extractedNumber !== 'Detected' && (
                                                      <p className="text-xs font-mono text-emerald-700 mt-1 bg-emerald-100 px-2 py-0.5 rounded inline-block">
                                                            ID: {result.extractedNumber}
                                                      </p>
                                                )}
                                          </div>
                                    </div>

                                    {/* Aadhaar extracted details card */}
                                    {selectedType === 'aadhaar' && aadhaarDetails && (
                                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                                                <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                                                      🪪 Extracted from Aadhaar
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                      {aadhaarDetails.name && (
                                                            <div className="col-span-2">
                                                                  <span className="text-gray-500">Name</span>
                                                                  <p className="font-semibold text-gray-800">{aadhaarDetails.name}</p>
                                                            </div>
                                                      )}
                                                      {aadhaarDetails.aadhaarNumber && (
                                                            <div>
                                                                  <span className="text-gray-500">Aadhaar No.</span>
                                                                  <p className="font-mono font-semibold text-gray-800">
                                                                        {aadhaarDetails.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                                                                  </p>
                                                            </div>
                                                      )}
                                                      {aadhaarDetails.dob && (
                                                            <div>
                                                                  <span className="text-gray-500">Date of Birth</span>
                                                                  <p className="font-semibold text-gray-800">{aadhaarDetails.dob}</p>
                                                            </div>
                                                      )}
                                                      {aadhaarDetails.gender && (
                                                            <div>
                                                                  <span className="text-gray-500">Gender</span>
                                                                  <p className="font-semibold text-gray-800">{aadhaarDetails.gender}</p>
                                                            </div>
                                                      )}
                                                </div>
                                                <p className="text-[10px] text-blue-500 mt-1">
                                                      ✅ Form fields auto-filled from Aadhaar
                                                </p>
                                          </motion.div>
                                    )}
                                    <button type="button" onClick={reset}
                                          className="w-full py-2.5 text-sm text-gray-500 font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                          <RefreshCw className="w-3.5 h-3.5" /> Upload Different Document
                                    </button>
                              </motion.div>
                        )}

                        {/* ── MISMATCH: Wrong document ── */}
                        {status === STATUS.MISMATCH && (
                              <motion.div key="mismatch" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    className="space-y-3">
                                    {preview && (
                                          <div className="relative rounded-2xl overflow-hidden border-2 border-red-400 shadow-md">
                                                <img src={preview} alt="Document" className="w-full max-h-48 object-cover opacity-60" />
                                                <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                                                            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl">
                                                            <XCircle className="w-8 h-8 text-white" />
                                                      </motion.div>
                                                </div>
                                          </div>
                                    )}
                                    <motion.div
                                          animate={{ x: [-4, 4, -4, 4, 0] }} transition={{ duration: 0.4 }}
                                          className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                          <div>
                                                <p className="text-sm font-black text-red-800">Wrong Document Uploaded</p>
                                                <p className="text-xs text-red-600 mt-1">{result?.message}</p>
                                                {result?.detectedType && (
                                                      <p className="text-xs text-red-500 mt-1">
                                                            Detected: <strong>{DOC_RULES[result.detectedType]?.label}</strong> •
                                                            Expected: <strong>{rules.label}</strong>
                                                      </p>
                                                )}
                                          </div>
                                    </motion.div>
                                    <button type="button" onClick={reset}
                                          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all">
                                          <RefreshCw className="w-4 h-4" /> Upload Correct Document
                                    </button>
                              </motion.div>
                        )}

                        {/* ── ERROR ── */}
                        {status === STATUS.ERROR && (
                              <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                          <div>
                                                <p className="text-sm font-bold text-orange-800">Verification Failed</p>
                                                <p className="text-xs text-orange-600 mt-0.5">{result?.message}</p>
                                                <p className="text-xs text-orange-500 mt-1">Tips: Use good lighting, ensure text is readable, avoid glare.</p>
                                          </div>
                                    </div>
                                    <button type="button" onClick={reset}
                                          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl text-sm">
                                          <RefreshCw className="w-4 h-4" /> Try Again
                                    </button>
                              </motion.div>
                        )}
                  </AnimatePresence>

                  {/* OCR text preview (dev helper) */}
                  {ocrText && status === STATUS.SUCCESS && (
                        <details className="text-xs">
                              <summary className="text-gray-400 cursor-pointer hover:text-gray-600 flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> View extracted text
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-[10px] max-h-24 overflow-auto whitespace-pre-wrap">
                                    {ocrText.slice(0, 300)}{ocrText.length > 300 ? '...' : ''}
                              </pre>
                        </details>
                  )}
            </div>
      );
}
