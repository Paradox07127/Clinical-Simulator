import type {
  PatientCase,
  SessionState,
  RubricConfig,
  RubricResult,
  FeedbackReport,
  CompetencyLevel,
} from '../types';
import { getCasesByDifficulty } from '../data/CaseRepository';

export function generateFeedback(
  rubricResult: RubricResult,
  sessionState: SessionState,
  caseData: PatientCase,
  rubricConfig: RubricConfig
): FeedbackReport {
  const competencyLevel = determineCompetency(rubricResult.weightedTotal, rubricConfig);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const specificRecommendations: string[] = [];

  for (const score of rubricResult.dimensionScores) {
    if (score.rawScore >= 70) {
      strengths.push(`${score.dimensionName}: ${score.feedback}`);
    } else if (score.rawScore < 50) {
      areasForImprovement.push(`${score.dimensionName}: ${score.feedback}`);
    }
  }

  // Generate specific recommendations based on weak areas
  const weakDimensions = rubricResult.dimensionScores
    .filter(d => d.rawScore < 50)
    .sort((a, b) => a.rawScore - b.rawScore);

  for (const weak of weakDimensions.slice(0, 3)) {
    switch (weak.dimensionId) {
      case 'info_gathering':
        specificRecommendations.push('Practice using a systematic approach to history taking (e.g., SOCRATES for pain, ICE for patient perspective).');
        break;
      case 'clinical_reasoning':
        specificRecommendations.push('Before each question, consider what differential it helps rule in or out.');
        break;
      case 'diagnostic_accuracy':
        specificRecommendations.push('Review the key features that distinguish this condition from its common differentials.');
        break;
      case 'communication':
        specificRecommendations.push('Practice using open-ended questions and acknowledging patient emotions before moving on.');
        break;
      case 'efficiency':
        specificRecommendations.push('Try to ask fewer but more targeted questions. Avoid repeating topics already covered.');
        break;
      case 'safety':
        specificRecommendations.push('Always screen for red flag symptoms early in the consultation.');
        break;
    }
  }

  const nextCaseSuggestion = recommendNextCase(rubricResult, caseData.difficulty);

  const summary = buildSummary(competencyLevel, rubricResult.weightedTotal, caseData);

  return {
    rubricResult,
    competencyLevel,
    strengths,
    areasForImprovement,
    specificRecommendations,
    nextCaseSuggestion,
    summary,
  };
}

function determineCompetency(
  weightedScore: number,
  config: RubricConfig
): CompetencyLevel {
  const t = config.competencyThresholds;
  if (weightedScore >= t.expert) return 'expert';
  if (weightedScore >= t.proficient) return 'proficient';
  if (weightedScore >= t.competent) return 'competent';
  if (weightedScore >= t.beginner) return 'beginner';
  return 'novice';
}

function recommendNextCase(
  result: RubricResult,
  currentDifficulty: 'easy' | 'medium' | 'hard'
): string | undefined {
  const score = result.weightedTotal;

  let nextDifficulty: 'easy' | 'medium' | 'hard';
  if (score >= 75 && currentDifficulty === 'easy') nextDifficulty = 'medium';
  else if (score >= 75 && currentDifficulty === 'medium') nextDifficulty = 'hard';
  else if (score < 40 && currentDifficulty === 'hard') nextDifficulty = 'medium';
  else if (score < 40 && currentDifficulty === 'medium') nextDifficulty = 'easy';
  else nextDifficulty = currentDifficulty;

  const candidates = getCasesByDifficulty(nextDifficulty);
  if (candidates.length > 0) {
    return `Try "${candidates[0].name}" (${nextDifficulty} difficulty) next.`;
  }
  return undefined;
}

function buildSummary(level: CompetencyLevel, score: number, caseData: PatientCase): string {
  const levelLabels: Record<CompetencyLevel, string> = {
    novice: 'Novice',
    beginner: 'Beginner',
    competent: 'Competent',
    proficient: 'Proficient',
    expert: 'Expert',
  };
  return `Your overall performance on the "${caseData.name}" case scored ${score}/100, placing you at the ${levelLabels[level]} level. ${
    score >= 70
      ? 'Well done! You demonstrated strong clinical skills.'
      : score >= 50
      ? 'Good effort. Focus on the areas identified for improvement.'
      : 'This case was challenging. Review the feedback and try again with a systematic approach.'
  }`;
}
