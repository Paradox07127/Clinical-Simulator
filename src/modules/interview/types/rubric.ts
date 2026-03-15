export interface RubricConfig {
  dimensions: RubricDimension[];
  competencyThresholds: {
    novice: number;
    beginner: number;
    competent: number;
    proficient: number;
    expert: number;
  };
}

export interface RubricDimension {
  id: string;
  name: string;
  weight: number; // 0-1, all weights sum to 1
  description: string;
  scoringMethod: 'deterministic' | 'llm';
}

export interface RubricResult {
  dimensionScores: DimensionScore[];
  weightedTotal: number;
  maxScore: number;
}

export interface DimensionScore {
  dimensionId: string;
  dimensionName: string;
  rawScore: number;       // 0-100
  weight: number;
  weightedScore: number;  // rawScore * weight
  feedback: string;
  evidence: string[];
}
