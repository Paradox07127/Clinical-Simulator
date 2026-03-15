import type { CprEvaluation, CprSessionState } from '../types';

export interface CprFeedbackSummary {
  headline: string;
  summary: string;
  evaluation: CprEvaluation;
  /** Per-cycle comparison text, if multiple cycles were completed */
  cycleComparison?: string;
  /** Specific improvement suggestion based on the weakest scoring dimension */
  focusArea?: string;
}

/** Identify the weakest dimension and return an improvement suggestion */
function identifyFocusArea(breakdown: CprEvaluation['breakdown']): string {
  const dimensions: { name: string; score: number; advice: string }[] = [
    { name: 'Rhythm', score: breakdown.rhythm, advice: 'AHA recommends 100-120 compressions per minute. Practice with a metronome set to 110 BPM.' },
    { name: 'Form', score: breakdown.form, advice: 'Focus on locking elbows, centering hands over the sternum, and keeping shoulders stacked over hands.' },
    { name: 'Depth', score: breakdown.depthProxy ?? 100, advice: 'AHA recommends at least 2 inches (5 cm) of compression depth. Use body weight, not arm strength.' },
    { name: 'Recoil', score: breakdown.recoil ?? 100, advice: 'Allow complete chest recoil between compressions. Lift your hands slightly to avoid leaning.' },
    { name: 'Compression Fraction', score: breakdown.compressionFraction ?? 100, advice: 'AHA recommends minimizing pauses to keep compression fraction above 60%.' },
    { name: 'Rate Consistency', score: breakdown.rateConsistency ?? 100, advice: 'A steady rhythm is more effective than varying speed. Use a metronome for pacing.' },
  ];

  const weakest = dimensions.reduce((min, d) => d.score < min.score ? d : min, dimensions[0]);
  return `Focus area: ${weakest.name} (${weakest.score}/100). ${weakest.advice}`;
}

/** Generate per-cycle comparison text */
function generateCycleComparison(state: CprSessionState): string | undefined {
  const cycles = state.cycleHistory ?? [];
  if (cycles.length < 2) return undefined;

  const lines: string[] = [`Completed ${cycles.length} cycles:`];
  for (const cycle of cycles) {
    lines.push(
      `  Cycle ${cycle.cycleNumber}: ${cycle.averageRate} CPM avg, ${cycle.compressionCount} compressions, consistency ${cycle.rateConsistency}/100`
    );
  }

  const first = cycles[0];
  const last = cycles[cycles.length - 1];
  const rateDelta = last.averageRate - first.averageRate;
  if (Math.abs(rateDelta) > 5) {
    lines.push(
      rateDelta < 0
        ? `Rate decreased by ${Math.abs(rateDelta)} CPM from cycle 1 to ${last.cycleNumber} — watch for fatigue.`
        : `Rate increased by ${rateDelta} CPM — you may be speeding up under pressure.`
    );
  } else {
    lines.push('Rate was consistent across cycles — good endurance.');
  }

  return lines.join('\n');
}

export function generateCprFeedback(
  evaluation: CprEvaluation,
  state: CprSessionState
): CprFeedbackSummary {
  const headline = evaluation.totalScore >= 85
    ? 'CPR workflow is on target.'
    : evaluation.totalScore >= 70
      ? 'CPR workflow is functional with correctable gaps.'
      : 'CPR workflow needs more guided practice.';

  const parts: string[] = [
    `Average cadence ${state.averageRate || 0} CPM`,
    `visibility ${Math.round(state.visibleRatio * 100)}%`,
    `straight-arm consistency ${Math.round(state.straightArmRatio * 100)}%`,
  ];

  // Include new metrics in summary when available
  if (state.compressionFraction !== undefined) {
    parts.push(`compression fraction ${Math.round(state.compressionFraction * 100)}%`);
  }
  if (state.rateConsistency !== undefined) {
    parts.push(`rate consistency ${state.rateConsistency}/100`);
  }
  if (state.recoilRatio !== undefined) {
    parts.push(`recoil ${Math.round(state.recoilRatio * 100)}%`);
  }

  const summary = parts.join(', ') + '.';

  const focusArea = identifyFocusArea(evaluation.breakdown);
  const cycleComparison = generateCycleComparison(state);

  return {
    headline,
    summary,
    evaluation,
    cycleComparison,
    focusArea,
  };
}
