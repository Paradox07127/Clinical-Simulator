import type { CprEvaluation, CprRubric, CprScenario, CprSessionState } from '../types';

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function evaluateCprSession(
  state: CprSessionState,
  scenario: CprScenario,
  rubric: CprRubric
): CprEvaluation {
  // --- Rhythm score (target: 100-120 CPM) ---
  // Penalize deviation OUTSIDE the target band only
  const { min: targetMin, max: targetMax } = scenario.targetCompressionRate;
  const rateDistance = state.averageRate === 0
    ? 100
    : state.averageRate < targetMin
      ? targetMin - state.averageRate        // too slow: distance below min
      : state.averageRate > targetMax
        ? state.averageRate - targetMax       // too fast: distance above max
        : 0;                                  // in range: no penalty
  const rhythmScore = clamp(100 - rateDistance * 3);

  // --- Form score (visibility + arm straightness + centering) ---
  const formScore = clamp(
    state.visibleRatio * 35 +
    state.straightArmRatio * 35 +
    state.centeredRatio * 30
  );

  // --- Protocol adherence / readiness score (checklist completion) ---
  const readinessScore = clamp(
    (state.checklist.filter(item => item.completed).length / Math.max(1, state.checklist.length)) * 100
  );

  // --- Depth proxy score ---
  const depthProxyRaw = state.depthProxyAverage ?? 0;
  // Map 0-1 depth proxy to 0-100 score; 0.3-0.7 is the ideal range
  let depthProxyScore: number;
  if (depthProxyRaw >= 0.3 && depthProxyRaw <= 0.7) {
    depthProxyScore = 100;
  } else if (depthProxyRaw < 0.3) {
    depthProxyScore = clamp((depthProxyRaw / 0.3) * 100);
  } else {
    // > 0.7: slight penalty for too deep
    depthProxyScore = clamp(100 - ((depthProxyRaw - 0.7) / 0.3) * 40);
  }

  // --- Recoil score ---
  const recoilScore = clamp((state.recoilRatio ?? 0) * 100);

  // --- Compression fraction score ---
  const cfRaw = state.compressionFraction ?? 0;
  // AHA recommends >= 60% compression fraction
  const compressionFractionScore = clamp(cfRaw >= 0.6 ? 100 : (cfRaw / 0.6) * 100);

  // --- Rate consistency score ---
  const rateConsistencyScore = clamp(state.rateConsistency ?? 100);

  // --- Weighted total ---
  const w = rubric.weights;
  const wRhythm = w.rhythm ?? 35;
  const wForm = w.form ?? 25;
  const wReadiness = w.readiness ?? 5;
  const wDepthProxy = w.depthProxy ?? 10;
  const wRecoil = w.recoil ?? 10;
  const wCF = w.compressionFraction ?? 10;
  const wRC = w.rateConsistency ?? 5;
  const totalWeight = wRhythm + wForm + wReadiness + wDepthProxy + wRecoil + wCF + wRC;

  const totalScore = Math.round(
    (rhythmScore * wRhythm +
      formScore * wForm +
      readinessScore * wReadiness +
      depthProxyScore * wDepthProxy +
      recoilScore * wRecoil +
      compressionFractionScore * wCF +
      rateConsistencyScore * wRC) / totalWeight
  );

  // --- Qualitative feedback ---
  const strengths: string[] = [];
  const gaps: string[] = [];
  const nextSteps: string[] = [];

  if (state.averageRate >= 100 && state.averageRate <= 120) {
    strengths.push('Compression cadence stayed within the AHA-recommended 100-120 CPM range.');
  } else {
    gaps.push('Compression cadence did not stay in the 100-120 CPM target window (AHA guideline).');
    nextSteps.push('Use the metronome and stabilize your tempo before increasing force.');
  }

  if (state.straightArmRatio >= rubric.thresholds.straightArmRatio) {
    strengths.push('Arm alignment was stable for most tracked compressions.');
  } else {
    gaps.push('Elbows bent too often, which weakens compression mechanics.');
    nextSteps.push('Lock elbows and shift body weight directly over the hands.');
  }

  if (state.centeredRatio >= rubric.thresholds.centeredRatio) {
    strengths.push('Hand placement remained centered during the session.');
  } else {
    gaps.push('Hand position drifted away from the center line.');
    nextSteps.push('Rehearse hand placement before starting each repetition block.');
  }

  if (state.visibleRatio < rubric.thresholds.visibleRatio) {
    gaps.push('Camera framing reduced tracking confidence for part of the session.');
    nextSteps.push('Reposition the camera so shoulders, elbows, and wrists stay in frame.');
  }

  // New dimension feedback
  if (depthProxyScore < 70) {
    gaps.push('Compressions appear too shallow. AHA recommends at least 2 inches (5 cm) depth.');
    nextSteps.push('Push harder with locked elbows, using body weight rather than arm strength.');
  } else if (depthProxyScore >= 90) {
    strengths.push('Compression depth proxy is within the adequate range.');
  }

  if (recoilScore < 70) {
    gaps.push('Incomplete chest recoil detected between compressions.');
    nextSteps.push('Lift your body weight fully between compressions to allow complete chest recoil.');
  } else if (recoilScore >= 80) {
    strengths.push('Good chest recoil between compressions.');
  }

  if (compressionFractionScore < 70 && state.elapsedSeconds > 10) {
    gaps.push('Compression fraction is below the AHA-recommended 60% threshold.');
    nextSteps.push('Minimize interruptions and pauses during CPR.');
  } else if (compressionFractionScore >= 80) {
    strengths.push('Compression fraction is above the AHA-recommended 60% minimum.');
  }

  if (rateConsistencyScore < 60) {
    gaps.push('Compression rate was inconsistent — timing varied significantly.');
    nextSteps.push('Practice with a metronome at 110 BPM to develop a consistent rhythm.');
  } else if (rateConsistencyScore >= 80) {
    strengths.push('Compression rate was consistent throughout the session.');
  }

  // Per-cycle comparison for multiple cycles
  const cycles = state.cycleHistory ?? [];
  if (cycles.length >= 2) {
    const first = cycles[0];
    const last = cycles[cycles.length - 1];
    if (last.averageRate < first.averageRate - 10) {
      gaps.push(`Compression rate declined from ${first.averageRate} CPM (cycle 1) to ${last.averageRate} CPM (cycle ${last.cycleNumber}).`);
      nextSteps.push('Focus on maintaining rate across cycles — fatigue management is key.');
    }
    if (last.rateConsistency < first.rateConsistency - 15) {
      gaps.push('Rate consistency degraded in later cycles, suggesting fatigue.');
      nextSteps.push('Practice longer drills to build endurance.');
    }
  }

  if (strengths.length === 0) {
    strengths.push('You completed a full tracked CPR repetition set.');
  }

  if (nextSteps.length === 0) {
    nextSteps.push('Repeat the drill for 30 seconds and aim to keep both rhythm and form green throughout.');
  }

  return {
    totalScore,
    breakdown: {
      rhythm: Math.round(rhythmScore),
      form: Math.round(formScore),
      readiness: Math.round(readinessScore),
      depthProxy: Math.round(depthProxyScore),
      recoil: Math.round(recoilScore),
      compressionFraction: Math.round(compressionFractionScore),
      rateConsistency: Math.round(rateConsistencyScore),
    },
    strengths,
    gaps,
    nextSteps,
  };
}
