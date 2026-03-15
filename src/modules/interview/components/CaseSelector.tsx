import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { PatientCase } from '../types';

interface CaseSelectorProps {
  cases: PatientCase[];
  onSelectCase: (c: PatientCase) => void;
}

const DIFFICULTY_META: Record<string, { label: string; focusTitle: string; description: string; helper: string; color: string; border: string; hoverBorder: string; dot: string }> = {
  easy: {
    label: 'Easy',
    focusTitle: 'Foundational History',
    description: 'Classic symptoms with a clear history path',
    helper: 'Best for first sessions',
    color: 'text-emerald-700',
    border: 'border-emerald-600/30',
    hoverBorder: 'hover:border-emerald-600',
    dot: 'bg-emerald-500',
  },
  medium: {
    label: 'Medium',
    focusTitle: 'Mixed Signals',
    description: 'Less obvious clues that need wider coverage',
    helper: 'Balanced reasoning practice',
    color: 'text-amber-700',
    border: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-600',
    dot: 'bg-amber-500',
  },
  hard: {
    label: 'Hard',
    focusTitle: 'Red Flag Reasoning',
    description: 'Comorbidities and risk signals under pressure',
    helper: 'Fast prioritization practice',
    color: 'text-red-700',
    border: 'border-red-500/30',
    hoverBorder: 'hover:border-red-600',
    dot: 'bg-red-500',
  },
};

export default function CaseSelector({ cases, onSelectCase }: CaseSelectorProps) {
  const order = ['easy', 'medium', 'hard'];
  const sorted = [...cases].sort(
    (a, b) => order.indexOf(a.difficulty) - order.indexOf(b.difficulty),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl bg-white border border-[#141414] rounded-2xl p-6 lg:p-8 space-y-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-45">Clinical Interview</p>
          <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight font-display">Choose Your Case Level</h2>
          <p className="max-w-2xl text-sm lg:text-base leading-relaxed opacity-65">
            Choose the level of ambiguity you want to practice.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-[#141414]/15 bg-[#141414]/[0.03] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
          {sorted.length} live cases available
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {sorted.map((c, idx) => {
          const meta = DIFFICULTY_META[c.difficulty] ?? DIFFICULTY_META.easy;
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * idx, duration: 0.25 }}
              onClick={() => onSelectCase(c)}
              className={`w-full h-full min-h-[220px] group text-left p-5 lg:p-6 border-2 ${meta.border} rounded-2xl ${meta.hoverBorder} hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)] transition-all duration-200 flex flex-col justify-between gap-6`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] border ${meta.border} ${meta.color} transition-colors`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${meta.dot} shrink-0`} />
                    {meta.label}
                  </span>
                  <ChevronRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="space-y-2">
                  <div className={`font-bold uppercase text-xl tracking-tight font-display ${meta.color} transition-colors`}>{meta.focusTitle}</div>
                  <div className="text-sm leading-relaxed opacity-70 group-hover:opacity-90 transition-opacity">{meta.description}</div>
                </div>
                <div className="rounded-xl border border-[#141414]/10 bg-[#141414]/[0.03] px-3 py-2">
                  <div className="text-[9px] font-mono uppercase tracking-[0.16em] opacity-45 mb-1">Best For</div>
                  <div className="text-xs font-medium leading-relaxed opacity-75 group-hover:opacity-95 transition-opacity">
                    {meta.helper}
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-55 group-hover:opacity-100 transition-opacity">
                Open Case
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
