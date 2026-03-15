import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

type StripPhase = 'BRIEF' | 'HISTORY_TAKING' | 'GUIDED_INQUIRY' | 'DIAGNOSIS_READY' | 'REVIEW';

interface InterviewProgressStripProps {
  currentPhase: StripPhase;
}

const PHASES: { key: StripPhase; label: string }[] = [
  { key: 'BRIEF', label: 'Brief' },
  { key: 'HISTORY_TAKING', label: 'History' },
  { key: 'GUIDED_INQUIRY', label: 'Inquiry' },
  { key: 'DIAGNOSIS_READY', label: 'Diagnosis' },
  { key: 'REVIEW', label: 'Review' },
];

export default function InterviewProgressStrip({ currentPhase }: InterviewProgressStripProps) {
  const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);

  return (
    <div className="flex min-h-[54px] w-full items-center justify-center">
      <div className="flex w-full items-start">
        {PHASES.map((phase, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={phase.key}>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                {isCompleted ? (
                  <div className="w-4 h-4 rounded-full bg-[#0d9488] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <motion.div
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                      isCurrent
                        ? 'bg-[#141414] border-[#141414]'
                        : 'bg-transparent border-[#141414]/30'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                    transition={isCurrent ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' } : {}}
                  />
                )}
                <span
                  className={`text-[9px] font-mono uppercase tracking-wider whitespace-nowrap ${
                    isCurrent ? 'font-bold opacity-100' : isCompleted ? 'font-medium text-[#0d9488]' : 'opacity-30'
                  }`}
                >
                  {phase.label}
                </span>
              </div>

              {idx < PHASES.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-1.5 rounded-full transition-colors ${
                    idx < currentIndex ? 'bg-[#0d9488]' : 'bg-[#141414]/15'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
