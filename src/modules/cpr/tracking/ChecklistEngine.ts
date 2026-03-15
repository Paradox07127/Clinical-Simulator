import type { CprChecklistItem, CprObservation, CprPhase, CprScenario, CprTrainingMode } from '../types';

/** Phase ordering for BLS checklist completion (B4) */
const BLS_PHASE_ORDER: CprPhase[] = [
  'BRIEFING',
  'SCENE_SAFETY',
  'CHECK_RESPONSE',
  'CALL_FOR_HELP',
  'CHECK_BREATHING',
  'COMPRESSIONS',
  'VENTILATION',
  'AED_PROMPT',
  'CYCLE_BREAK',
  'ASSESSMENT',
  'COMPLETED',
];

/** Full BLS checklist items for CONVENTIONAL_30_2 scenarios */
const BLS_CHECKLIST_LABELS = [
  'Confirm scene safety',
  'Check responsiveness (tap and shout)',
  'Call 911 / activate EMS',
  'Check breathing (look-listen-feel)',
  'Begin chest compressions',
  'Deliver rescue breaths (30:2)',
  'Maintain target rhythm (100-120 CPM)',
  'Keep hands centered with straight arms',
];

/** Hands-only (beginner) checklist – matches original 4 items */
const HANDS_ONLY_CHECKLIST_LABELS = [
  'Confirm presence and body positioning',
  'Start continuous chest compressions',
  'Maintain target rhythm',
  'Keep hands centered with straight arms',
];

export class ChecklistEngine {
  private items: CprChecklistItem[] = [];
  private readonly trainingMode: CprTrainingMode;

  constructor(private readonly scenario: CprScenario) {
    this.trainingMode = scenario.trainingMode ?? 'HANDS_ONLY';
    this.reset();
  }

  reset(): void {
    const labels = this.trainingMode === 'CONVENTIONAL_30_2'
      ? BLS_CHECKLIST_LABELS
      : HANDS_ONLY_CHECKLIST_LABELS;

    this.items = labels.map((label, index) => ({
      id: String(index),
      label,
      completed: false,
      detail: 'Pending',
    }));
  }

  update(observations: CprObservation[], currentPhase?: CprPhase): CprChecklistItem[] {
    const hasVisibleHands = observations.some(item => item.handsVisible);
    const hasCompression = observations.some(item => item.compressionRate > 0);
    const withinRhythm = observations.some(item => item.compressionRate >= 100 && item.compressionRate <= 120);
    const stableForm = observations.some(item => item.handsVisible && item.armsStraight && item.handsCentered);

    const map = (id: string, label: string, completed: boolean, detail: string): CprChecklistItem => ({
      id,
      label,
      completed,
      detail,
    });

    if (this.trainingMode === 'CONVENTIONAL_30_2') {
      return this.updateBls(observations, hasVisibleHands, hasCompression, withinRhythm, stableForm, map, currentPhase);
    }

    return this.updateHandsOnly(hasVisibleHands, hasCompression, withinRhythm, stableForm, map);
  }

  private updateHandsOnly(
    hasVisibleHands: boolean,
    hasCompression: boolean,
    withinRhythm: boolean,
    stableForm: boolean,
    map: (id: string, label: string, completed: boolean, detail: string) => CprChecklistItem,
  ): CprChecklistItem[] {
    // Use scenario's requiredFirstSteps labels if available, otherwise fallback
    const labels = this.scenario.requiredFirstSteps.length >= 4
      ? this.scenario.requiredFirstSteps
      : HANDS_ONLY_CHECKLIST_LABELS;

    return [
      map('position', labels[0], hasVisibleHands,
        hasVisibleHands ? 'Upper body and hand landmarks are detected.' : 'Adjust camera and stance until hands are visible.'),
      map('compressions', labels[1], hasCompression,
        hasCompression ? 'Compression motion is being tracked.' : 'Begin chest-compression movement to enter the active workflow.'),
      map('rhythm', labels[2], withinRhythm,
        withinRhythm ? 'Target cadence has been reached at least once.' : 'Aim for 100-120 compressions per minute.'),
      map('form', labels[3], stableForm,
        stableForm ? 'Hands are centered and elbows stay straight.' : 'Keep shoulders over hands and lock elbows.'),
    ];
  }

  /** Helper: returns true if the current phase is at or past the given phase */
  private static phaseAtOrPast(current: CprPhase | undefined, target: CprPhase): boolean {
    if (!current) return false;
    return BLS_PHASE_ORDER.indexOf(current) >= BLS_PHASE_ORDER.indexOf(target);
  }

  private updateBls(
    _observations: CprObservation[],
    _hasVisibleHands: boolean,
    hasCompression: boolean,
    withinRhythm: boolean,
    stableForm: boolean,
    map: (id: string, label: string, completed: boolean, detail: string) => CprChecklistItem,
    currentPhase?: CprPhase,
  ): CprChecklistItem[] {
    // B4: First 4 items are protocol steps completed based on phase progression, not hand visibility.
    // Items 4-7 remain observation-based performance checks.
    const pastCheckResponse = ChecklistEngine.phaseAtOrPast(currentPhase, 'CHECK_RESPONSE');
    const pastCallHelp = ChecklistEngine.phaseAtOrPast(currentPhase, 'CALL_FOR_HELP');
    const pastCheckBreathing = ChecklistEngine.phaseAtOrPast(currentPhase, 'CHECK_BREATHING');
    const pastCompressions = ChecklistEngine.phaseAtOrPast(currentPhase, 'COMPRESSIONS');
    const reachedVentilation = ChecklistEngine.phaseAtOrPast(currentPhase, 'VENTILATION')
      || (currentPhase === 'COMPRESSIONS' && hasCompression); // at least started 2nd cycle

    return [
      map('scene_safety', BLS_CHECKLIST_LABELS[0], pastCheckResponse,
        pastCheckResponse ? 'Scene confirmed safe.' : 'Confirm scene is safe before approaching.'),
      map('check_response', BLS_CHECKLIST_LABELS[1], pastCallHelp,
        pastCallHelp ? 'Responsiveness checked.' : 'Tap the victim and shout to check for response.'),
      map('call_help', BLS_CHECKLIST_LABELS[2], pastCheckBreathing,
        pastCheckBreathing ? 'EMS activated.' : 'Call 911 or direct someone to call.'),
      map('check_breathing', BLS_CHECKLIST_LABELS[3], pastCompressions,
        pastCompressions ? 'Breathing assessed.' : 'Look, listen, and feel for breathing (max 10 seconds).'),
      map('compressions', BLS_CHECKLIST_LABELS[4], hasCompression,
        hasCompression ? 'Compression motion is being tracked.' : 'Begin chest-compression movement.'),
      map('ventilation', BLS_CHECKLIST_LABELS[5], reachedVentilation,
        reachedVentilation ? 'Rescue breaths delivered.' : 'After 30 compressions, deliver 2 rescue breaths.'),
      map('rhythm', BLS_CHECKLIST_LABELS[6], withinRhythm,
        withinRhythm ? 'Target cadence has been reached at least once.' : 'Aim for 100-120 compressions per minute.'),
      map('form', BLS_CHECKLIST_LABELS[7], stableForm,
        stableForm ? 'Hands are centered and elbows stay straight.' : 'Keep shoulders over hands and lock elbows.'),
    ];
  }
}
