import type { PatientCase, SessionState } from '../types';
import type { ExtractedInfo } from '../types';
import type { Message, AIConfig } from '../../../platform/types';
import { buildExtractionPrompt, safeParse } from '../tracking/InfoExtractor';
import { SessionStateTracker } from '../tracking/SessionStateTracker';
import { ProgressEngine } from '../tracking/ProgressEngine';
import { DecisionEngine, type Decision } from './DecisionEngine';
import { generatePatientResponseWithExtraction } from '../services/interviewAiService';

export interface TurnResult {
  patientMessage: Message;
  extraction: ExtractedInfo | null;
  sessionState: SessionState;
  decision: Decision;
}

export class DialogueOrchestrator {
  private tracker: SessionStateTracker;
  private progressEngine: ProgressEngine;
  private decisionEngine: DecisionEngine;
  private caseData: PatientCase;

  constructor(caseData: PatientCase) {
    this.caseData = caseData;
    this.tracker = new SessionStateTracker(caseData);
    this.progressEngine = new ProgressEngine(caseData);
    this.decisionEngine = new DecisionEngine(this.progressEngine);
    this.tracker.initialize();
  }

  async processStudentTurn(
    studentInput: string,
    history: Message[],
    config: AIConfig
  ): Promise<TurnResult> {
    // Generate patient response with extraction in a single API call
    const extractionPrompt = buildExtractionPrompt(this.caseData);
    const rawResponse = await generatePatientResponseWithExtraction(
      this.caseData,
      history,
      studentInput,
      config,
      extractionPrompt
    );

    // Parse the response
    const { patientResponse, extraction } = safeParse(rawResponse);

    // Update session state
    const sessionState = this.tracker.processTurn(extraction);

    // Run decision engine
    const decision = this.decisionEngine.evaluate(sessionState);

    const patientMessage: Message = {
      role: 'patient',
      text: patientResponse,
    };

    return {
      patientMessage,
      extraction,
      sessionState,
      decision,
    };
  }

  evaluateSubmission(): Decision | null {
    return this.decisionEngine.evaluateSubmission(this.tracker.getState());
  }

  getState(): SessionState {
    return this.tracker.getState();
  }

  getProgressEngine(): ProgressEngine {
    return this.progressEngine;
  }
}
