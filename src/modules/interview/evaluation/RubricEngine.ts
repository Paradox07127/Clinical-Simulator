import type {
  PatientCase,
  SessionState,
  RubricConfig,
  RubricResult,
  DimensionScore,
} from '../types';
import type { AIConfig } from '../../../platform/types';
import { generateJSONFromPrompt } from '../../../platform/ai/providerGateway';

export async function evaluate(
  sessionState: SessionState,
  diagnosis: string,
  caseData: PatientCase,
  rubricConfig: RubricConfig,
  config: AIConfig
): Promise<RubricResult> {
  const dimensionScores: DimensionScore[] = [];

  for (const dim of rubricConfig.dimensions) {
    let rawScore: number;
    let feedback: string;
    let evidence: string[];

    if (dim.scoringMethod === 'deterministic') {
      const result = scoreDeterministic(dim.id, sessionState);
      rawScore = result.rawScore;
      feedback = result.feedback;
      evidence = result.evidence;
    } else {
      const result = await scoreLLM(dim.id, dim.name, dim.description, sessionState, diagnosis, caseData, config);
      rawScore = result.rawScore;
      feedback = result.feedback;
      evidence = result.evidence;
    }

    dimensionScores.push({
      dimensionId: dim.id,
      dimensionName: dim.name,
      rawScore,
      weight: dim.weight,
      weightedScore: rawScore * dim.weight,
      feedback,
      evidence,
    });
  }

  const weightedTotal = dimensionScores.reduce((sum, d) => sum + d.weightedScore, 0);

  return {
    dimensionScores,
    weightedTotal: Math.round(weightedTotal),
    maxScore: 100,
  };
}

function scoreDeterministic(
  dimensionId: string,
  sessionState: SessionState
): { rawScore: number; feedback: string; evidence: string[] } {
  if (dimensionId === 'info_gathering') {
    const coverage = sessionState.overallCoverage;
    const evidence = sessionState.dimensionCoverages
      .filter(d => d.coveredItems.length > 0)
      .map(d => `${d.dimension}: ${d.coveredItems.join(', ')} (${d.percentage}%)`);

    let feedback: string;
    if (coverage >= 80) feedback = 'Excellent history taking -- comprehensive coverage across all key dimensions.';
    else if (coverage >= 60) feedback = 'Good history taking with adequate coverage, but some areas could be explored further.';
    else if (coverage >= 40) feedback = 'Partial history -- several important areas were not explored.';
    else feedback = 'Incomplete history taking -- many critical areas were missed.';

    return { rawScore: Math.min(100, coverage), feedback, evidence };
  }

  if (dimensionId === 'efficiency') {
    const turns = sessionState.turnCount;
    const coverage = sessionState.overallCoverage;
    // Ideal: high coverage with few turns
    const ratio = turns > 0 ? coverage / turns : 0;
    // Scale: ratio of 7+ is excellent (100), ratio of 3 is average (60), below 2 is poor
    let rawScore: number;
    if (ratio >= 7) rawScore = 100;
    else if (ratio >= 5) rawScore = 85;
    else if (ratio >= 3) rawScore = 70;
    else if (ratio >= 2) rawScore = 55;
    else rawScore = 40;

    // Penalize excessive turns
    if (turns > 20) rawScore = Math.max(30, rawScore - 15);

    const feedback = `You used ${turns} turns to achieve ${coverage}% coverage (efficiency ratio: ${ratio.toFixed(1)}).`;
    const evidence = [`${turns} turns`, `${coverage}% coverage`, `ratio: ${ratio.toFixed(1)}`];

    return { rawScore, feedback, evidence };
  }

  return { rawScore: 50, feedback: 'Unable to score this dimension deterministically.', evidence: [] };
}

async function scoreLLM(
  dimensionId: string,
  dimensionName: string,
  description: string,
  sessionState: SessionState,
  diagnosis: string,
  caseData: PatientCase,
  config: AIConfig
): Promise<{ rawScore: number; feedback: string; evidence: string[] }> {
  const prompt = `
    You are evaluating a medical student's clinical interview on the dimension: "${dimensionName}".
    Description: ${description}

    CASE: ${caseData.name}, ${caseData.age}y ${caseData.gender}
    CORRECT DIAGNOSIS: ${caseData.correctDiagnosis}
    STUDENT'S DIAGNOSIS: ${diagnosis}

    SESSION DATA:
    - Total turns: ${sessionState.turnCount}
    - Phase reached: ${sessionState.phase}
    - Overall coverage: ${sessionState.overallCoverage}%
    - Dimension coverages: ${JSON.stringify(sessionState.dimensionCoverages.map(d => ({ dim: d.dimension, pct: d.percentage, items: d.coveredItems })))}
    - Student approach patterns: ${JSON.stringify(sessionState.extractions.map(e => e.studentApproach).filter(Boolean))}
    - Clinical relevance: ${JSON.stringify(sessionState.extractions.map(e => e.clinicalRelevance).filter(Boolean))}

    Respond in JSON format:
    {
      "rawScore": <0-100>,
      "feedback": "<2-3 sentences of specific feedback>",
      "evidence": ["<specific examples from the session>"]
    }
  `;

  try {
    const responseText = await generateJSONFromPrompt(config, prompt, 0.2);

    const parsed = JSON.parse(responseText);
    return {
      rawScore: parsed.rawScore ?? 50,
      feedback: parsed.feedback ?? 'Unable to evaluate this dimension.',
      evidence: parsed.evidence ?? [],
    };
  } catch (error) {
    console.error(`LLM scoring failed for ${dimensionId}:`, error);
    return {
      rawScore: 50,
      feedback: 'Evaluation unavailable for this dimension.',
      evidence: [],
    };
  }
}
