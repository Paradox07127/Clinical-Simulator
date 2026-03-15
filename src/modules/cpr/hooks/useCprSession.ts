import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateCprFeedback, type CprFeedbackSummary } from '../evaluation/FeedbackGenerator';
import { WorkflowOrchestrator } from '../orchestration/WorkflowOrchestrator';
import { ScenarioManager } from '../orchestration/ScenarioManager';
import type { CprDecision, CprEvaluation, CprObservation, CprPhase, CprScenario, CprSessionState } from '../types';

interface UseCprSessionResult {
  scenario: CprScenario;
  sessionState: CprSessionState | null;
  lastDecision: CprDecision | null;
  evaluation: CprEvaluation | null;
  feedback: CprFeedbackSummary | null;
  ventilationBreathCount: number;
  ingestObservation: (observation: CprObservation) => void;
  finalizeSession: () => void;
  resetSession: () => void;
  advancePhase: (phase: CprPhase) => void;
  confirmVentilation: () => void;
  confirmPhaseAdvance: () => void;
  allScenarios: CprScenario[];
}

export function useCprSession(scenarioId?: string): UseCprSessionResult {
  const scenarioManager = useMemo(() => new ScenarioManager(scenarioId), [scenarioId]);
  const scenario = useMemo(() => scenarioManager.getScenario(), [scenarioManager]);
  const allScenarios = useMemo(() => ScenarioManager.listScenarios(), []);
  const orchestratorRef = useRef(new WorkflowOrchestrator(scenario));
  const [sessionState, setSessionState] = useState<CprSessionState | null>(null);
  const [lastDecision, setLastDecision] = useState<CprDecision | null>(null);
  const [evaluation, setEvaluation] = useState<CprEvaluation | null>(null);
  const [feedback, setFeedback] = useState<CprFeedbackSummary | null>(null);
  const [ventilationBreathCount, setVentilationBreathCount] = useState(0);

  // B5: rebuild orchestrator when scenario changes
  useEffect(() => {
    orchestratorRef.current = new WorkflowOrchestrator(scenario);
    setSessionState(null);
    setLastDecision(null);
    setEvaluation(null);
    setFeedback(null);
    setVentilationBreathCount(0);
  }, [scenario]);

  const ingestObservation = useCallback((observation: CprObservation) => {
    const result = orchestratorRef.current.ingest(observation);
    setSessionState(result.state);
    setLastDecision(result.decision);
    // Sync ventilation breath count from the single source of truth (orchestrator)
    setVentilationBreathCount(orchestratorRef.current.getVentilationBreathCount());
  }, []);

  const finalizeSession = useCallback(() => {
    const latestState = orchestratorRef.current.getLatestState();
    if (!latestState) return;
    const result = orchestratorRef.current.evaluate(latestState);
    setSessionState(latestState);
    setEvaluation(result);
    setFeedback(generateCprFeedback(result, latestState));
  }, []);

  const resetSession = useCallback(() => {
    orchestratorRef.current.reset();
    setSessionState(null);
    setLastDecision(null);
    setEvaluation(null);
    setFeedback(null);
    setVentilationBreathCount(0);
  }, []);

  const advancePhase = useCallback((phase: CprPhase) => {
    orchestratorRef.current.advancePhase(phase);
  }, []);

  const confirmVentilation = useCallback(() => {
    orchestratorRef.current.confirmVentilation();
    setVentilationBreathCount(orchestratorRef.current.getVentilationBreathCount());
  }, []);

  const confirmPhaseAdvance = useCallback(() => {
    orchestratorRef.current.confirmPhaseAdvance();
  }, []);

  return {
    scenario,
    sessionState,
    lastDecision,
    evaluation,
    feedback,
    ventilationBreathCount,
    ingestObservation,
    finalizeSession,
    resetSession,
    advancePhase,
    confirmVentilation,
    confirmPhaseAdvance,
    allScenarios,
  };
}
