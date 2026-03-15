import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, FileText, Target, CheckSquare, ArrowRight, Video } from 'lucide-react';
import type { CprScenario } from '../types';
import DemoVideoModal from './DemoVideoModal';
import BackActionButton from '../../../app/BackActionButton';

interface CprBriefProps {
  scenario: CprScenario;
  allScenarios: CprScenario[];
  onSelectScenario: (scenarioId: string) => void;
  onStart: () => void;
  onBack: () => void;
}

const SETUP_CHECKLIST = [
  'Camera ready?',
  'Upper body visible?',
  'Space to move?',
];

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: 'bg-emerald-500',
  Intermediate: 'bg-amber-500',
  Advanced: 'bg-red-500',
};

const DIFFICULTY_BORDER: Record<string, { border: string; hoverBorder: string; selectedBorder: string; color: string; dot: string }> = {
  Beginner: {
    border: 'border-emerald-600/30',
    hoverBorder: 'hover:border-emerald-600',
    selectedBorder: 'border-emerald-600',
    color: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  Intermediate: {
    border: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-600',
    selectedBorder: 'border-amber-600',
    color: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  Advanced: {
    border: 'border-red-500/30',
    hoverBorder: 'hover:border-red-600',
    selectedBorder: 'border-red-600',
    color: 'text-red-700',
    dot: 'bg-red-500',
  },
};

export default function CprBrief({ scenario, allScenarios, onSelectScenario, onStart, onBack }: CprBriefProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(SETUP_CHECKLIST.map(() => false));

  const toggleItem = (idx: number) => {
    setCheckedItems(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const SUMMARY_ITEMS = [
    {
      icon: User,
      label: 'Your Role',
      content: 'Respond to an adult collapse and maintain safe, steady CPR.',
    },
    {
      icon: Target,
      label: 'Scoring Criteria',
      content: 'You will be scored on rhythm, form, recoil, consistency, and CPR sequence.',
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="lg:col-span-12 flex h-full w-full items-start justify-center overflow-y-auto py-4 lg:overflow-hidden lg:py-0"
      >
        <div className="w-full max-w-6xl shrink-0 bg-white border border-[#141414] rounded-2xl shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden lg:max-h-[calc(100dvh-7.75rem)] lg:grid lg:grid-rows-[auto,1fr,auto]">
          {/* Header */}
          <div className="bg-[#141414] px-5 py-4 lg:px-6 lg:py-3.5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg lg:text-xl font-display font-bold uppercase tracking-[0.16em] text-[#E4E3E0]">
                Training Brief
              </h2>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#E4E3E0]/50 mt-1">
                Before you begin
              </p>
            </div>
            <div className={`${DIFFICULTY_COLOR[scenario.difficulty] ?? 'bg-gray-500'} shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white`}>
              {scenario.difficulty}
            </div>
          </div>

          <div className="p-4 lg:p-3.5 grid gap-2.5 content-start lg:overflow-hidden">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase opacity-50 tracking-[0.18em]">
                Select Scenario
              </span>
              <div className="grid gap-2 lg:grid-cols-3">
                {allScenarios.map((s) => {
                  const meta = DIFFICULTY_BORDER[s.difficulty] ?? DIFFICULTY_BORDER.Beginner;
                  const isSelected = s.id === scenario.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelectScenario(s.id)}
                      className={`text-left p-3 border-2 rounded-2xl transition-all hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)] ${
                        isSelected
                          ? `${meta.selectedBorder} bg-white`
                          : `${meta.border} bg-white ${meta.hoverBorder}`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] border ${meta.border} ${meta.color}`}>
                          <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} />
                          {s.difficulty}
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-[0.16em] opacity-40">
                          {s.trainingMode === 'CONVENTIONAL_30_2' ? '30:2' : 'Hands-Only'}
                        </span>
                      </div>
                      <p className="text-sm font-bold font-display mt-2 leading-tight">{s.title}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Scenario — full-width, prominent */}
            <div className="rounded-xl border-2 border-[#141414]/15 bg-[#141414]/[0.02] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase opacity-50 tracking-[0.18em]">
                    Selected Scenario
                  </span>
                  <h3 className="mt-1.5 text-xl font-display font-bold uppercase tracking-tight leading-tight">{scenario.title}</h3>
                </div>
                <span className="text-[10px] font-mono uppercase opacity-40 tracking-[0.16em] shrink-0 mt-1">
                  {scenario.trainingMode === 'CONVENTIONAL_30_2' ? '30:2' : 'Hands-Only'}
                </span>
              </div>
              <p className="text-sm leading-relaxed mt-2 opacity-70">
                {scenario.background}
              </p>
            </div>

            {/* Info cards — 2x2 grid with equal height rows, then checklist */}
            <div className="grid gap-2.5 lg:grid-cols-2">
              {[
                { icon: FileText, label: 'First Priorities', type: 'tags' as const },
                ...SUMMARY_ITEMS.map(s => ({ ...s, type: 'text' as const })),
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * idx, duration: 0.3 }}
                    className="flex items-start gap-3 p-3 border border-[#141414]/10 rounded-xl bg-[#141414]/[0.02] min-h-[72px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#141414] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#E4E3E0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono uppercase opacity-50 tracking-[0.18em]">
                        {item.label}
                      </span>
                      {item.type === 'tags' ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {scenario.requiredFirstSteps.slice(0, 3).map((step) => (
                            <span key={step} className="inline-flex items-center rounded-full border border-[#141414]/15 bg-white px-2.5 py-0.5 text-[11px] font-bold">
                              {step}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px] font-medium mt-1 leading-relaxed">
                          {'content' in item ? item.content : ''}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Setup Checklist — accent border + progress counter */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="flex items-start gap-3 p-3 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/50 min-h-[72px]"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700/60">
                      Setup Checklist
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {checkedItems.filter(Boolean).length}/{SETUP_CHECKLIST.length}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {SETUP_CHECKLIST.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleItem(idx)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all ${
                          checkedItems[idx]
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white text-[#141414] border-emerald-500/25 hover:border-emerald-500/60'
                        }`}
                      >
                        <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px] ${
                          checkedItems[idx] ? 'border-white/60' : 'border-emerald-500/40'
                        }`}>
                          {checkedItems[idx] ? '✓' : ''}
                        </span>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 pt-0 lg:px-5 lg:pb-5 flex items-center justify-between gap-4 border-t border-[#141414]/10 bg-white">
            <BackActionButton label="Back to Modules" onClick={onBack} />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVideoModal(true)}
                className="flex items-center gap-2 border border-[#141414] px-5 lg:px-6 py-3 rounded-xl font-bold uppercase tracking-[0.16em] text-sm hover:bg-[#141414]/5 transition-all"
              >
                <Video className="w-4 h-4" /> Watch Technique Demo
              </button>
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={onStart}
                className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 lg:px-8 py-3 rounded-xl font-bold uppercase tracking-[0.16em] hover:bg-[#141414]/90 transition-all shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-sm"
              >
                Begin Session <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <DemoVideoModal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} />
    </>
  );
}
