import type { SessionState, MustAskItem } from '../types';
import { InterviewPhase } from '../types';
import type { ProgressEngine } from '../tracking/ProgressEngine';

export type DecisionType =
  | 'CONTINUE'
  | 'HINT_NEEDED'
  | 'RISK_BRANCH'
  | 'PHASE_ADVANCE'
  | 'EARLY_END_WARNING'
  | 'RED_FLAG';

export interface Decision {
  type: DecisionType;
  message?: string;
  data?: Record<string, unknown>;
}

export class DecisionEngine {
  private progressEngine: ProgressEngine;

  constructor(progressEngine: ProgressEngine) {
    this.progressEngine = progressEngine;
  }

  evaluate(state: SessionState): Decision {
    // Rule 5: RED_FLAG -- 10+ turns with critical items still missing
    if (state.turnCount >= 10) {
      const criticalGaps = this.progressEngine.getCriticalGaps(state);
      if (criticalGaps.length > 0) {
        const gap = criticalGaps[0];
        return {
          type: 'RED_FLAG',
          message: this.buildRedFlagHint(gap),
          data: { missingItem: gap.subItem },
        };
      }
    }

    // Rule 1: HINT_NEEDED -- 3+ turns without progress
    if (state.turnsWithoutProgress >= 3) {
      const hint = this.progressEngine.getNextHint(state);
      if (hint) {
        return {
          type: 'HINT_NEEDED',
          message: `Coach tip: ${hint}`,
        };
      }
    }

    // Rule 2: RISK_BRANCH -- student asking off-track questions
    if (state.extractions.length > 0) {
      const lastExtraction = state.extractions[state.extractions.length - 1];
      if (lastExtraction.clinicalRelevance === 'off_track' && state.turnsWithoutProgress >= 2) {
        return {
          type: 'RISK_BRANCH',
          message: 'Coach tip: Your recent questions may not be leading toward the core diagnosis. Consider refocusing on the presenting complaint.',
        };
      }
    }

    // Rule 3: PHASE_ADVANCE -- coverage >= 60%, enable submit
    if (state.phase === InterviewPhase.GUIDED_INQUIRY &&
        this.progressEngine.meetsThreshold(state, 60)) {
      return {
        type: 'PHASE_ADVANCE',
        message: 'You have gathered sufficient information. You may now submit your diagnosis when ready.',
      };
    }

    return { type: 'CONTINUE' };
  }

  /**
   * Check if diagnosis submission should be warned about
   */
  evaluateSubmission(state: SessionState): Decision | null {
    // Rule 4: EARLY_END_WARNING -- coverage < 40% at submission
    if (state.overallCoverage < 40) {
      return {
        type: 'EARLY_END_WARNING',
        message: `Warning: You have only covered ${state.overallCoverage}% of the key clinical areas. Are you sure you want to submit?`,
        data: { coverage: state.overallCoverage },
      };
    }
    return null;
  }

  private buildRedFlagHint(gap: MustAskItem): string {
    if (gap.hint) {
      return `Coach tip: You haven't explored an important area yet. Consider asking: "${gap.hint}"`;
    }
    return `Coach tip: Don't forget to ask about ${gap.subItem}.`;
  }
}
