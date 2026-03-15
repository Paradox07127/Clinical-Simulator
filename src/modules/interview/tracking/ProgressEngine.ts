import type { PatientCase, MustAskItem } from '../types';
import type { DimensionCoverage, SessionState } from '../types';

export class ProgressEngine {
  private caseData: PatientCase;

  constructor(caseData: PatientCase) {
    this.caseData = caseData;
  }

  /**
   * Get overall coverage percentage from session state
   */
  getOverallCoverage(state: SessionState): number {
    return state.overallCoverage;
  }

  /**
   * Get critical gaps: must-ask items marked critical that haven't been covered
   */
  getCriticalGaps(state: SessionState): MustAskItem[] {
    const coveredSubItems = new Set<string>();
    for (const dim of state.dimensionCoverages) {
      for (const item of dim.coveredItems) {
        coveredSubItems.add(item.toLowerCase());
      }
    }

    return this.caseData.mustAskItems.filter(item => {
      if (!item.critical) return false;
      // Check if any covered item matches this must-ask
      return !Array.from(coveredSubItems).some(
        covered => covered.includes(item.subItem.toLowerCase().split(' ')[0]) ||
                   item.subItem.toLowerCase().includes(covered.split(' ')[0])
      );
    });
  }

  /**
   * Check if coverage meets a given threshold
   */
  meetsThreshold(state: SessionState, threshold: number): boolean {
    return state.overallCoverage >= threshold;
  }

  /**
   * Get dimensions sorted by coverage (lowest first) for guided hints
   */
  getWeakestDimensions(state: SessionState): DimensionCoverage[] {
    return [...state.dimensionCoverages]
      .filter(d => d.totalItems > 0)
      .sort((a, b) => a.percentage - b.percentage);
  }

  /**
   * Get a hint for the next best question to ask
   */
  getNextHint(state: SessionState): string | null {
    const gaps = this.getCriticalGaps(state);
    if (gaps.length === 0) return null;

    // Prioritize gaps with hints
    const withHint = gaps.find(g => g.hint);
    if (withHint?.hint) return withHint.hint;

    // Fallback: suggest the dimension
    const gap = gaps[0];
    return `Consider asking about: ${gap.subItem} (${gap.dimension})`;
  }
}
