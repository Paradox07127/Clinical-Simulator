export enum TrainingModule {
  INTERVIEW = 'INTERVIEW',
  CPR = 'CPR',
  NONE = 'NONE'
}

export enum AIProvider {
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI',
  QWEN = 'QWEN'
}

export interface AIConfig {
  // Text generation config (Dialogue & Evaluation)
  textProvider: AIProvider;
  textApiKey: string;
  textBaseUrl?: string;
  textModel?: string;

  // Speech generation config (TTS)
  speechProvider: AIProvider;
  speechApiKey: string;
  speechBaseUrl?: string;
  speechModel?: string;
}

export interface Message {
  role: 'student' | 'patient' | 'coach';
  text: string;
  audioUrl?: string;
}

export interface BaseTrainingSession {
  module: 'INTERVIEW' | 'CPR';
  status: 'IDLE' | 'RUNNING' | 'ASSESSING' | 'COMPLETED';
  startedAt: number;
}
