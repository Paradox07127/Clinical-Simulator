import { GoogleGenAI } from '@google/genai';
import type { AIConfig } from '../types/app';
import { AIProvider } from '../types/app';

// ---------------------------------------------------------------------------
// Cached client creation (CRITICAL-2/3)
// ---------------------------------------------------------------------------

let _geminiClient: GoogleGenAI | null = null;
let _geminiKey = '';

export function getGeminiClient(config: AIConfig): GoogleGenAI {
  const key = config.textApiKey;
  if (_geminiClient && _geminiKey === key) {
    return _geminiClient;
  }
  _geminiClient = new GoogleGenAI({ apiKey: key });
  _geminiKey = key;
  return _geminiClient;
}

// ---------------------------------------------------------------------------
// fetchWithRetry (HIGH-7: robust status extraction)
// ---------------------------------------------------------------------------

function extractStatus(error: unknown): number | undefined {
  if (error !== null && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const status = e.status ?? (e.response as Record<string, unknown> | undefined)?.status ?? e.statusCode;
    if (typeof status === 'number') return status;
  }
  return undefined;
}

function buildOpenAIUrl(baseUrl?: string): string {
  const root = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  return `${root}/chat/completions`;
}

async function proxyOpenAIJson<T>(config: AIConfig, body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/proxy/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: buildOpenAIUrl(config.textBaseUrl),
      apiKey: config.textApiKey,
      body,
    }),
  });

  if (!response.ok) {
    const error = new Error(await response.text());
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

/**
 * Retry wrapper that does NOT retry on 429 (rate limit), 401 (unauthorized), or 403 (forbidden).
 */
export const fetchWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error: unknown) {
    const status = extractStatus(error);
    if (typeof status === 'number' && (status === 429 || status === 401 || status === 403)) {
      throw error;
    }
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2);
  }
};

/**
 * Generate a text completion using the configured AI provider.
 */
export async function generateText(
  config: AIConfig,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (config.textProvider === AIProvider.GEMINI) {
    const ai = getGeminiClient(config);
    const model = config.textModel || 'gemini-3.1-pro-preview';
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));

    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model,
        contents: contents as never,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          topP: 0.8,
          topK: 40,
        },
      })
    );
    return response.text || '';
  } else {
    const model = config.textModel || 'gpt-4o';
    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await fetchWithRetry(() =>
      proxyOpenAIJson<{
        choices?: Array<{ message?: { content?: string } }>;
      }>(config, {
        model,
        messages: apiMessages,
        temperature: 0.4,
      })
    );
    return response.choices?.[0]?.message?.content || '';
  }
}

/**
 * Generate a JSON completion using the configured AI provider.
 * Returns the raw JSON string.
 */
export async function generateJSON(
  config: AIConfig,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (config.textProvider === AIProvider.GEMINI) {
    const ai = getGeminiClient(config);
    const model = config.textModel || 'gemini-3.1-pro-preview';
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));

    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model,
        contents: contents as never,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.4,
          topP: 0.8,
          topK: 40,
        },
      })
    );
    return response.text || '{}';
  } else {
    const model = config.textModel || 'gpt-4o';
    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await fetchWithRetry(() =>
      proxyOpenAIJson<{
        choices?: Array<{ message?: { content?: string } }>;
      }>(config, {
        model,
        messages: apiMessages,
        response_format: { type: 'json_object' },
        temperature: 0.4,
      })
    );
    return response.choices?.[0]?.message?.content || '{}';
  }
}

/**
 * Generate a JSON completion from a single prompt (no conversation history).
 */
export async function generateJSONFromPrompt(
  config: AIConfig,
  prompt: string,
  temperature = 0.2
): Promise<string> {
  if (config.textProvider === AIProvider.GEMINI) {
    const ai = getGeminiClient(config);
    const model = config.textModel || 'gemini-3.1-pro-preview';
    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature,
        },
      })
    );
    return response.text || '{}';
  } else {
    const model = config.textModel || 'gpt-4o';
    const response = await fetchWithRetry(() =>
      proxyOpenAIJson<{
        choices?: Array<{ message?: { content?: string } }>;
      }>(config, {
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature,
      })
    );
    return response.choices?.[0]?.message?.content || '{}';
  }
}
