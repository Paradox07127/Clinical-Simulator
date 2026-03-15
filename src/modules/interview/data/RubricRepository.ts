import type { RubricConfig } from '../types';
import rubricData from './rubrics/clinical-interview.json';

export function loadRubricConfig(): RubricConfig {
  return rubricData as RubricConfig;
}

export function getDimensionWeights(): Record<string, number> {
  const config = loadRubricConfig();
  const weights: Record<string, number> = {};
  for (const dim of config.dimensions) {
    weights[dim.id] = dim.weight;
  }
  return weights;
}
