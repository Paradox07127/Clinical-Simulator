import { motion, AnimatePresence } from 'motion/react';
import { Shield, Hand, Phone, Wind, HeartPulse, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { CprPhase, CprTrainingMode } from '../types';

interface PhaseGuideOverlayProps {
  currentPhase: CprPhase;
  trainingMode: CprTrainingMode;
  onConfirm: () => void;
  /** For ventilation: how many breaths confirmed so far (0, 1, or 2) */
  ventilationBreathCount?: number;
  /** Cycle stats to show during CYCLE_BREAK */
  cycleStats?: {
    cycleNumber: number;
    compressionCount: number;
    averageRate: number;
  };
}

interface PhaseConfig {
  icon: typeof Shield;
  step: string;
  title: string;
  instruction: string;
  detail?: string;
  buttonLabel: string;
  accent: string;
}

const PHASE_CONFIGS: Partial<Record<CprPhase, PhaseConfig>> = {
  SCENE_SAFETY: {
    icon: Shield,
    step: 'Step 1',
    title: 'Scene Safety',
    instruction: 'Look around for hazards. Is the scene safe to approach?',
    detail: 'Check for traffic, fire, electrical hazards, or other dangers before approaching the victim.',
    buttonLabel: 'Scene is Safe',
    accent: 'border-[#0d9488]/20 bg-[#0d9488]/10 text-[#0d9488]',
  },
  CHECK_RESPONSE: {
    icon: Hand,
    step: 'Step 2',
    title: 'Check Responsiveness',
    instruction: 'Tap the victim on the shoulder and shout "Are you okay?"',
    detail: 'Tap firmly on both shoulders. Shout clearly. Wait a few seconds for any response.',
    buttonLabel: 'No Response',
    accent: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  },
  CALL_FOR_HELP: {
    icon: Phone,
    step: 'Step 3',
    title: 'Call 911',
    instruction: 'Call 911 or direct a bystander to call. Request an AED.',
    detail: 'If alone, put phone on speaker. Tell the dispatcher your location and that someone is unresponsive.',
    buttonLabel: 'Help Called',
    accent: 'border-red-500/20 bg-red-500/10 text-red-600',
  },
  CHECK_BREATHING: {
    icon: Wind,
    step: 'Step 4',
    title: 'Check Breathing',
    instruction: 'Look, listen, and feel for breathing (max 10 seconds).',
    detail: 'Look for chest rise, listen for breath sounds, feel for air on your cheek. Gasping is NOT normal breathing.',
    buttonLabel: 'Not Breathing',
    accent: 'border-[#141414]/15 bg-[#141414]/[0.05] text-[#141414]',
  },
  VENTILATION: {
    icon: Wind,
    step: 'Breaths',
    title: 'Rescue Breaths',
    instruction: 'Tilt the head, lift the chin, and deliver rescue breaths.',
    detail: 'Pinch the nose, seal your mouth over theirs, and give 1 breath over 1 second. Watch for chest rise.',
    buttonLabel: 'Breath Delivered',
    accent: 'border-[#0d9488]/20 bg-[#0d9488]/10 text-[#0d9488]',
  },
  CYCLE_BREAK: {
    icon: RefreshCw,
    step: 'Cycle Break',
    title: 'Switch Rescuers',
    instruction: 'You have been compressing for 2 minutes. Switch with another rescuer if available.',
    detail: 'Complete the switch in under 10 seconds to minimize interruptions.',
    buttonLabel: 'Resume Compressions',
    accent: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  },
  AED_PROMPT: {
    icon: Zap,
    step: 'AED',
    title: 'AED Arrived',
    instruction: 'Turn on the AED and follow the voice prompts.',
    detail: 'Attach pads to bare chest. Ensure no one is touching the patient during analysis.',
    buttonLabel: 'AED Applied',
    accent: 'border-red-500/20 bg-red-500/10 text-red-600',
  },
};

/** Phases that should show the overlay */
const OVERLAY_PHASES: CprPhase[] = [
  'SCENE_SAFETY',
  'CHECK_RESPONSE',
  'CALL_FOR_HELP',
  'CHECK_BREATHING',
  'VENTILATION',
  'CYCLE_BREAK',
  'AED_PROMPT',
];

export default function PhaseGuideOverlay({
  currentPhase,
  trainingMode,
  onConfirm,
  ventilationBreathCount = 0,
  cycleStats,
}: PhaseGuideOverlayProps) {
  const shouldShow = OVERLAY_PHASES.includes(currentPhase);
  const config = PHASE_CONFIGS[currentPhase];

  // Don't show BLS overlays for HANDS_ONLY mode (including CYCLE_BREAK which is skipped)
  if (trainingMode === 'HANDS_ONLY' && ['SCENE_SAFETY', 'CHECK_RESPONSE', 'CALL_FOR_HELP', 'CHECK_BREATHING', 'VENTILATION', 'CYCLE_BREAK', 'AED_PROMPT'].includes(currentPhase)) {
    return null;
  }

  return (
    <AnimatePresence>
      {shouldShow && config && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-20 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[#141414]/72 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ delay: 0.1 }}
            className="relative z-10 mx-6 w-full max-w-lg rounded-2xl border border-[#141414] bg-[#E4E3E0] p-6 text-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 text-left">
                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${config.accent}`}>
                  {config.step}
                </span>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#141414] text-[#E4E3E0]">
                    <config.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold uppercase tracking-[0.14em]">
                      {config.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-relaxed opacity-80">
                      {config.instruction}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {config.detail && (
              <div className="mt-4 rounded-xl border border-[#141414]/10 bg-white px-4 py-3 text-left text-sm leading-relaxed opacity-70">
                {config.detail}
              </div>
            )}

            {/* Ventilation breath progress */}
            {currentPhase === 'VENTILATION' && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <div className={`flex items-center gap-1.5 ${ventilationBreathCount >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Breath 1</span>
                </div>
                <div className={`flex items-center gap-1.5 ${ventilationBreathCount >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Breath 2</span>
                </div>
              </div>
            )}

            {/* Cycle break stats */}
            {currentPhase === 'CYCLE_BREAK' && cycleStats && (
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold">{cycleStats.compressionCount}</div>
                  <div className="text-[10px] uppercase opacity-50">Compressions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{cycleStats.averageRate}</div>
                  <div className="text-[10px] uppercase opacity-50">Avg CPM</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">Cycle {cycleStats.cycleNumber}</div>
                  <div className="text-[10px] uppercase opacity-50">Completed</div>
                </div>
              </div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={onConfirm}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#141414] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.16em] text-[#E4E3E0] transition-all hover:bg-[#141414]/90 active:scale-95"
            >
              {currentPhase === 'VENTILATION'
                ? ventilationBreathCount >= 1
                  ? 'Breath 2 Done'
                  : 'Breath 1 Done'
                : config.buttonLabel}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
