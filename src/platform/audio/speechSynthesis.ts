import { AIProvider } from '../types/app';
import type { AIConfig } from '../types/app';
import { encodeWAV } from './audioUtils';
import { fetchWithRetry } from '../ai/providerGateway';

/**
 * Generic voice context for TTS - no domain-specific terms.
 */
export interface VoiceContext {
  gender: string;
  age?: number;
  personality?: string;
  speechPatterns?: string[];
  condition?: string; // medical condition for emotion cues
}

/**
 * Build TTS voice/emotion instructions from context.
 * Used by Qwen3-TTS instruct model for expressive speech.
 */
export function buildVoiceInstructions(context: VoiceContext, text: string): string {
  const parts: string[] = [];

  // Base personality description
  if (context.personality) {
    parts.push(context.personality);
  }

  // Age-based vocal quality
  if (context.age) {
    if (context.age >= 60) {
      parts.push('Speak with a mature, slightly raspy voice. Pace should be slow and deliberate.');
    } else if (context.age <= 30) {
      parts.push('Speak with a youthful, clear voice. Pace can be moderate to quick.');
    }
  }

  // Condition-based emotional tone
  if (context.condition) {
    const conditionLower = context.condition.toLowerCase();
    if (conditionLower.includes('heart failure') || conditionLower.includes('cardiac')) {
      parts.push('Sound tired and breathless. Pause frequently as if catching breath.');
    } else if (conditionLower.includes('pneumonia') || conditionLower.includes('respiratory')) {
      parts.push('Sound sick and hoarse. Voice should be weak with occasional strain.');
    } else if (conditionLower.includes('asthma')) {
      parts.push('Sound slightly wheezy. Occasionally pause as if short of breath.');
    } else if (conditionLower.includes('pain') || conditionLower.includes('fracture')) {
      parts.push('Sound distressed. Voice should convey discomfort and tension.');
    }
  }

  // Convert bracket sound effects to emotion instructions
  if (context.speechPatterns) {
    const emotionMap: Record<string, string> = {
      'cough': 'Include coughing sounds between phrases.',
      'wheeze': 'Add wheezy undertones to speech.',
      'heavy breathing': 'Sound breathless with audible breathing.',
      'gasp': 'Include gasping sounds when speaking longer sentences.',
      'sigh': 'Add occasional sighs.',
      'groan': 'Include subtle groaning when describing discomfort.',
      'pause': 'Add natural pauses mid-sentence.',
      'clear throat': 'Include throat-clearing sounds.',
    };

    for (const pattern of context.speechPatterns) {
      const patternLower = pattern.toLowerCase();
      for (const [key, instruction] of Object.entries(emotionMap)) {
        if (patternLower.includes(key)) {
          parts.push(instruction);
        }
      }
    }
  }

  // Detect emotion cues in the text itself
  const textLower = text.toLowerCase();
  if (textLower.includes('worry') || textLower.includes('scared') || textLower.includes('afraid')) {
    parts.push('Convey anxiety and worry in the voice.');
  }
  if (textLower.includes('pain') || textLower.includes('hurt') || textLower.includes('ache')) {
    parts.push('Sound like you are in discomfort.');
  }

  return parts.join(' ');
}

/**
 * Strip bracket sound effects from text before sending to TTS.
 * E.g., "[*coughs*] I feel terrible" -> "I feel terrible"
 */
export function stripSoundEffects(text: string): string {
  return text
    .replace(/\[\*[^*]*\*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Generate speech audio from text using the configured provider.
 * Returns a URL to the audio blob, or null on failure.
 */
export async function generateSpeech(
  text: string,
  config: AIConfig,
  voiceContext: VoiceContext
): Promise<string | null> {
  try {
    const isFemale = voiceContext.gender.toLowerCase() === 'female';

    if (config.speechProvider === AIProvider.GEMINI) {
      const voiceName = isFemale ? 'Kore' : 'Puck';

      const response = await fetchWithRetry(() =>
        fetch('/api/proxy/gemini-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceName,
            model: config.speechModel || 'gemini-2.5-flash-preview-tts',
          }),
        })
      );

      if (!response.ok) {
        const error = new Error(await response.text());
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      const data = await response.json();
      if (data.audio) {
        return encodeWAV(data.audio, 24000);
      }
    } else if (config.speechProvider === AIProvider.OPENAI) {
      const voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' =
        isFemale ? 'nova' : 'echo';
      const baseUrl = (config.speechBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');

      const response = await fetchWithRetry(() =>
        fetch('/api/proxy/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${baseUrl}/audio/speech`,
            body: {
              model: config.speechModel || 'tts-1',
              voice,
              input: text,
            },
          }),
        })
      );

      if (!response.ok) {
        const error = new Error(await response.text());
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } else if (config.speechProvider === AIProvider.QWEN) {
      // Qwen3-TTS with emotion/instruction support via local proxy
      const baseUrl =
        config.speechBaseUrl ||
        'https://dashscope-intl.aliyuncs.com/api/v1';
      const url = `${baseUrl}/services/aigc/multimodal-generation/generation`;

      const cleanText = stripSoundEffects(text);
      const instructions = buildVoiceInstructions(voiceContext, text);

      const voice = isFemale ? 'Cherry' : 'Chelsie';
      const model = config.speechModel || 'qwen3-tts-instruct-flash';

      const response = await fetchWithRetry(() =>
        fetch('/api/proxy/qwen-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            body: {
              model,
              input: {
                text: cleanText,
                voice,
                language_type: 'en',
                instructions,
              },
            },
          }),
        })
      );

      if (!response.ok) {
        throw new Error(`Qwen TTS proxy failed: ${response.statusText}`);
      }

      const data = await response.json();
      const audioUrl =
        data?.output?.audio?.audio_url ||
        data?.output?.audio;
      if (audioUrl && typeof audioUrl === 'string') {
        return audioUrl;
      }
    }
  } catch (error) {
    console.error('Speech generation failed:', error);
  }
  return null;
}
