import type { ComponentType } from 'react';
import type { AIConfig } from './app';

export interface TrainingModuleDefinition {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  color?: string;
  available: boolean;
}

export interface ModuleScreenProps {
  aiConfig: AIConfig;
  onConfigChange: (config: AIConfig) => void;
  onBack: () => void;
  registerGlobalBackHandler?: (handler: (() => void) | null) => void;
}

export interface ModuleEntry {
  Screen: ComponentType<ModuleScreenProps>;
}
