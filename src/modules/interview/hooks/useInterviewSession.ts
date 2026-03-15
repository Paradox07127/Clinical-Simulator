import { useState, useRef, useCallback } from 'react';
import type { PatientCase, SessionState } from '../types';
import type { Message, AIConfig } from '../../../platform/types';
import type { Decision } from '../orchestration/DecisionEngine';
import { DialogueOrchestrator } from '../orchestration/DialogueOrchestrator';
import { generatePatientResponse } from '../services/interviewAiService';
import { SpeechService } from '../../../platform/audio/SpeechService';
import type { VoiceContext } from '../../../platform/audio/speechSynthesis';

interface UseInterviewSessionReturn {
  messages: Message[];
  sessionState: SessionState | null;
  isLoading: boolean;
  lastDecision: Decision | null;
  startSession: (caseData: PatientCase) => void;
  processTurn: (input: string, config: AIConfig, useNewOrchestration: boolean) => Promise<void>;
  evaluateSubmission: () => Decision | null;
  resetSession: () => void;
}

function toVoiceContext(caseData: PatientCase): VoiceContext {
  return {
    gender: caseData.gender,
    age: caseData.age,
    personality: caseData.personality,
    speechPatterns: caseData.speechPatterns,
    condition: caseData.correctDiagnosis,
  };
}

export function useInterviewSession(): UseInterviewSessionReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastDecision, setLastDecision] = useState<Decision | null>(null);
  const orchestratorRef = useRef<DialogueOrchestrator | null>(null);
  const caseRef = useRef<PatientCase | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const startSession = useCallback((caseData: PatientCase) => {
    caseRef.current = caseData;
    orchestratorRef.current = new DialogueOrchestrator(caseData);
    setMessages([{ role: 'patient', text: caseData.initialComplaint }]);
    setSessionState(orchestratorRef.current.getState());
    setLastDecision(null);
  }, []);

  const processTurn = useCallback(async (
    input: string,
    config: AIConfig,
    useNewOrchestration: boolean
  ) => {
    if (!caseRef.current || isLoading) return;

    const studentMsg: Message = { role: 'student', text: input };
    setMessages(prev => [...prev, studentMsg]);
    setIsLoading(true);

    const speechService = new SpeechService(config);
    const voiceContext = toVoiceContext(caseRef.current);

    try {
      if (useNewOrchestration && orchestratorRef.current) {
        // New orchestration path with extraction
        const allMessages = [...messagesRef.current, studentMsg];
        const result = await orchestratorRef.current.processStudentTurn(
          input, allMessages, config
        );

        setMessages(prev => [...prev, result.patientMessage]);
        setSessionState(result.sessionState);
        setLastDecision(result.decision);

        // Add coach message if decision requires it
        if (result.decision.message && result.decision.type !== 'CONTINUE') {
          const coachMsg: Message = { role: 'coach', text: result.decision.message };
          setMessages(prev => [...prev, coachMsg]);
        }

        // Play audio with fallback
        void speechService.speak(result.patientMessage.text, voiceContext);
      } else {
        // Legacy path
        const patientText = await generatePatientResponse(
          caseRef.current, messagesRef.current, input, config
        );

        // Generate URL for the message object
        const audioUrl = await speechService.generateUrl(patientText, voiceContext);

        const patientMsg: Message = {
          role: 'patient',
          text: patientText,
          audioUrl: audioUrl || undefined,
        };
        setMessages(prev => [...prev, patientMsg]);

        // Play audio with fallback
        void speechService.speak(patientText, voiceContext);
      }
    } catch (error) {
      console.error("Failed to get patient response:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const evaluateSubmission = useCallback((): Decision | null => {
    if (!orchestratorRef.current) return null;
    return orchestratorRef.current.evaluateSubmission();
  }, []);

  const resetSession = useCallback(() => {
    setMessages([]);
    setSessionState(null);
    setLastDecision(null);
    orchestratorRef.current = null;
    caseRef.current = null;
  }, []);

  return {
    messages,
    sessionState,
    isLoading,
    lastDecision,
    startSession,
    processTurn,
    evaluateSubmission,
    resetSession,
  };
}
