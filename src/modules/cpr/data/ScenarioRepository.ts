import type { CprScenario } from '../types';

const BEGINNER_SCENARIO: CprScenario = {
  id: 'adult-hands-only-basic',
  title: 'Hands-Only CPR (Beginner)',
  difficulty: 'Beginner',
  trainingMode: 'HANDS_ONLY',
  emergencyType: 'First-aid',
  background:
    'An unresponsive adult has collapsed. The learner should establish readiness, maintain steady compressions, and keep safe body mechanics.',
  requiredFirstSteps: [
    'Confirm presence and body positioning',
    'Start continuous chest compressions',
    'Maintain target rhythm',
    'Keep hands centered with straight arms',
  ],
  commonMistakes: [
    'Compression rhythm below 100 CPM',
    'Compression rhythm above 120 CPM',
    'Bent elbows during compressions',
    'Hands drifting away from the sternum line',
  ],
  escalationConditions: [
    'Learner repeatedly loses hand visibility',
    'Compression rhythm remains outside target range',
    'Body mechanics break down for a sustained period',
  ],
  targetCompressionRate: {
    min: 100,
    max: 120,
  },
};

const INTERMEDIATE_SCENARIO: CprScenario = {
  id: 'adult-bls-intermediate',
  title: 'Adult BLS Sequence',
  difficulty: 'Intermediate',
  trainingMode: 'CONVENTIONAL_30_2',
  emergencyType: 'BLS Protocol',
  background:
    'A bystander has found an unresponsive adult in a park. Follow the full BLS sequence: confirm scene safety, check responsiveness, activate EMS, assess breathing, then begin 30:2 CPR cycles with 2-minute rescuer switches.',
  requiredFirstSteps: [
    'Confirm scene safety',
    'Check responsiveness (tap and shout)',
    'Call 911 / activate EMS',
    'Check breathing (look-listen-feel)',
    'Begin chest compressions',
    'Deliver rescue breaths (30:2)',
    'Maintain target rhythm (100-120 CPM)',
    'Keep hands centered with straight arms',
  ],
  commonMistakes: [
    'Skipping scene safety assessment',
    'Spending too long checking breathing (>10s)',
    'Compression rhythm below 100 CPM',
    'Compression rhythm above 120 CPM',
    'Bent elbows during compressions',
    'Incomplete chest recoil',
    'Low compression fraction from excessive pauses',
  ],
  escalationConditions: [
    'Learner repeatedly loses hand visibility',
    'Compression rhythm remains outside target range',
    'Compression fraction drops below 60%',
    'Body mechanics break down for a sustained period',
  ],
  targetCompressionRate: {
    min: 100,
    max: 120,
  },
};

const ADVANCED_SCENARIO: CprScenario = {
  id: 'adult-bls-advanced',
  title: 'Advanced Emergency Response',
  difficulty: 'Advanced',
  trainingMode: 'CONVENTIONAL_30_2',
  emergencyType: 'BLS Protocol with Complications',
  background:
    'You are a first responder at a crowded event. An adult has collapsed near the main stage. There is loud noise, bystanders are panicking, and the nearest AED is 3 minutes away. Follow the full BLS sequence under pressure, maintaining high-quality compressions across multiple 2-minute cycles.',
  requiredFirstSteps: [
    'Confirm scene safety',
    'Check responsiveness (tap and shout)',
    'Call 911 / activate EMS',
    'Check breathing (look-listen-feel)',
    'Begin chest compressions',
    'Deliver rescue breaths (30:2)',
    'Maintain target rhythm (100-120 CPM)',
    'Keep hands centered with straight arms',
  ],
  commonMistakes: [
    'Skipping scene safety in a chaotic environment',
    'Failing to delegate tasks to bystanders',
    'Compression rhythm deteriorating over multiple cycles',
    'Incomplete chest recoil due to fatigue',
    'Shallow compressions in later cycles',
    'Low compression fraction from excessive pauses',
  ],
  escalationConditions: [
    'Rate consistency drops below 50 across cycles',
    'Compression depth degrades after first cycle',
    'Compression fraction drops below 60%',
    'Form quality drops significantly in later cycles',
  ],
  targetCompressionRate: {
    min: 100,
    max: 120,
  },
};

/** All available scenarios */
const ALL_SCENARIOS: CprScenario[] = [
  BEGINNER_SCENARIO,
  INTERMEDIATE_SCENARIO,
  ADVANCED_SCENARIO,
];

/** Load the default (beginner) scenario – backward compatible */
export function loadCprScenario(): CprScenario {
  return BEGINNER_SCENARIO;
}

/** Load a scenario by its id. Falls back to beginner if not found. */
export function loadCprScenarioById(id: string): CprScenario {
  return ALL_SCENARIOS.find(s => s.id === id) ?? BEGINNER_SCENARIO;
}

/** Load all available scenarios */
export function loadAllCprScenarios(): CprScenario[] {
  return [...ALL_SCENARIOS];
}
