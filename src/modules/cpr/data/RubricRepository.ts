import type { CprRubric } from '../types';

const DEFAULT_RUBRIC: CprRubric = {
  weights: {
    rhythm: 35,
    form: 25,
    readiness: 5,       // protocol adherence (checklist completion)
    depthProxy: 10,
    recoil: 10,
    compressionFraction: 10,
    rateConsistency: 5,
  },
  thresholds: {
    visibleRatio: 0.7,
    straightArmRatio: 0.65,
    centeredRatio: 0.65,
  },
};

export function loadCprRubric(): CprRubric {
  return DEFAULT_RUBRIC;
}
