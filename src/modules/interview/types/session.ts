import type { CoverageDimension } from './case';
import type { ExtractedInfo } from './extraction';

export enum InterviewPhase {
  OPENING = 'OPENING',
  HISTORY_TAKING = 'HISTORY_TAKING',
  GUIDED_INQUIRY = 'GUIDED_INQUIRY',
  DIAGNOSIS_READY = 'DIAGNOSIS_READY'
}

export enum InterviewStatus {
  IDLE = 'IDLE',
  INTERVIEWING = 'INTERVIEWING',
  ASSESSING = 'ASSESSING',
  COMPLETED = 'COMPLETED'
}

export interface DimensionCoverage {
  dimension: CoverageDimension;
  coveredItems: string[];
  totalItems: number;
  percentage: number;
}

export interface SessionState {
  phase: InterviewPhase;
  turnCount: number;
  turnsWithoutProgress: number;
  dimensionCoverages: DimensionCoverage[];
  overallCoverage: number;
  events: SessionEvent[];
  extractions: ExtractedInfo[];
}

export interface SessionEvent {
  type: 'phase_change' | 'coverage_update' | 'hint_given' | 'red_flag' | 'diagnosis_submitted';
  turn: number;
  timestamp: number;
  data?: Record<string, unknown>;
}
