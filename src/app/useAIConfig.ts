import { useState, useEffect } from 'react';
import { AIProvider } from '../platform/types';
import type { AIConfig } from '../platform/types';
import { loadConfig, saveConfig } from '../platform/storage/sessionStore';

const AI_CONFIG_STORAGE_KEY = 'ai_config';

/**
 * Default config when no saved config exists.
 * API keys are NOT read from env — they must be entered via Settings UI
 * or provided server-side via the proxy (server.ts reads process.env).
 *
 * SECURITY: VITE_-prefixed env vars get baked into the client JS bundle.
 * Never put real API keys in VITE_* variables.
 */
function getDefaultConfig(): AIConfig {
  return {
    textProvider: AIProvider.OPENAI,
    textApiKey: '',
    textModel: 'gpt-4o',
    speechProvider: AIProvider.GEMINI,
    speechApiKey: '',
    speechModel: 'gemini-2.5-flash-preview-tts',
  };
}

export function useAIConfig() {
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = loadConfig<AIConfig | null>(AI_CONFIG_STORAGE_KEY, null);
    return saved ?? getDefaultConfig();
  });

  useEffect(() => {
    saveConfig(AI_CONFIG_STORAGE_KEY, aiConfig);
  }, [aiConfig]);

  return { aiConfig, setAiConfig };
}
