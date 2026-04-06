import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { CprPhase, CprTrainingMode } from '../types';

interface TrainingStatusStripProps {
  currentPhase: CprPhase;
  trainingMode?: CprTrainingMode;
  isModelLoaded: boolean;
  isStreaming: boolean;
  showCompleted?: boolean;
}

interface PhaseStep {
  key: string;
  label: string;
}

const HANDS_ONLY_PHASES: PhaseStep[] = [
  { key: 'BRIEFING', label: '简报' },
  { key: 'SETUP', label: '准备' },
  { key: 'COMPRESSIONS', label: '按压' },
  { key: 'COMPLETED', label: '结果' },
];

const BLS_PHASES: PhaseStep[] = [
  { key: 'BRIEFING', label: '简报' },
  { key: 'SCENE_SAFETY', label: '现场安全' },
  { key: 'CHECK_RESPONSE', label: '检查意识' },
  { key: 'CALL_FOR_HELP', label: '呼叫 120' },
  { key: 'CHECK_BREATHING', label: '检查呼吸' },
  { key: 'COMPRESSIONS', label: 'CPR' },
  { key: 'COMPLETED', label: '结果' },
];

/** Map CprPhase to the phase key used in the strip */
function mapPhaseToStripKey(
  cprPhase: CprPhase,
  trainingMode: CprTrainingMode,
  isModelLoaded: boolean,
  isStreaming: boolean,
  showCompleted: boolean,
): string {
  if (showCompleted) return 'COMPLETED';

  // For HANDS_ONLY, map internal phases to simpler strip
  if (trainingMode === 'HANDS_ONLY') {
    if (cprPhase === 'COMPLETED' || cprPhase === 'ASSESSMENT') return 'COMPLETED';
    if (cprPhase === 'COMPRESSIONS' || cprPhase === 'CYCLE_BREAK') return 'COMPRESSIONS';
    // Show SETUP when model is loaded but not yet compressing
    if (isModelLoaded && cprPhase === 'BRIEFING') return 'SETUP';
    if (isStreaming && cprPhase === 'BRIEFING') return 'SETUP';
    return 'BRIEFING';
  }

  // For BLS 30:2, show sub-phases
  if (cprPhase === 'COMPLETED' || cprPhase === 'ASSESSMENT') return 'COMPLETED';
  if (cprPhase === 'VENTILATION' || cprPhase === 'CYCLE_BREAK') return 'COMPRESSIONS';
  return cprPhase;
}

export default function TrainingStatusStrip({
  currentPhase,
  trainingMode = 'HANDS_ONLY',
  isModelLoaded,
  isStreaming,
  showCompleted = false,
}: TrainingStatusStripProps) {
  const phases = trainingMode === 'CONVENTIONAL_30_2' ? BLS_PHASES : HANDS_ONLY_PHASES;
  const activeKey = mapPhaseToStripKey(currentPhase, trainingMode, isModelLoaded, isStreaming, showCompleted);
  const currentIndex = phases.findIndex((p) => p.key === activeKey);

  return (
    <div className="flex min-h-[54px] w-full items-center justify-center">
      <div className="flex w-full items-start">
        {phases.map((phase, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <React.Fragment key={phase.key}>
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                {isCompleted ? (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0d9488]">
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <motion.div
                    className={`h-3.5 w-3.5 rounded-full border-2 transition-colors ${
                      isCurrent
                        ? 'border-[#141414] bg-[#141414]'
                        : 'border-[#141414]/30 bg-transparent'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                    transition={isCurrent ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' } : {}}
                  />
                )}
                <span
                  className={`whitespace-nowrap text-[11px] font-sans tracking-wide ${
                    isCurrent ? 'font-bold opacity-100' : isCompleted ? 'font-medium text-[#0d9488]' : 'opacity-30'
                  }`}
                >
                  {phase.label}
                </span>
              </div>

              {idx < phases.length - 1 && (
                <div
                  className={`mx-1.5 h-[2px] flex-1 rounded-full ${
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
