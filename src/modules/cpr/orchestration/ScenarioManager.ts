import { loadCprScenario, loadCprScenarioById, loadAllCprScenarios } from '../data/ScenarioRepository';
import type { CprScenario } from '../types';

export class ScenarioManager {
  private readonly scenario: CprScenario;

  constructor(scenarioId?: string) {
    this.scenario = scenarioId
      ? loadCprScenarioById(scenarioId)
      : loadCprScenario();
  }

  getScenario(): CprScenario {
    return this.scenario;
  }

  static listScenarios(): CprScenario[] {
    return loadAllCprScenarios();
  }
}
