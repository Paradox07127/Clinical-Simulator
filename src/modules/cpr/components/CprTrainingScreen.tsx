import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Mic, MicOff, Play, RefreshCw, Square, Volume2, VolumeX, Timer } from 'lucide-react';
import type { ModuleScreenProps } from '../../../platform/types';
import type { CprPhase } from '../types';
import MotionGraph from './MotionGraph';
import CprLoadingScreen from './CprLoadingScreen';
import CameraSetupGuide from './CameraSetupGuide';
import DemoVideoModal from './DemoVideoModal';
import ActionStatusCard from './ActionStatusCard';
import PhaseGuideOverlay from './PhaseGuideOverlay';
import CprBrief from './CprBrief';
import EvaluationReport from './EvaluationReport';
import InlineConfirm from './InlineConfirm';
import { saveCprResult } from '../../../platform/storage/sessionStore';
import { useCprSession } from '../hooks/useCprSession';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useCompressionAnalysis } from '../hooks/useCompressionAnalysis';
import { useMetronome } from '../hooks/useMetronome';
import { useVoiceCoach } from '../hooks/useVoiceCoach';

/** BLS phase ordering for CONVENTIONAL_30_2 auto-advance */
const BLS_ADVANCE_MAP: Partial<Record<CprPhase, CprPhase>> = {
  SCENE_SAFETY: 'CHECK_RESPONSE',
  CHECK_RESPONSE: 'CALL_FOR_HELP',
  CALL_FOR_HELP: 'CHECK_BREATHING',
  CHECK_BREATHING: 'COMPRESSIONS',
  AED_PROMPT: 'COMPRESSIONS',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CprTrainingScreen({ onBack, registerGlobalBackHandler }: ModuleScreenProps) {
  const { t } = useTranslation();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>(undefined);
  const {
    scenario, sessionState, lastDecision, evaluation, feedback,
    ventilationBreathCount,
    ingestObservation, finalizeSession, resetSession,
    advancePhase, confirmVentilation, confirmPhaseAdvance,
    allScenarios,
  } = useCprSession(selectedScenarioId);

  const { videoRef, canvasRef, isModelLoaded, isStreaming, landmarks, cameraError, startCamera, stopCamera } = usePoseDetection();
  const { observation, wristHistory, peakTimestamps, processLandmarks, reset: resetAnalysis } = useCompressionAnalysis();
  const {
    isPlaying: isMetronomePlaying,
    toggle: toggleMetronome,
    stop: stopMetronome,
  } = useMetronome();
  const {
    isEnabled: isVoiceEnabled,
    speak: speakVoiceCoach,
    toggle: toggleVoiceCoach,
    stop: stopVoiceCoach,
  } = useVoiceCoach();

  const [showBrief, setShowBrief] = useState(true);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMotionGraph, setShowMotionGraph] = useState(true);
  const [beginnerMode, setBeginnerMode] = useState(() => localStorage.getItem('beginner_mode') === 'true');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const getDiffLabel = (d: string) => d === 'Beginner' ? t('cpr.beginner') : d === 'Intermediate' ? t('cpr.intermediate') : t('cpr.advanced');

  // Derived state
  const trainingMode = scenario.trainingMode ?? 'HANDS_ONLY';
  const currentPhase = sessionState?.currentPhase ?? 'BRIEFING';
  const currentRate = sessionState?.currentRate ?? 0;
  const compressionCount = peakTimestamps.length;
  const elapsedSeconds = sessionState?.elapsedSeconds ?? 0;
  const showCompleted = !!(feedback && evaluation);
  const isActiveTraining = isStreaming && !showCompleted;

  // --- Effects ---
  useEffect(() => { if (landmarks && isStreaming) processLandmarks(landmarks, performance.now()); }, [landmarks, isStreaming, processLandmarks]);
  useEffect(() => { if (observation) ingestObservation(observation); }, [observation, ingestObservation]);
  useEffect(() => { if (isStreaming && lastDecision?.message) speakVoiceCoach(lastDecision.message); }, [isStreaming, lastDecision?.message, speakVoiceCoach]);
  useEffect(() => { if (!isStreaming) stopMetronome(); }, [isStreaming, stopMetronome]);

  useEffect(() => {
    if (beginnerMode && isStreaming) {
      if (!isVoiceEnabled) toggleVoiceCoach();
      if (!isMetronomePlaying) toggleMetronome();
    }
  }, [beginnerMode, isStreaming, isVoiceEnabled, toggleVoiceCoach, isMetronomePlaying, toggleMetronome]);

  useEffect(() => {
    if (evaluation && feedback) {
      saveCprResult(scenario.title, evaluation.totalScore, feedback.headline);
    }
  }, [evaluation, feedback, scenario.title]);

  // --- Callbacks ---
  const toggleBeginner = () => {
    setBeginnerMode((prev) => {
      const next = !prev;
      localStorage.setItem('beginner_mode', String(next));
      return next;
    });
  };

  const resetTracking = useCallback(() => { resetAnalysis(); resetSession(); }, [resetAnalysis, resetSession]);

  const handleStartTraining = useCallback(async () => {
    if (!isModelLoaded || isStartingCamera) return;
    setIsStartingCamera(true);
    resetTracking();
    const didStart = await startCamera();
    setIsStartingCamera(false);
    if (!didStart) return;
    setShowSetupGuide(true);
    if ((scenario.trainingMode ?? 'HANDS_ONLY') === 'CONVENTIONAL_30_2') {
      advancePhase('SCENE_SAFETY');
    }
  }, [isModelLoaded, isStartingCamera, resetTracking, startCamera, scenario.trainingMode, advancePhase]);

  const handleSetupReady = useCallback(() => setShowSetupGuide(false), []);

  const handleStopTraining = useCallback(() => {
    finalizeSession(); stopVoiceCoach(); stopMetronome(); stopCamera();
    setIsStartingCamera(false); setShowSetupGuide(false);
  }, [finalizeSession, stopVoiceCoach, stopMetronome, stopCamera]);

  const handleNewSession = useCallback(() => {
    resetTracking(); setIsStartingCamera(false); setShowSetupGuide(false); setShowBrief(true);
  }, [resetTracking]);

  const handleRetrySession = useCallback(() => {
    resetTracking(); setIsStartingCamera(false); setShowSetupGuide(false); setShowBrief(true);
  }, [resetTracking]);

  const handlePhaseConfirm = useCallback(() => {
    if (currentPhase === 'VENTILATION') { confirmVentilation(); return; }
    if (currentPhase === 'CYCLE_BREAK') { confirmPhaseAdvance(); return; }
    const nextPhase = BLS_ADVANCE_MAP[currentPhase];
    if (nextPhase) advancePhase(nextPhase);
  }, [currentPhase, advancePhase, confirmVentilation, confirmPhaseAdvance]);

  const handleBack = useCallback(() => {
    if (isStreaming) { setShowExitConfirm(true); return; }
    onBack();
  }, [isStreaming, onBack]);

  const confirmExit = useCallback(() => {
    setShowExitConfirm(false);
    handleStopTraining();
    onBack();
  }, [handleStopTraining, onBack]);

  useEffect(() => {
    registerGlobalBackHandler?.(handleBack);
    return () => registerGlobalBackHandler?.(null);
  }, [handleBack, registerGlobalBackHandler]);

  // ===== BRIEF PHASE (early return — no video needed) =====
  if (showBrief) {
    return (
      <AnimatePresence mode="wait">
        <CprBrief
          scenario={scenario}
          allScenarios={allScenarios}
          onSelectScenario={setSelectedScenarioId}
          onStart={() => setShowBrief(false)}
          onBack={onBack}
        />
      </AnimatePresence>
    );
  }

  // ===== SINGLE RETURN: pre-training, active training, and evaluation all share video/canvas =====
  const checklist = sessionState?.checklist ?? scenario.requiredFirstSteps.map((label, i) => ({
    id: String(i), label, completed: false, detail: 'Pending',
  }));

  const cycleStats = currentPhase === 'CYCLE_BREAK' ? {
    cycleNumber: sessionState?.currentCycle ?? 1,
    compressionCount: sessionState?.compressionCount ?? 0,
    averageRate: sessionState?.averageRate ?? 0,
  } : undefined;

  return (
    <>
      {/* ===== EVALUATION: full-width centered ===== */}
      {showCompleted && (
        <div className="lg:col-span-12 flex justify-center">
          <div className="w-full max-w-4xl">
            <EvaluationReport
              evaluation={evaluation!}
              feedback={feedback!}
              onNewSession={handleNewSession}
              onRetrySession={handleRetrySession}
            />
          </div>
        </div>
      )}

      {/* ===== LEFT COLUMN — 3 cols (hidden during evaluation) ===== */}
      {!showCompleted && (
      <div className="lg:col-span-3 space-y-3 overflow-y-auto max-h-[calc(100dvh-7rem)]">

        {/* Exit confirm banner */}
        <InlineConfirm
          message={t('cpr.exitWarning')}
          isVisible={showExitConfirm}
          onConfirm={confirmExit}
          onCancel={() => setShowExitConfirm(false)}
          confirmLabel={t('common.exit')}
          cancelLabel={t('common.stay')}
          variant="danger"
        />

        {/* --- Active training: ActionStatusCard + checklist + controls + graph --- */}
        {isActiveTraining && (
          <>
            <ActionStatusCard
              sessionState={sessionState}
              decision={lastDecision}
              compressionCount={compressionCount}
            />

            <div className="bg-white border border-[#141414] rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">{t('cpr.checklist')}</div>
              <div className="space-y-1">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-[11px]">
                    <span className={item.completed ? 'text-emerald-500' : 'opacity-25'}>●</span>
                    <span className={item.completed ? 'font-medium' : 'opacity-45'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-[#141414] bg-white p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-50">{t('cpr.controls')}</div>
              <button
                onClick={handleStopTraining}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500 bg-red-500 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white"
              >
                <Square className="w-3.5 h-3.5" /> {t('cpr.stopSession')}
              </button>
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={toggleMetronome} className="flex items-center justify-center gap-1 rounded-lg border border-[#141414]/20 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider hover:border-[#141414]/50">
                  {isMetronomePlaying ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3 opacity-40" />}
                </button>
                <button onClick={toggleVoiceCoach} className="flex items-center justify-center gap-1 rounded-lg border border-[#141414]/20 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider hover:border-[#141414]/50">
                  {isVoiceEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 opacity-40" />}
                </button>
                <button onClick={resetTracking} className="flex items-center justify-center gap-1 rounded-lg border border-[#141414]/20 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider hover:border-[#141414]/50">
                  <RefreshCw className="w-3 h-3 opacity-60" />
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#141414] rounded-2xl shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
              <button
                onClick={() => setShowMotionGraph(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest opacity-50 hover:opacity-80"
              >
                <span>{t('cpr.motionGraph')}</span>
                {showMotionGraph ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {showMotionGraph && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MotionGraph data={wristHistory} peaks={peakTimestamps} currentRate={currentRate} compressionCount={compressionCount} compact />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* --- Pre-training: scenario info + start button --- */}
        {!isActiveTraining && !showCompleted && (
          <div className="relative">
            <AnimatePresence>
              {!isModelLoaded && <CprLoadingScreen />}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3 rounded-2xl border border-[#141414] bg-white p-5 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">{t('cpr.scenario')}</p>
                  <h2 className="mt-1 text-base font-display font-bold uppercase tracking-tight">{scenario.title}</h2>
                  <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] opacity-45">
                    {trainingMode === 'CONVENTIONAL_30_2' ? t('cpr.guided302') : t('cpr.handsOnly')}
                  </p>
                </div>
                <div className={`shrink-0 rounded-full ${scenario.difficulty === 'Beginner' ? 'bg-emerald-500' : scenario.difficulty === 'Intermediate' ? 'bg-amber-500' : 'bg-red-500'} px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white`}>
                  {getDiffLabel(scenario.difficulty)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest opacity-50">{t('cpr.checklist')}</div>
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-[11px]">
                    <span className={item.completed ? 'text-emerald-500' : 'opacity-25'}>●</span>
                    <span className={item.completed ? 'font-medium' : 'opacity-45'}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#141414]/10 pt-3 space-y-2">
                <button
                  onClick={() => void handleStartTraining()}
                  disabled={!isModelLoaded || isStartingCamera}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#141414] px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-[#E4E3E0] transition-colors disabled:opacity-40"
                >
                  <Play className="w-4 h-4" /> {isStartingCamera ? t('cpr.startingCamera') : t('common.startTraining')}
                </button>
                {cameraError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
                    {cameraError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={toggleMetronome} className="flex items-center justify-center gap-1 rounded-xl border border-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-widest">
                    {isMetronomePlaying ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />} {t('cpr.beat')}
                  </button>
                  <button onClick={toggleVoiceCoach} className="flex items-center justify-center gap-1 rounded-xl border border-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-widest">
                    {isVoiceEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />} {t('cpr.voiceLabel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      )}

      {/* ===== RIGHT COLUMN — 9 cols: video/canvas (hidden during evaluation) ===== */}
      {!showCompleted && (
      <div className="lg:col-span-9 space-y-4">
          <div className={`relative overflow-hidden rounded-2xl border border-[#141414] bg-white shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] ${isActiveTraining ? 'h-[calc(100dvh-7rem)]' : 'h-[calc(100dvh-14rem)]'}`}>
            {/* SINGLE video + canvas — never remounted across layout switches */}
            <video ref={videoRef} className="hidden" playsInline muted />
            <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-cover bg-[#141414]" />

            {/* Camera setup guide */}
            <AnimatePresence>
              {showSetupGuide && (
                <CameraSetupGuide landmarks={landmarks} onReady={handleSetupReady} />
              )}
            </AnimatePresence>

            {/* BLS Phase Guide Overlay */}
            {isActiveTraining && (
              <PhaseGuideOverlay
                currentPhase={currentPhase}
                trainingMode={trainingMode}
                onConfirm={handlePhaseConfirm}
                ventilationBreathCount={ventilationBreathCount}
                cycleStats={cycleStats}
              />
            )}

            {/* Camera overlay: timer + count + instruction (only during COMPRESSIONS) */}
            {isActiveTraining && currentPhase === 'COMPRESSIONS' && (
              <>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg">
                  <Timer className="w-3.5 h-3.5 opacity-70" />
                  <span className="text-sm font-mono font-bold">{formatTime(elapsedSeconds)}</span>
                </div>
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-mono font-bold">#{compressionCount}</span>
                  <span className="text-[9px] ml-1 opacity-50">{t('cpr.compressions')}</span>
                </div>
                {lastDecision?.message && (
                  <motion.div
                    key={lastDecision.message}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-center"
                  >
                    <span className="text-sm font-semibold">{lastDecision.message}</span>
                  </motion.div>
                )}
              </>
            )}

            {/* Pre-training placeholder (when camera not yet started) */}
            {!isStreaming && !showCompleted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-[#141414]/75 text-white">
                <HeartPulseIcon className="w-12 h-12 mb-3" />
                <p className="text-base font-semibold">{isModelLoaded ? t('cpr.poseReady') : t('cpr.poseLoading')}</p>
                <p className="text-xs opacity-70 mt-1">
                  {cameraError ? t('cpr.cameraError') : t('cpr.upperBodyNote')}
                </p>
              </motion.div>
            )}
          </div>
      </div>
      )}

      <DemoVideoModal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} />
    </>
  );
}

function HeartPulseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
