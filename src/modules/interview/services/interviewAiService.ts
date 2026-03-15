import type { PatientCase } from '../types';
import type { Message, AIConfig } from '../../../platform/types';
import type { Assessment } from '../types';
import { generateText, generateJSON, generateJSONFromPrompt } from '../../../platform/ai/providerGateway';

/**
 * Generate patient response with extraction data in a single API call.
 * Returns raw JSON string that should be parsed with safeParse().
 */
export async function generatePatientResponseWithExtraction(
  caseData: PatientCase,
  history: Message[],
  studentInput: string,
  config: AIConfig,
  extractionPrompt: string
): Promise<string> {
  const systemInstruction = `
    ROLE: You are simulating a patient named ${caseData.name} (${caseData.age}y, ${caseData.gender}) for a medical student's training.
    DIAGNOSIS: The underlying condition you have is ${caseData.correctDiagnosis}. You must stay strictly consistent with the typical symptoms and progression of this condition.

    CASE FACTS:
    - Initial Complaint: ${caseData.initialComplaint}
    - Duration: ${caseData.hiddenDetails.duration}
    - Triggers: ${caseData.hiddenDetails.triggers}
    - Past History: ${caseData.hiddenDetails.pastHistory}
    - Associated Symptoms: ${caseData.hiddenDetails.associatedSymptoms}
    - Lifestyle: ${caseData.hiddenDetails.lifestyle}
    ${caseData.hiddenDetails.familyHistory ? `- Family History: ${caseData.hiddenDetails.familyHistory}` : ''}
    ${caseData.hiddenDetails.drugHistory ? `- Drug History: ${caseData.hiddenDetails.drugHistory}` : ''}
    ${caseData.hiddenDetails.reviewOfSystems ? `- Review of Systems: ${caseData.hiddenDetails.reviewOfSystems}` : ''}

    ${caseData.personality ? `PERSONALITY: ${caseData.personality}` : ''}
    ${caseData.speechPatterns ? `SPEECH PATTERNS (use these naturally): ${caseData.speechPatterns.join(', ')}` : ''}

    STRICT GUIDELINES:
    1. DO NOT volunteer hidden details unless explicitly asked.
    2. If asked about something not in the facts, provide an answer that is medically consistent with ${caseData.correctDiagnosis}.
    3. Use colloquial, non-medical language. Say "I feel tight in my chest" instead of "I have dyspnea".
    4. Maintain a consistent personality. If you are old and tired, sound like it.
    5. EXPRESSIVE SPEECH: Include realistic symptom sounds in brackets like [*coughs*], [*wheezes*], [*heavy breathing*], or [*gasps for air*] frequently if relevant to ${caseData.correctDiagnosis}.
    6. NEVER break character. Do not admit you are an AI.

    ${extractionPrompt}
  `;

  const messages = [
    ...history.map(m => ({
      role: m.role === 'student' ? 'user' as const : 'assistant' as const,
      content: m.text,
    })),
    { role: 'user' as const, content: studentInput },
  ];

  const result = await generateJSON(config, systemInstruction, messages);
  return result || '{"patientResponse": "I\'m sorry, I\'m feeling a bit confused right now..."}';
}

/**
 * Generate a simple patient response without extraction (legacy path).
 */
export async function generatePatientResponse(
  caseData: PatientCase,
  history: Message[],
  studentInput: string,
  config: AIConfig
): Promise<string> {
  const systemInstruction = `
    ROLE: You are simulating a patient named ${caseData.name} (${caseData.age}y, ${caseData.gender}) for a medical student's training.
    DIAGNOSIS: The underlying condition you have is ${caseData.correctDiagnosis}. You must stay strictly consistent with the typical symptoms and progression of this condition.

    CASE FACTS:
    - Initial Complaint: ${caseData.initialComplaint}
    - Duration: ${caseData.hiddenDetails.duration}
    - Triggers: ${caseData.hiddenDetails.triggers}
    - Past History: ${caseData.hiddenDetails.pastHistory}
    - Associated Symptoms: ${caseData.hiddenDetails.associatedSymptoms}
    - Lifestyle: ${caseData.hiddenDetails.lifestyle}

    STRICT GUIDELINES:
    1. DO NOT volunteer hidden details unless explicitly asked.
    2. If asked about something not in the facts, provide an answer that is medically consistent with ${caseData.correctDiagnosis}.
    3. Use colloquial, non-medical language. Say "I feel tight in my chest" instead of "I have dyspnea".
    4. Maintain a consistent personality. If you are old and tired, sound like it.
    5. EXPRESSIVE SPEECH: Include realistic symptom sounds in brackets like [*coughs*], [*wheezes*], [*heavy breathing*], or [*gasps for air*] frequently if relevant to ${caseData.correctDiagnosis}.
    6. NEVER break character. Do not admit you are an AI.
  `;

  const messages = [
    ...history.map(m => ({
      role: m.role === 'student' ? 'user' as const : 'assistant' as const,
      content: m.text,
    })),
    { role: 'user' as const, content: studentInput },
  ];

  const result = await generateText(config, systemInstruction, messages);
  return result || "I'm sorry, I'm feeling a bit confused right now...";
}

/**
 * Legacy evaluation: evaluate a clinical interview using LLM.
 */
export async function evaluateInterview(
  caseData: PatientCase,
  history: Message[],
  studentDiagnosis: string,
  config: AIConfig
): Promise<Assessment> {
  const prompt = `
    Evaluate a medical student's clinical interview based on the following context.

    CASE DATA: ${JSON.stringify(caseData)}
    INTERVIEW HISTORY: ${JSON.stringify(history)}
    STUDENT'S SUBMITTED DIAGNOSIS & PLAN: ${studentDiagnosis}

    Please provide a comprehensive evaluation in JSON format with the following fields:
    - score: Overall score (0-100)
    - clinicalReasoningScore: Score for the value and logic of questions asked (0-100)
    - bedsideMannerScore: Score for empathy, professionalism, and attitude towards the patient (0-100)
    - diagnosticAccuracyScore: Score for the accuracy of the final diagnosis and plan (0-100)
    - keyQuestionsAsked: List of important questions the student successfully asked.
    - missingQuestions: List of critical questions the student failed to ask.
    - efficiencyFeedback: Feedback on how efficiently the student reached the diagnosis.
    - diagnosticAccuracy: Detailed feedback on the diagnosis and medical plan.
    - bedsideMannerFeedback: Specific feedback on the student's communication style and empathy.
    - clinicalReasoningFeedback: Feedback on the student's logical approach and question quality.
    - overallFeedback: A summary of the performance.

    CRITERIA:
    1. Clinical Reasoning: Did the student ask targeted questions to rule in/out differentials?
    2. Physical Examination: Did the student perform the relevant physical exams provided in the case data?
    3. Bedside Manner: Was the student polite? Did they acknowledge the patient's pain/concerns? Did they use jargon or simple language?
    4. Diagnostic Accuracy: How close was the student's diagnosis to ${caseData.correctDiagnosis}?
  `;

  const responseText = await generateJSONFromPrompt(config, prompt);
  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`Failed to parse evaluation response as JSON. Raw response: ${responseText.slice(0, 200)}`);
  }
}
