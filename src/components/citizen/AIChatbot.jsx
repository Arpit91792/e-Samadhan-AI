import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function getReply(msg, t) {
      const lower = msg.toLowerCase();
      const REPLIES = [
            { keys: ['electricity', 'power', 'light', 'बिजली', 'विद्युत', 'वीज'], textKey: 'chatbot.replyElectricity' },
            { keys: ['water', 'leak', 'पानी', 'जल', 'पाणी'], textKey: 'chatbot.replyWater' },
            { keys: ['police', 'crime', 'पुलिस', 'अपराध', 'पोलीस'], textKey: 'chatbot.replyPolice' },
            { keys: ['track', 'status', 'ट्रैक', 'स्थिति', 'ट्रॅक'], textKey: 'chatbot.replyTrack' },
            { keys: ['emergency', 'आपातकाल', 'आपत्कालीन'], textKey: 'chatbot.replyEmergency' },
      ];
      for (const r of REPLIES) {
            if (r.keys.some((k) => lower.includes(k))) return t(r.textKey);
      }
      return t('chatbot.replyDefault');
}

export default function AIChatbot() {
      const { t } = useTranslation();
      const [open, setOpen] = useState(false);
      const [messages, setMessages] = useState(null);
      const [input, setInput] = useState('');

      // Initialise messages lazily so greeting uses current language
      const getMessages = () => {
            if (!messages) {
                  return [{ role: 'bot', text: t('chatbot.greeting') }];
            }
            return messages;
      };

      const send = (e) => {
            e.preventDefault();
            if (!input.trim()) return;
            const userMsg = input.trim();
            const current = getMessages();
            setMessages([...current, { role: 'user', text: userMsg }, { role: 'bot', text: getReply(userMsg, t) }]);
            setInput('');
      };

      const handleOpen = () => {
            if (!open && !messages) {
                  setMessages([{ role: 'bot', text: t('chatbot.greeting') }]);
            }
            setOpen(!open);
      };

      return (
            <>
                  <button
                        type="button"
                        onClick={handleOpen}
                        aria-label={t('chatbot.title')}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-xl flex items-center justify-center"
                  >
                        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                  </button>
                  <AnimatePresence>
                        {open && (
                              <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] glass rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[420px]"
                              >
                                    <motion.div className="p-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm">
                                          {t('chatbot.title')}
                                    </motion.div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
                                          {getMessages().map((m, i) => (
                                                <div key={i} className={`text-xs p-2 rounded-xl max-w-[90%] ${m.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                                      {m.text}
                                                </div>
                                          ))}
                                    </div>
                                    <form onSubmit={send} className="p-2 border-t flex gap-1">
                                          <input
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                className="flex-1 text-xs px-2 py-2 border rounded-lg"
                                                placeholder={t('chatbot.placeholder')}
                                          />
                                          <button type="submit" aria-label={t('chatbot.send')} className="p-2 bg-blue-600 text-white rounded-lg">
                                                <Send className="w-4 h-4" />
                                          </button>
                                    </form>
                              </motion.div>
                        )}
                  </AnimatePresence>
            </>
      );
}
