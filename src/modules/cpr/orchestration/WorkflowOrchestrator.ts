import { loadCprRubric } from '../data/RubricRepository';
import { evaluateCprSession } from '../evaluation/RubricEngine';
import { SessionStateTracker } from '../tracking/SessionStateTracker';
import type {
  CprDecision,
  CprEvaluation,
  CprObservation,
  CprPhase,
  CprScenario,
  CprSessionState,
  CprTrainingMode,
} from '../types';
import { DecisionEngine } from './DecisionEngine';

/** Number of compressions before switching to ventilation in 30:2 mode */
const COMPRESSIONS_PER_CYCLE_30_2 = 30;

export class WorkflowOrchestrator {
  private readonly tracker: SessionStateTracker;
  private readonly decisionEngine = new DecisionEngine();
  private readonly trainingMode: CprTrainingMode;
  private ventilationBreathCount = 0;

  constructor(private readonly scenario: CprScenario) {
    this.tracker = new SessionStateTracker(scenario);
    this.trainingMode = scenario.trainingMode ?? 'HANDS_ONLY';
  }

  reset(): void {
    this.tracker.reset();
    this.ventilationBreathCount = 0;
  }

  /** Allow external code (UI) to advance the BLS phase */
  advancePhase(phase: CprPhase): void {
    this.tracker.setPhase(phase);
  }

  /** Get the current phase */
  getCurrentPhase(): CprPhase {
    return this.tracker.getPhase();
  }

  /** Get the latest session state directly (not dependent on React render cycle) */
  getLatestState(): CprSessionState | null {
    return this.tracker.getLatestState();
  }

  /** Get the current ventilation breath count */
  getVentilationBreathCount(): number {
    return this.ventilationBreathCount;
  }

  ingest(observation: CprObservation): { state: CprSessionState; decision: CprDecision } {
    const state = this.tracker.track(observation);

    // --- Phase 3.3: 2-minute cycle break (skip for HANDS_ONLY / Beginner) ---
    if (this.trainingMode === 'CONVENTIONAL_30_2' && this.tracker.isCycleBreakDue() && state.currentPhase === 'COMPRESSIONS') {
      this.tracker.completeCycle();
      this.tracker.setPhase('CYCLE_BREAK');
      // Re-track to get updated state with new phase
      const updatedState = this.tracker.track(observation);
      const decision = this.decisionEngine.decide(updatedState);
      return { state: updatedState, decision };
    }

    // --- Phase 3.4: CONVENTIONAL_30_2 ventilation switching ---
    if (this.trainingMode === 'CONVENTIONAL_30_2' && state.currentPhase === 'COMPRESSIONS') {
      const compressionsSinceVent = this.tracker.getCompressionsSinceVentilation();
      if (compressionsSinceVent >= COMPRESSIONS_PER_CYCLE_30_2) {
        this.tracker.setPhase('VENTILATION');
        this.ventilationBreathCount = 0;
        const updatedState = this.tracker.track(observation);
        const decision = this.decisionEngine.decide(updatedState);
        return { state: updatedState, decision };
      }
    }

    const decision = this.decisionEngine.decide(state);
    return { state, decision };
  }

  /** Called by UI when the user confirms a ventilation breath */
  confirmVentilation(): void {
    this.ventilationBreathCount += 1;
    if (this.ventilationBreathCount >= 2) {
      this.tracker.resetCompressionsSinceVentilation();
      this.tracker.setPhase('COMPRESSIONS');
      this.ventilationBreathCount = 0;
    }
  }

  /** Called by UI when user confirms a phase advance (e.g., cycle break resume) */
  confirmPhaseAdvance(): void {
    const currentPhase = this.tracker.getPhase();
    if (currentPhase === 'CYCLE_BREAK') {
      this.tracker.setPhase('COMPRESSIONS');
    }
  }

  evaluate(state: CprSessionState): CprEvaluation {
    return evaluateCprSession(state, this.scenario, loadCprRubric());
  }
}
