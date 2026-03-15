import type { CprDecision, CprSessionState } from '../types';

/** Phase instruction text for pre-compression BLS steps */
const PHASE_INSTRUCTIONS: Record<string, string> = {
  BRIEFING: 'Review the scenario and press Confirm when ready to begin.',
  SCENE_SAFETY: 'Look around for hazards. Is the scene safe to approach? Press Confirm.',
  CHECK_RESPONSE: 'Tap the victim on the shoulder and shout "Are you okay?" Press Confirm.',
  CALL_FOR_HELP: 'Call 911 (or direct a bystander to call) and request an AED. Press Confirm.',
  CHECK_BREATHING: 'Look, listen, and feel for breathing (max 10 seconds). Press Confirm.',
  VENTILATION: 'Tilt the head, lift the chin, and deliver 2 rescue breaths. Press Confirm.',
  AED_PROMPT: 'An AED has arrived. Follow the AED voice prompts. Press Confirm.',
  CYCLE_BREAK: 'Switch rescuers! You have been compressing for 2 minutes. Rest and press Confirm to resume.',
};

export class DecisionEngine {
  decide(state: CprSessionState): CprDecision {
    // ----- Pre-compression / non-compression phases -----
    const phase = state.currentPhase;
    if (
      phase === 'BRIEFING' ||
      phase === 'SCENE_SAFETY' ||
      phase === 'CHECK_RESPONSE' ||
      phase === 'CALL_FOR_HELP' ||
      phase === 'CHECK_BREATHING' ||
      phase === 'AED_PROMPT'
    ) {
      return {
        message: PHASE_INSTRUCTIONS[phase] ?? 'Follow the on-screen instructions.',
        rhythmStatus: 'WAITING',
        formStatus: 'READY',
        riskLevel: 'LOW',
        canEvaluate: false,
        phaseInstruction: PHASE_INSTRUCTIONS[phase],
      };
    }

    if (phase === 'VENTILATION') {
      return {
        message: PHASE_INSTRUCTIONS.VENTILATION,
        rhythmStatus: 'WAITING',
        formStatus: 'READY',
        riskLevel: 'LOW',
        canEvaluate: false,
        phaseInstruction: PHASE_INSTRUCTIONS.VENTILATION,
      };
    }

    if (phase === 'CYCLE_BREAK') {
      return {
        message: PHASE_INSTRUCTIONS.CYCLE_BREAK,
        rhythmStatus: 'WAITING',
        formStatus: 'READY',
        riskLevel: 'LOW',
        canEvaluate: false,
        phaseInstruction: PHASE_INSTRUCTIONS.CYCLE_BREAK,
      };
    }

    if (phase === 'ASSESSMENT' || phase === 'COMPLETED') {
      return {
        message: phase === 'ASSESSMENT' ? 'Evaluating your performance...' : 'Session complete. Review your results.',
        rhythmStatus: 'WAITING',
        formStatus: 'READY',
        riskLevel: state.riskLevel,
        canEvaluate: true,
      };
    }

    // ----- COMPRESSIONS phase: existing rhythm/form logic + new metrics -----
    let rhythmStatus: CprDecision['rhythmStatus'] = 'WAITING';
    let formStatus: CprDecision['formStatus'] = 'READY';
    let message = 'Position yourself and begin compressions.';

    if (state.currentRate > 0 && state.currentRate < 100) {
      rhythmStatus = 'SLOW';
      message = 'Press faster to reach guideline rhythm.';
    } else if (state.currentRate >= 100 && state.currentRate <= 120) {
      rhythmStatus = 'GOOD';
      message = 'Good rhythm. Keep the cadence steady.';
    } else if (state.currentRate > 120) {
      rhythmStatus = 'FAST';
      message = 'Press slower. Avoid overshooting the target cadence.';
    }

    if (state.visibleRatio < 0.5) {
      formStatus = 'HANDS_HIDDEN';
      message = 'Hands are not visible enough for reliable tracking.';
    } else if (state.straightArmRatio < 0.55) {
      formStatus = 'ARMS_BENT';
      message = 'Keep arms straight and stack shoulders over hands.';
    } else if (state.centeredRatio < 0.55) {
      formStatus = 'OFF_CENTER';
      message = 'Re-center your hands over the sternum line.';
    } else if (state.currentRate > 0) {
      formStatus = 'GOOD';
    }

    // Add new-metric warnings when form & rhythm are already GOOD
    if (formStatus === 'GOOD' && rhythmStatus === 'GOOD') {
      // Recoil warning
      if ((state.recoilRatio ?? 1) < 0.5) {
        message = 'Allow full chest recoil between compressions.';
      }
      // Depth proxy warning
      else if ((state.depthProxyAverage ?? 0.5) < 0.3) {
        message = 'Push harder — compressions appear too shallow.';
      }
      // Rate consistency warning
      else if ((state.rateConsistency ?? 100) < 60) {
        message = 'Stabilize your rhythm — timing is inconsistent.';
      }
      // Compression fraction warning
      else if ((state.compressionFraction ?? 1) < 0.6 && state.elapsedSeconds > 10) {
        message = 'Minimize pauses — keep compression fraction above 60%.';
      }
    }

    return {
      message,
      rhythmStatus,
      formStatus,
      riskLevel: state.riskLevel,
      canEvaluate: state.elapsedSeconds >= 10 && state.observations.some(item => item.compressionRate > 0),
    };
  }
}
