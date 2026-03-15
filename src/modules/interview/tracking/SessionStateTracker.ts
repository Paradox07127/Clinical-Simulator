import type { PatientCase, CoverageDimension } from '../types';
import type { ExtractedInfo } from '../types';
import { InterviewPhase } from '../types';
import type { SessionState, SessionEvent, DimensionCoverage } from '../types';

const ALL_DIMENSIONS: CoverageDimension[] = ['HPC', 'PMH', 'DH', 'FH', 'SH', 'ROS', 'ICE', 'COMM'];

export class SessionStateTracker {
  private state: SessionState;
  private caseData: PatientCase;

  constructor(caseData: PatientCase) {
    this.caseData = caseData;
    this.state = this.createInitialState(caseData);
  }

  private createInitialState(caseData: PatientCase): SessionState {
    const dimensionCoverages: DimensionCoverage[] = ALL_DIMENSIONS.map(dim => ({
      dimension: dim,
      coveredItems: [],
      totalItems: caseData.mustAskItems.filter(item => item.dimension === dim).length,
      percentage: 0,
    }));

    return {
      phase: InterviewPhase.OPENING,
      turnCount: 0,
      turnsWithoutProgress: 0,
      dimensionCoverages,
      overallCoverage: 0,
      events: [],
      extractions: [],
    };
  }

  initialize(): SessionState {
    return { ...this.state };
  }

  processTurn(extraction: ExtractedInfo | null): SessionState {
    this.state.turnCount++;

    if (extraction) {
      this.state.extractions.push(extraction);
      const hadProgress = this.updateCoverage(extraction);

      if (hadProgress) {
        this.state.turnsWithoutProgress = 0;
      } else {
        this.state.turnsWithoutProgress++;
      }
    } else {
      this.state.turnsWithoutProgress++;
    }

    this.checkPhaseTransition();
    return this.getState();
  }

  private updateCoverage(extraction: ExtractedInfo): boolean {
    let anyNew = false;

    for (const item of extraction.topicsCovered) {
      const dimCoverage = this.state.dimensionCoverages.find(
        d => d.dimension === item.dimension
      );
      if (!dimCoverage) continue;

      // Check if this subItem (or similar) is already covered
      const alreadyCovered = dimCoverage.coveredItems.some(
        existing => existing.toLowerCase() === item.subItem.toLowerCase()
      );
      if (alreadyCovered) continue;

      // Match against mustAskItems for this dimension
      const matchesMustAsk = this.caseData.mustAskItems.some(
        must => must.dimension === item.dimension &&
                (item.subItem.toLowerCase().includes(must.subItem.toLowerCase().split(' ')[0]) ||
                 must.subItem.toLowerCase().includes(item.subItem.toLowerCase().split(' ')[0]) ||
                 item.confidence >= 0.7)
      );

      if (matchesMustAsk || item.confidence >= 0.6) {
        dimCoverage.coveredItems.push(item.subItem);
        anyNew = true;
      }
    }

    // Recalculate percentages
    for (const dim of this.state.dimensionCoverages) {
      dim.percentage = dim.totalItems > 0
        ? Math.min(100, Math.round((dim.coveredItems.length / dim.totalItems) * 100))
        : 0;
    }

    // Calculate overall coverage
    const totalMust = this.caseData.mustAskItems.length;
    const totalCovered = this.state.dimensionCoverages.reduce(
      (sum, d) => sum + d.coveredItems.length, 0
    );
    this.state.overallCoverage = totalMust > 0
      ? Math.min(100, Math.round((totalCovered / totalMust) * 100))
      : 0;

    if (anyNew) {
      this.addEvent('coverage_update', { overallCoverage: this.state.overallCoverage });
    }

    return anyNew;
  }

  private checkPhaseTransition(): void {
    const prev = this.state.phase;

    switch (this.state.phase) {
      case InterviewPhase.OPENING:
        // Transition after first substantive question
        if (this.state.turnCount >= 1 && this.state.overallCoverage > 0) {
          this.state.phase = InterviewPhase.HISTORY_TAKING;
        }
        break;

      case InterviewPhase.HISTORY_TAKING: {
        // Transition when 3+ dimensions have >=60% coverage
        const wellCoveredDims = this.state.dimensionCoverages.filter(
          d => d.totalItems > 0 && d.percentage >= 60
        ).length;
        if (wellCoveredDims >= 3) {
          this.state.phase = InterviewPhase.GUIDED_INQUIRY;
        }
        break;
      }

      case InterviewPhase.GUIDED_INQUIRY:
        // Transition when overall coverage >= 60% or 15+ turns
        if (this.state.overallCoverage >= 60 || this.state.turnCount >= 15) {
          this.state.phase = InterviewPhase.DIAGNOSIS_READY;
        }
        break;

      case InterviewPhase.DIAGNOSIS_READY:
        // Terminal phase
        break;
    }

    if (this.state.phase !== prev) {
      this.addEvent('phase_change', { from: prev, to: this.state.phase });
    }
  }

  private addEvent(type: SessionEvent['type'], data?: Record<string, unknown>): void {
    this.state.events.push({
      type,
      turn: this.state.turnCount,
      timestamp: Date.now(),
      data,
    });
  }

  getState(): SessionState {
    return { ...this.state };
  }

  /**
   * Get the count of dimensions with coverage > 0
   */
  getCoveredDimensionCount(): number {
    return this.state.dimensionCoverages.filter(d => d.coveredItems.length > 0).length;
  }
}
