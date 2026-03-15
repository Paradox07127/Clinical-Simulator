import type { PatientCase } from '../types';
import type { ExtractedInfo } from '../types';

/**
 * Builds an extraction instruction to append to the patient system prompt.
 * The LLM returns a JSON object with both the patient response and extraction data.
 */
export function buildExtractionPrompt(caseData: PatientCase): string {
  const dimensions = caseData.mustAskItems.map(item =>
    `${item.dimension}: ${item.subItem}`
  ).join('\n    ');

  return `
    ADDITIONAL INSTRUCTION (invisible to user):
    After composing your patient response, also analyze what the student just asked.
    You MUST respond with a valid JSON object in this exact format:
    {
      "patientResponse": "<your in-character response as the patient>",
      "extraction": {
        "topicsCovered": [
          {
            "dimension": "<one of: HPC, PMH, DH, FH, SH, ROS, ICE, COMM>",
            "subItem": "<what was asked about>",
            "confidence": <0.0-1.0>,
            "evidence": "<quote or paraphrase of the student's question>"
          }
        ],
        "studentApproach": "<one of: open, closed, leading, empathetic>",
        "clinicalRelevance": "<one of: high, medium, low, off_track>"
      }
    }

    The trackable items for this case are:
    ${dimensions}

    Rules:
    - patientResponse MUST stay fully in character, colloquial, with speech patterns
    - Only include topicsCovered items that the student actually asked about in this turn
    - If the student made small talk or asked nothing clinically relevant, topicsCovered can be empty
    - confidence should reflect how directly the student asked about the item
  `;
}

/**
 * Safely parses a raw LLM response that should contain JSON with patientResponse + extraction.
 * Falls back gracefully if JSON parsing fails.
 */
export function safeParse(rawResponse: string): {
  patientResponse: string;
  extraction: ExtractedInfo | null;
} {
  // Try to extract JSON from the response
  const trimmed = rawResponse.trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.patientResponse) {
      return {
        patientResponse: parsed.patientResponse,
        extraction: parsed.extraction || null,
      };
    }
  } catch {
    // Not valid JSON
  }

  // Try to find JSON within markdown code blocks
  const jsonBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      if (parsed.patientResponse) {
        return {
          patientResponse: parsed.patientResponse,
          extraction: parsed.extraction || null,
        };
      }
    } catch {
      // Couldn't parse code block content
    }
  }

  // Try to find a JSON object in the text
  const jsonMatch = trimmed.match(/\{[\s\S]*"patientResponse"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        patientResponse: parsed.patientResponse,
        extraction: parsed.extraction || null,
      };
    } catch {
      // Couldn't parse matched JSON
    }
  }

  // Graceful degradation: use raw text as patient response
  return {
    patientResponse: rawResponse,
    extraction: null,
  };
}
