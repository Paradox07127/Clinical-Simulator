import type { RubricResult } from './rubric';

export type CompetencyLevel = 'novice' | 'beginner' | 'competent' | 'proficient' | 'expert';

export interface FeedbackReport {
  rubricResult: RubricResult;
  competencyLevel: CompetencyLevel;
  strengths: string[];
  areasForImprovement: string[];
  specificRecommendations: string[];
  nextCaseSuggestion?: string;
  summary: string;
}

export interface Assessment {
  score: number;
  clinicalReasoningScore: number;
  bedsideMannerScore: number;
  diagnosticAccuracyScore: number;
  keyQuestionsAsked: string[];
  missingQuestions: string[];
  efficiencyFeedback: string;
  diagnosticAccuracy: string;
  bedsideMannerFeedback: string;
  clinicalReasoningFeedback: string;
  overallFeedback: string;
}
