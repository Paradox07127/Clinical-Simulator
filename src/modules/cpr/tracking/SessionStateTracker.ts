import type {
  CprCycleStats,
  CprObservation,
  CprPhase,
  CprScenario,
  CprSessionState,
  CprTrainingMode,
} from '../types';
import { ChecklistEngine } from './ChecklistEngine';

/** Duration in seconds for one compression cycle before cycle break */
const CYCLE_DURATION_SECONDS = 120;

export class SessionStateTracker {
  private readonly observations: CprObservation[] = [];
  private readonly checklistEngine: ChecklistEngine;
  private startedAt = Date.now();

  // Phase 3: cycle tracking
  private currentCycle = 1;
  private cycleHistory: CprCycleStats[] = [];
  private cycleStartTimestamp: number | null = null;
  private cycleCompressionCount = 0;
  private cycleRates: number[] = [];

  // Phase 2.4: compression fraction tracking (B2: based on peak recency, not smoothed rate)
  private totalCompressionTimeMs = 0;
  private lastCompressionTimestamp: number | null = null;
  private wasCompressing = false;

  // Phase 2.5: inter-compression intervals for rate consistency (B1: from actual peak timestamps)
  private interCompressionIntervals: number[] = [];

  // B1/B3: track last counted peak timestamp to detect new peaks
  private lastCountedPeakTimestamp = 0;

  // Phase 3: phase tracking
  private currentPhase: CprPhase = 'BRIEFING';
  private phaseAdvancedExternally = false;
  private lastState: CprSessionState | null = null;

  // Phase 3.4: training mode
  private trainingMode: CprTrainingMode;

  // Phase 3.4: conventional 30:2 tracking
  private compressionsSinceVentilation = 0;

  constructor(private readonly scenario: CprScenario) {
    this.checklistEngine = new ChecklistEngine(scenario);
    this.trainingMode = scenario.trainingMode ?? 'HANDS_ONLY';
  }

  reset(): void {
    this.observations.splice(0, this.observations.length);
    this.startedAt = Date.now();
    this.checklistEngine.reset();
    this.currentCycle = 1;
    this.cycleHistory = [];
    this.cycleStartTimestamp = null;
    this.cycleCompressionCount = 0;
    this.cycleRates = [];
    this.totalCompressionTimeMs = 0;
    this.lastCompressionTimestamp = null;
    this.wasCompressing = false;
    this.interCompressionIntervals = [];
    this.lastCountedPeakTimestamp = 0;
    this.currentPhase = 'BRIEFING';
    this.phaseAdvancedExternally = false;
    this.lastState = null;
    this.compressionsSinceVentilation = 0;
  }

  /** Allow external code (orchestrator / UI) to advance the phase */
  setPhase(phase: CprPhase): void {
    this.currentPhase = phase;
    this.phaseAdvancedExternally = true;
  }

  getPhase(): CprPhase {
    return this.currentPhase;
  }

  /** Return the most recently computed state snapshot (null if never tracked) */
  getLatestState(): CprSessionState | null {
    return this.lastState;
  }

  /** Check if the 2-minute cycle timer has expired (returns true once) */
  isCycleBreakDue(): boolean {
    if (this.currentPhase !== 'COMPRESSIONS') return false;
    if (this.cycleStartTimestamp === null) return false;
    const elapsed = (Date.now() - this.cycleStartTimestamp) / 1000;
    return elapsed >= CYCLE_DURATION_SECONDS;
  }

  /** Finalize current cycle and start a new one */
  completeCycle(): void {
    const durationMs = this.cycleStartTimestamp
      ? Date.now() - this.cycleStartTimestamp
      : 0;

    const consistency = this.computeRateConsistency();

    const cycleStats: CprCycleStats = {
      cycleNumber: this.currentCycle,
      averageRate: this.cycleRates.length
        ? Math.round(this.cycleRates.reduce((s, v) => s + v, 0) / this.cycleRates.length)
        : 0,
      rateConsistency: consistency,
      compressionCount: this.cycleCompressionCount,
      durationSeconds: Math.round(durationMs / 1000),
    };

    this.cycleHistory.push(cycleStats);
    this.currentCycle += 1;
    this.cycleStartTimestamp = null;
    this.cycleCompressionCount = 0;
    this.cycleRates = [];
    this.compressionsSinceVentilation = 0;
  }

  track(observation: CprObservation): CprSessionState {
    this.observations.push(observation);
    const recent = this.observations.filter(item => observation.timestamp - item.timestamp <= 60000);
    this.observations.splice(0, this.observations.length, ...recent);

    const observations = [...this.observations];
    const rates = observations.map(item => item.compressionRate).filter(rate => rate > 0);
    const visibleCount = observations.filter(item => item.handsVisible).length;
    const straightCount = observations.filter(item => item.handsVisible && item.armsStraight).length;
    const centeredCount = observations.filter(item => item.handsVisible && item.handsCentered).length;
    const total = observations.length || 1;
    const visibleRatio = visibleCount / total;
    const straightArmRatio = visibleCount === 0 ? 0 : straightCount / visibleCount;
    const centeredRatio = visibleCount === 0 ? 0 : centeredCount / visibleCount;
    const currentRate = rates.at(-1) ?? 0;
    const averageRate = rates.length ? Math.round(rates.reduce((sum, value) => sum + value, 0) / rates.length) : 0;
    const maxRate = rates.length ? Math.max(...rates) : 0;
    const checklist = this.checklistEngine.update(observations, this.currentPhase);

    // --- Phase auto-advance logic ---
    // Only auto-advance from BRIEFING to COMPRESSIONS for simple scenarios
    // (advanced phases are advanced externally via setPhase)
    if (!this.phaseAdvancedExternally) {
      if (observations.some(item => item.compressionRate > 0)) {
        this.currentPhase = 'COMPRESSIONS';
      } else if (observations.some(item => item.handsVisible)) {
        // Keep BRIEFING until compressions start, unless externally advanced
        if (this.currentPhase === 'BRIEFING') {
          this.currentPhase = 'BRIEFING';
        }
      }
    }

    // --- Phase 2.4: compression fraction (B2: use peak recency, not smoothed rate) ---
    const recentPeaks = (observation.peakTimestamps ?? []).filter(t => t > observation.timestamp - 2000);
    const isCompressing = recentPeaks.length > 0;
    const wasCompressingPrev = this.wasCompressing;
    if (isCompressing && wasCompressingPrev && this.lastCompressionTimestamp !== null) {
      const delta = observation.timestamp - this.lastCompressionTimestamp;
      if (delta > 0 && delta < 2000) {
        this.totalCompressionTimeMs += delta;
      }
    }
    if (isCompressing) {
      this.lastCompressionTimestamp = observation.timestamp;
    }
    this.wasCompressing = isCompressing;

    const totalElapsedMs = observations.length >= 2
      ? observations[observations.length - 1].timestamp - observations[0].timestamp
      : 0;
    const compressionFraction = totalElapsedMs > 0
      ? Math.min(1, this.totalCompressionTimeMs / totalElapsedMs)
      : 0;

    // --- Phase 2.5: rate consistency (B1: from actual peak timestamps, not frame deltas) ---
    const allPeaks = (observation.peakTimestamps ?? []).sort((a, b) => a - b);
    for (let i = 1; i < allPeaks.length; i++) {
      // Only process peaks we haven't seen yet
      if (allPeaks[i] > this.lastCountedPeakTimestamp && allPeaks[i - 1] > this.lastCountedPeakTimestamp) {
        const interval = allPeaks[i] - allPeaks[i - 1];
        if (interval > 0 && interval < 3000) {
          this.interCompressionIntervals.push(interval);
          if (this.interCompressionIntervals.length > 30) {
            this.interCompressionIntervals.shift();
          }
        }
      }
    }
    const rateConsistency = this.computeRateConsistency();

    // --- Phase 3.3: cycle tracking (B3: count actual peaks, not rate transitions) ---
    if (this.currentPhase === 'COMPRESSIONS') {
      if (this.cycleStartTimestamp === null) {
        this.cycleStartTimestamp = Date.now();
      }
      // Count new peaks since last observation
      const newPeaks = (observation.peakTimestamps ?? []).filter(t => t > this.lastCountedPeakTimestamp);
      this.cycleCompressionCount += newPeaks.length;

      // Phase 3.4: conventional 30:2 counting
      if (this.trainingMode === 'CONVENTIONAL_30_2') {
        this.compressionsSinceVentilation += newPeaks.length;
      }

      if (newPeaks.length > 0) {
        this.lastCountedPeakTimestamp = Math.max(...newPeaks);
      }
      if (isCompressing) {
        this.cycleRates.push(currentRate);
      }
    }

    // --- Recoil ratio ---
    const recoilObs = observations.filter(item => item.recoilComplete !== undefined);
    const recoilRatio = recoilObs.length > 0
      ? recoilObs.filter(item => item.recoilComplete).length / recoilObs.length
      : 0;

    // --- Depth proxy average ---
    const depthObs = observations.filter(item => item.depthProxy !== undefined && item.depthProxy > 0);
    const depthProxyAverage = depthObs.length > 0
      ? depthObs.reduce((sum, item) => sum + (item.depthProxy ?? 0), 0) / depthObs.length
      : 0;

    // --- Risk level ---
    let riskLevel: CprSessionState['riskLevel'] = 'LOW';
    if (visibleRatio < 0.45 || straightArmRatio < 0.45) {
      riskLevel = 'HIGH';
    } else if (currentRate > 0 && (currentRate < this.scenario.targetCompressionRate.min || currentRate > this.scenario.targetCompressionRate.max)) {
      riskLevel = 'MEDIUM';
    }

    const result: CprSessionState = {
      module: 'CPR',
      status: observations.length ? 'RUNNING' : 'IDLE',
      startedAt: this.startedAt,
      scenarioId: this.scenario.id,
      currentPhase: this.currentPhase,
      currentRate,
      averageRate,
      maxRate,
      elapsedSeconds: Math.round((observation.timestamp - observations[0].timestamp) / 1000) || 0,
      checklist,
      visibleRatio,
      straightArmRatio,
      centeredRatio,
      riskLevel,
      observations,
      // Phase 3 fields
      trainingMode: this.trainingMode,
      currentCycle: this.currentCycle,
      cycleHistory: [...this.cycleHistory],
      compressionFraction,
      rateConsistency,
      recoilRatio,
      depthProxyAverage,
      compressionCount: this.cycleCompressionCount,
    };

    this.lastState = result;
    return result;
  }

  /** Get count of compressions since last ventilation (for 30:2 mode) */
  getCompressionsSinceVentilation(): number {
    return this.compressionsSinceVentilation;
  }

  /** Reset compression counter after ventilation phase */
  resetCompressionsSinceVentilation(): void {
    this.compressionsSinceVentilation = 0;
  }

  private computeRateConsistency(): number {
    if (this.interCompressionIntervals.length < 2) return 100;
    const intervals = this.interCompressionIntervals;
    const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    if (mean === 0) return 100;
    const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    // Normalize: coefficient of variation mapped to 0-100 scale
    // CV = stdDev / mean; perfect consistency = 0 CV = 100 score
    const cv = stdDev / mean;
    return Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)));
  }
}
