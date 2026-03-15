import type { TrainingModuleDefinition, ModuleEntry } from '../platform/types';

export const MODULE_REGISTRY: TrainingModuleDefinition[] = [
  {
    id: 'INTERVIEW',
    title: 'Clinical Interview',
    description: 'Practice patient history taking, diagnostic reasoning, and bedside manner with AI-driven patients.',
    icon: 'MessageSquare',
    color: 'emerald',
    available: true,
  },
  {
    id: 'CPR',
    title: 'CPR Training',
    description: 'Simulate emergency resuscitation procedures, compression rhythm, and AED operation protocols.',
    icon: 'Heart',
    color: 'red',
    available: true,
  },
];

const moduleLoaders: Record<string, () => Promise<ModuleEntry>> = {
  INTERVIEW: async () => {
    const { interviewModule } = await import('../modules/interview');
    return interviewModule;
  },
  CPR: async () => {
    const { cprModule } = await import('../modules/cpr');
    return cprModule;
  },
};

export async function loadModule(id: string): Promise<ModuleEntry | null> {
  const loader = moduleLoaders[id];
  if (!loader) return null;
  return loader();
}
