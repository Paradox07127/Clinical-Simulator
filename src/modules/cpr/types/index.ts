import type { BaseTrainingSession } from '../../../platform/types';

// ---------------------------------------------------------------------------
// Phase enums & small types
// ---------------------------------------------------------------------------

export type CprPhase =
  | 'BRIEFING'           // Scenario presented, not started
  | 'SCENE_SAFETY'       // Trainee confirms scene safety
  | 'CHECK_RESPONSE'     // Tap and shout
  | 'CALL_FOR_HELP'      // Call 911 / get AED
  | 'CHECK_BREATHING'    // Look-listen-feel, max 10 seconds
  | 'COMPRESSIONS'       // Active chest compressions
  | 'VENTILATION'        // Rescue breaths (conventional CPR only)
  | 'AED_PROMPT'         // AED arrival simulation
  | 'CYCLE_BREAK'        // 2-minute rescuer switch
  | 'ASSESSMENT'         // Session evaluation
  | 'COMPLETED';         // Results displayed

export type CprTrainingMode = 'HANDS_ONLY' | 'CONVENTIONAL_30_2';

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

export interface CprScenario {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  emergencyType: string;
  background: string;
  requiredFirstSteps: string[];
  commonMistakes: string[];
  escalationConditions: string[];
  targetCompressionRate: {
    min: number;
    max: number;
  };
  /** Training mode for this scenario. Defaults to 'HANDS_ONLY' for backward compat. */
  trainingMode?: CprTrainingMode;
}

// ---------------------------------------------------------------------------
// Rubric
// ---------------------------------------------------------------------------

export interface CprRubric {
  weights: {
    rhythm: number;
    form: number;
    readiness: number;
    /** New Phase-3 dimensions (optional for backward compat) */
    depthProxy?: number;
    recoil?: number;
    compressionFraction?: number;
    rateConsistency?: number;
  };
  thresholds: {
    visibleRatio: number;
    straightArmRatio: number;
    centeredRatio: number;
  };
}

// ---------------------------------------------------------------------------
// Observation (per-frame data coming from pose detection)
// ---------------------------------------------------------------------------

export interface CprObservation {
  timestamp: number;
  compressionRate: number;
  wristY?: number;
  shoulderWidth?: number;
  handsVisible: boolean;
  armsStraight: boolean;
  handsCentered: boolean;
  /** Phase 2: whether wrist Y returned to baseline between peaks */
  recoilComplete?: boolean;
  /** Phase 2: peak-to-valley displacement normalized by shoulder width (0-1) */
  depthProxy?: number;
  /** Phase 2: average wrist visibility score for tracking confidence (0-1) */
  trackingConfidence?: number;
  /** Peak timestamps (ms) detected in this frame's analysis window */
  peakTimestamps?: number[];
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

export interface CprChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  detail: string;
}

// ---------------------------------------------------------------------------
// Per-cycle stats
// ---------------------------------------------------------------------------

export interface CprCycleStats {
  cycleNumber: number;
  averageRate: number;
  rateConsistency: number;
  compressionCount: number;
  durationSeconds: number;
}

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

export interface CprSessionState extends BaseTrainingSession {
  module: 'CPR';
  scenarioId: string;
  /** Expanded phase state machine */
  currentPhase: CprPhase;
  currentRate: number;
  averageRate: number;
  maxRate: number;
  elapsedSeconds: number;
  checklist: CprChecklistItem[];
  visibleRatio: number;
  straightArmRatio: number;
  centeredRatio: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  observations: CprObservation[];

  // Phase 3 additions
  /** Training mode of the active scenario */
  trainingMode?: CprTrainingMode;
  /** Current 2-minute cycle number (1-based) */
  currentCycle?: number;
  /** History of completed cycles */
  cycleHistory?: CprCycleStats[];
  /** Ratio of time actively compressing vs total elapsed time */
  compressionFraction?: number;
  /** Rate consistency (0-100, 100 = perfectly consistent) */
  rateConsistency?: number;
  /** Ratio of compressions with successful recoil */
  recoilRatio?: number;
  /** Running average of the depth proxy metric */
  depthProxyAverage?: number;
  /** Total compressions in current active period */
  compressionCount?: number;
}

// ---------------------------------------------------------------------------
// Decision
// ---------------------------------------------------------------------------

export interface CprDecision {
  message: string;
  rhythmStatus: 'WAITING' | 'SLOW' | 'GOOD' | 'FAST';
  formStatus: 'READY' | 'HANDS_HIDDEN' | 'ARMS_BENT' | 'OFF_CENTER' | 'GOOD';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  canEvaluate: boolean;
  /** Step-by-step guidance text for the current BLS phase */
  phaseInstruction?: string;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export interface CprScoreBreakdown {
  rhythm: number;
  form: number;
  readiness: number;
  /** Phase 3 scoring dimensions */
  depthProxy?: number;
  recoil?: number;
  compressionFraction?: number;
  rateConsistency?: number;
}

export interface CprEvaluation {
  totalScore: number;
  breakdown: CprScoreBreakdown;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
}
