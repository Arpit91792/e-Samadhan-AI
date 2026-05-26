import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const VoiceComplaint = ({
      setTitle,
      setDescription,
      setDepartment,
      setPriority,
      setCategory,
      setEmergency
}) => {
      const { t, i18n } = useTranslation();
      const [listening, setListening] = useState(false);
      const [voiceText, setVoiceText] = useState("");
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState("");
      const [language, setLanguage] = useState(i18n.language);
      const [aiData, setAiData] = useState(null);
      const recognitionRef = useRef(null);
      const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

      // Initialize Web Speech API
      useEffect(() => {
            const SpeechRecognition =
                  window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                  setError("❌ Web Speech API not supported in your browser");
                  return;
            }

            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            return () => {
                  if (recognitionRef.current) {
                        recognitionRef.current.abort();
                  }
            };
      }, []);

      // Language mapping for Web Speech API
      const getLanguageCode = (lang) => {
            const langMap = {
                  en: "en-US",
                  hi: "hi-IN",
                  mr: "mr-IN",
                  bn: "bn-IN",
                  ta: "ta-IN",
                  te: "te-IN",
                  gu: "gu-IN",
                  pa: "pa-IN"
            };
            return langMap[lang] || "en-US";
      };

      // Speak response using Text-to-Speech
      const speakResponse = (text) => {
            if (!("speechSynthesis" in window)) {
                  console.log("Text-to-speech not supported");
                  return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = getLanguageCode(selectedLanguage);
            window.speechSynthesis.speak(utterance);
      };

      // Start listening to voice
      const startListening = async () => {
            setError("");
            setVoiceText("");

            if (!recognitionRef.current) {
                  setError("❌ Speech recognition not available");
                  return;
            }

            try {
                  // Request microphone permission
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  stream.getTracks().forEach(track => track.stop());

                  recognitionRef.current.lang = getLanguageCode(selectedLanguage);
                  recognitionRef.current.onstart = () => setListening(true);

                  recognitionRef.current.onresult = async (event) => {
                        const transcript = event.results[0][0].transcript;
                        setVoiceText(transcript);
                        setListening(false);

                        // Auto-analyze after voice capture
                        await analyzeComplaint(transcript);
                  };

                  recognitionRef.current.onerror = (event) => {
                        setListening(false);
                        if (event.error === "no-speech") {
                              setError("🔇 No speech detected. Please try again.");
                        } else if (event.error === "network") {
                              setError("📡 Network error. Check your connection.");
                        } else {
                              setError(`❌ Error: ${event.error}`);
                        }
                  };

                  recognitionRef.current.onend = () => setListening(false);

                  recognitionRef.current.start();
                  toast.success("🎤 Listening...");
            } catch (err) {
                  if (err.name === "NotAllowedError") {
                        setError("❌ Microphone permission denied. Enable it in settings.");
                  } else if (err.name === "NotFoundError") {
                        setError("❌ No microphone found. Connect a microphone.");
                  } else {
                        setError(`❌ Error: ${err.message}`);
                  }
            }
      };

      // Stop listening
      const stopListening = () => {
            if (recognitionRef.current) {
                  recognitionRef.current.abort();
                  setListening(false);
            }
      };

      // Analyze complaint using Gemini AI
      const analyzeComplaint = async (text) => {
            if (!text || text.trim().length === 0) {
                  setError("❌ No text to analyze");
                  return;
            }

            try {
                  setLoading(true);
                  setError("");
                  console.log("🎙️ Sending voice complaint to AI:", { complaintText: text.substring(0, 100) + "..." });

                  const response = await api.post(
                        "/ai/voice-complaint",
                        { complaintText: text }
                  );

                  console.log("✅ AI Response:", response.data);

                  if (response.data.success && response.data.data) {
                        const data = response.data.data;
                        setAiData(data);

                        // Auto-fill form fields
                        if (setTitle) setTitle(data.title);
                        if (setDescription) setDescription(data.description);
                        if (setDepartment) setDepartment(data.department);
                        if (setPriority) setPriority(data.priority);
                        if (setCategory) setCategory(data.category);
                        if (setEmergency) setEmergency(data.emergency);

                        // Show success toast
                        toast.success("✅ Complaint analyzed successfully!");

                        // Speak response
                        const response_text =
                              `Your complaint about ${data.category} has been categorized as ${data.priority} priority and assigned to ${data.department}`;
                        speakResponse(response_text);
                  } else {
                        const errorMsg = response.data?.message || "Analysis failed";
                        setError(`❌ ${errorMsg}`);
                        toast.error(errorMsg);
                  }
            } catch (err) {
                  console.error("❌ Analysis Error:", {
                        message: err.message,
                        status: err.response?.status,
                        data: err.response?.data,
                        config: err.config?.url
                  });

                  let errorMsg = "Failed to analyze complaint";

                  if (err.response?.data?.message) {
                        errorMsg = err.response.data.message;
                  } else if (err.response?.data?.error) {
                        errorMsg = err.response.data.error;
                  } else if (err.message === "timeout of 15000ms exceeded") {
                        errorMsg = "AI analysis timed out. Please try again.";
                  } else if (!err.response) {
                        errorMsg = "Network error. Check your connection.";
                  } else {
                        errorMsg = err.message || "AI complaint analysis failed";
                  }

                  setError(`❌ ${errorMsg}`);
                  toast.error(errorMsg);
            } finally {
                  setLoading(false);
            }
      };

      // Retry listening
      const retry = () => {
            setVoiceText("");
            setError("");
            setAiData(null);
            startListening();
      };

      // Handle language change
      const handleLanguageChange = (e) => {
            const newLang = e.target.value;
            setSelectedLanguage(newLang);
      };

      return (
            <div className="space-y-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                              🎙️ {t("voiceComplaint.title", "AI Voice Complaint")}
                        </h3>
                        <select
                              value={selectedLanguage}
                              onChange={handleLanguageChange}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                              <option value="en">🇬🇧 English</option>
                              <option value="hi">🇮🇳 हिन्दी</option>
                              <option value="mr">🇮🇳 मराठी</option>
                              <option value="bn">🇧🇩 বাংলা</option>
                              <option value="ta">🇮🇳 தமிழ்</option>
                              <option value="te">🇮🇳 తెలుగు</option>
                              <option value="gu">🇮🇳 ગુજરાતી</option>
                              <option value="pa">🇮🇳 ਪੰਜਾਬੀ</option>
                        </select>
                  </div>

                  {/* Microphone Button with Animation */}
                  <div className="flex justify-center">
                        <button
                              onClick={listening ? stopListening : startListening}
                              disabled={loading}
                              className={`relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-bold text-white transition-all duration-300 ${listening
                                    ? "animate-pulse bg-red-500 shadow-lg shadow-red-500/50 hover:bg-red-600"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl hover:shadow-blue-500/30"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                              {/* Pulse animation for listening state */}
                              {listening && (
                                    <>
                                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                          <span className="absolute inline-flex h-12 w-12 rounded-full bg-red-500"></span>
                                    </>
                              )}

                              <span className="relative flex items-center gap-2">
                                    {listening ? "🎙️ Listening..." : "🎤 Speak Complaint"}
                              </span>
                        </button>
                  </div>

                  {/* Info Text */}
                  <p className="text-center text-sm text-gray-600">
                        {t("voiceComplaint.instruction", "Click microphone and speak your complaint in any language")}
                  </p>

                  {/* Error Message */}
                  {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-red-700 shadow-sm">
                              <p className="text-sm">{error}</p>
                        </div>
                  )}

                  {/* Detected Voice Text */}
                  {voiceText && (
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                              <p className="text-sm font-bold text-gray-700">
                                    🔊 {t("voiceComplaint.detectedVoice", "Detected Voice:")}
                              </p>
                              <p className="mt-2 text-gray-700">{voiceText}</p>
                        </div>
                  )}

                  {/* Loading State */}
                  {loading && (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 p-4">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                              <span className="text-sm font-medium text-blue-700">
                                    🤖 {t("voiceComplaint.analyzing", "AI analyzing complaint...")}
                              </span>
                        </div>
                  )}

                  {/* AI Analysis Results */}
                  {aiData && (
                        <div className="space-y-3 rounded-lg border-2 border-green-200 bg-green-50 p-4">
                              <p className="font-bold text-green-700">✅ AI Analysis Complete</p>

                              <div className="grid gap-2 text-sm">
                                    {aiData.language !== "en" && (
                                          <div>
                                                <span className="font-semibold text-gray-700">Language:</span>{" "}
                                                <span className="text-gray-600">{aiData.language.toUpperCase()}</span>
                                          </div>
                                    )}

                                    {aiData.translatedText && aiData.language !== "en" && (
                                          <div>
                                                <span className="font-semibold text-gray-700">Translated:</span>
                                                <p className="mt-1 text-gray-600">{aiData.translatedText}</p>
                                          </div>
                                    )}

                                    <div>
                                          <span className="font-semibold text-gray-700">📋 Title:</span>{" "}
                                          <span className="text-gray-600">{aiData.title}</span>
                                    </div>

                                    <div>
                                          <span className="font-semibold text-gray-700">🏢 Department:</span>{" "}
                                          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                                                {aiData.department}
                                          </span>
                                    </div>

                                    <div>
                                          <span className="font-semibold text-gray-700">📊 Priority:</span>{" "}
                                          <span
                                                className={`inline-block rounded-full px-3 py-1 ${aiData.priority === "Emergency"
                                                      ? "bg-red-100 text-red-700"
                                                      : aiData.priority === "High"
                                                            ? "bg-orange-100 text-orange-700"
                                                            : aiData.priority === "Medium"
                                                                  ? "bg-yellow-100 text-yellow-700"
                                                                  : "bg-green-100 text-green-700"
                                                      }`}
                                          >
                                                {aiData.priority}
                                          </span>
                                    </div>

                                    {aiData.emergency && (
                                          <div className="rounded-lg bg-red-100 p-2 text-red-700">
                                                🚨 <span className="font-bold">EMERGENCY DETECTED</span>
                                          </div>
                                    )}

                                    {aiData.isDuplicate && (
                                          <div className="rounded-lg bg-yellow-100 p-2 text-yellow-700">
                                                ⚠️ This might be a duplicate complaint
                                          </div>
                                    )}

                                    <div>
                                          <span className="font-semibold text-gray-700">Confidence:</span>
                                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                                <div
                                                      className="h-full bg-green-500"
                                                      style={{ width: `${aiData.confidence}%` }}
                                                ></div>
                                          </div>
                                          <span className="text-xs text-gray-600">{aiData.confidence}%</span>
                                    </div>

                                    {aiData.keywords && aiData.keywords.length > 0 && (
                                          <div>
                                                <span className="font-semibold text-gray-700">Keywords:</span>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                      {aiData.keywords.map((keyword, idx) => (
                                                            <span
                                                                  key={idx}
                                                                  className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700"
                                                            >
                                                                  #{keyword}
                                                            </span>
                                                      ))}
                                                </div>
                                          </div>
                                    )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                    <button
                                          onClick={retry}
                                          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                                    >
                                          🔄 Try Again
                                    </button>
                                    <button
                                          onClick={() => speakResponse(`Your complaint: ${aiData.description}`)}
                                          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
                                    >
                                          🔊 Hear Summary
                                    </button>
                              </div>
                        </div>
                  )}

                  {/* Usage Instructions */}
                  {!voiceText && !aiData && (
                        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                              <p className="font-semibold">💡 How to use:</p>
                              <ul className="mt-2 space-y-1 list-disc list-inside">
                                    <li>Select your language</li>
                                    <li>Click the microphone button</li>
                                    <li>Speak your complaint clearly</li>
                                    <li>AI will analyze and auto-fill the form</li>
                                    <li>Review and submit</li>
                              </ul>
                        </div>
                  )}
            </div>
      );
};

export default VoiceComplaint;
