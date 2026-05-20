import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

const STEPS = [
      { key: 'pending', label: 'Submitted' },
      { key: 'assigned', label: 'Assigned to Officer' },
      { key: 'in_progress', label: 'In Progress' },
      { key: 'resolved', label: 'Resolved' },
];

const order = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];

export default function ComplaintTimeline({ status, timeline = [] }) {
      const idx = order.indexOf(status === 'closed' ? 'resolved' : status);

      return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
                  {STEPS.map((step, i) => {
                        const done = i <= idx || status === 'resolved' || status === 'closed';
                        const active = i === idx;
                        const note = timeline.find((t) => t.status === step.key)?.note;
                        return (
                              <div key={step.key} className="flex gap-4">
                                    <motion.div className="flex flex-col items-center">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-400'}`}>
                                                {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                          </div>
                                          {i < STEPS.length - 1 && (
                                                <div className={`w-0.5 h-12 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                                          )}
                                    </motion.div>
                                    <div className="pb-8">
                                          <p className={`font-bold text-sm ${done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                                          {note && <p className="text-xs text-slate-500 mt-0.5">{note}</p>}
                                    </div>
                              </div>
                        );
                  })}
            </motion.div>
      );
}
