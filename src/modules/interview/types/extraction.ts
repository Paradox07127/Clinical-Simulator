import type { CoverageDimension } from './case';

export interface ExtractedInfo {
  topicsCovered: CoverageItem[];
  studentApproach?: 'open' | 'closed' | 'leading' | 'empathetic';
  clinicalRelevance?: 'high' | 'medium' | 'low' | 'off_track';
}

export interface CoverageItem {
  dimension: CoverageDimension;
  subItem: string;
  confidence: number; // 0-1
  evidence: string;   // quote from student question
}
