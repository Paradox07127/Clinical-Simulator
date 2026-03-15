import React from 'react';
import { motion } from 'motion/react';
import { User, Bed, Target, Lightbulb, ArrowRight } from 'lucide-react';
import type { PatientCase } from '../types';
import BackActionButton from '../../../app/BackActionButton';

interface InterviewBriefProps {
  patientCase: PatientCase;
  onStart: () => void;
  onBack: () => void;
}

const BRIEF_ITEMS = [
  {
    icon: User,
    label: 'Your Role',
    getText: () => 'You are a medical student conducting a clinical interview.',
  },
  {
    icon: Bed,
    label: 'Patient Setting',
    getText: (c: PatientCase) =>
      `${c.name}, ${c.age}y ${c.gender}. The patient will describe their chief complaint when the session begins.`,
  },
  {
    icon: Target,
    label: 'Scoring Criteria',
    getText: () =>
      'You will be scored on history coverage, reasoning, diagnosis, communication, efficiency, and safety.',
  },
  {
    icon: Lightbulb,
    label: 'What a Good Session Looks Like',
    getText: () =>
      'Start broad, cover key history, then narrow with empathy.',
  },
] as const;

export default function InterviewBrief({ patientCase, onStart, onBack }: InterviewBriefProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="lg:col-span-12 flex h-full w-full items-start justify-center overflow-y-auto py-4 lg:overflow-hidden lg:py-0"
    >
      <div className="w-full max-w-5xl shrink-0 bg-white border border-[#141414] rounded-2xl shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden lg:max-h-[calc(100dvh-7.75rem)] lg:grid lg:grid-rows-[auto,1fr,auto]">
        {/* Header */}
        <div className="bg-[#141414] px-5 py-4 lg:px-6 lg:py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-[#E4E3E0]/45 mb-2">
              {patientCase.name} / {patientCase.age} / {patientCase.gender}
            </p>
            <h2 className="text-lg lg:text-xl font-bold uppercase tracking-[0.16em] text-[#E4E3E0] font-display">
              Case Brief
            </h2>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#E4E3E0]/50 mt-1">
              Before you begin
            </p>
          </div>
          <div className={`text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.16em] shrink-0 ${
            patientCase.difficulty === 'easy' ? 'bg-emerald-600' :
            patientCase.difficulty === 'hard' ? 'bg-red-500' :
            'bg-amber-500'
          }`}>
            {patientCase.difficulty}
          </div>
        </div>

        {/* Brief items */}
        <div className="p-4 lg:p-5 grid gap-3 lg:grid-cols-2 content-start">
          {BRIEF_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.3 }}
                className="flex items-start gap-3 p-4 border border-[#141414]/10 rounded-xl bg-[#141414]/[0.02] min-h-[128px]"
              >
                <div className="w-9 h-9 rounded-lg bg-[#141414] flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-[#E4E3E0]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase opacity-50 tracking-[0.18em]">
                    {item.label}
                  </span>
                  <p className="text-sm lg:text-[15px] font-medium mt-1.5 leading-relaxed">
                    {item.getText(patientCase)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 pt-0 lg:px-5 lg:pb-5 flex items-center justify-between gap-4 border-t border-[#141414]/10 bg-white">
          <BackActionButton label="Back to Cases" onClick={onBack} />
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onStart}
            className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 lg:px-8 py-3 rounded-xl font-bold uppercase tracking-[0.16em] hover:bg-[#141414]/90 transition-all shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-sm"
          >
            Begin Interview <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
