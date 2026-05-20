import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

const REPLIES = [
      { keys: ['electricity', 'power', 'light'], text: 'For electricity issues: Create Complaint → select Electricity department, describe outage location, add photo of affected area.' },
      { keys: ['water', 'leak'], text: 'Water complaints go to Water Supply department. Use emergency toggle if flooding is severe.' },
      { keys: ['police', 'crime'], text: 'For crime or safety: use Emergency Complaints for fastest response, or Police department.' },
      { keys: ['track', 'status'], text: 'Go to Track Complaint and enter your ID (e.g. C-000001) to see live timeline.' },
      { keys: ['emergency'], text: 'Emergency mode is for fire, accident, medical crisis. It alerts officers immediately.' },
];

function getReply(msg) {
      const lower = msg.toLowerCase();
      for (const r of REPLIES) {
            if (r.keys.some((k) => lower.includes(k))) return r.text;
      }
      return 'I can help you file complaints, track status, or use emergency mode. Try asking about electricity, water, or tracking.';
}

export default function AIChatbot() {
      const [open, setOpen] = useState(false);
      const [messages, setMessages] = useState([
            { role: 'bot', text: 'Hi! I am e-Samadhan AI assistant. How can I help you today?' },
      ]);
      const [input, setInput] = useState('');

      const send = (e) => {
            e.preventDefault();
            if (!input.trim()) return;
            const userMsg = input.trim();
            setMessages((m) => [...m, { role: 'user', text: userMsg }, { role: 'bot', text: getReply(userMsg) }]);
            setInput('');
      };

      return (
            <>
                  <button
                        type="button"
                        onClick={() => setOpen(!open)}
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
                                          AI Assistant
                                    </motion.div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
                                          {messages.map((m, i) => (
                                                <div key={i} className={`text-xs p-2 rounded-xl max-w-[90%] ${m.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                                      {m.text}
                                                </div>
                                          ))}
                                    </div>
                                    <form onSubmit={send} className="p-2 border-t flex gap-1">
                                          <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 text-xs px-2 py-2 border rounded-lg" placeholder="Ask me anything..." />
                                          <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg"><Send className="w-4 h-4" /></button>
                                    </form>
                              </motion.div>
                        )}
                  </AnimatePresence>
            </>
      );
}
