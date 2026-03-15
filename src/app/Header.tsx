import React from 'react';
import { Stethoscope, Settings } from 'lucide-react';
import BackActionButton from './BackActionButton';

interface HeaderProps {
  activeModuleTitle: string | null;
  status: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

export default function Header({ activeModuleTitle, status, onBack, onOpenSettings }: HeaderProps) {
  const isModuleActive = Boolean(activeModuleTitle);
  const isActiveStatus = status === 'ACTIVE' || status === 'INTERVIEWING' || status === 'RUNNING';
  const statusToneClass = isActiveStatus
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
    : 'border-amber-500/20 bg-amber-500/10 text-amber-700';

  return (
    <header className="sticky top-0 z-50 border-b border-[#141414] bg-white/85 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            !activeModuleTitle ? 'bg-[#141414]' :
            activeModuleTitle === 'Clinical Interview' ? 'bg-[#0d9488]' :
            activeModuleTitle === 'CPR Training' ? 'bg-red-500' :
            'bg-[#141414]'
          }`}
        >
          <Stethoscope className="h-6 w-6 text-[#E4E3E0]" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10px] font-mono uppercase tracking-[0.22em] opacity-50">
            Training Home{activeModuleTitle ? ` / ${activeModuleTitle}` : ''}
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight sm:text-2xl font-display">Clinical Simulator</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-50">
            {activeModuleTitle ? `${activeModuleTitle} Module` : 'Training System v1.0'}
          </p>
        </div>
        {isModuleActive ? (
          <BackActionButton
            label="Back to Modules"
            onClick={onBack}
            size="compact"
            className="hidden lg:inline-flex ml-2"
          />
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isModuleActive ? (
          <BackActionButton
            label="Back"
            onClick={onBack}
            size="compact"
            className="lg:hidden"
          />
        ) : null}
        <button
          onClick={onOpenSettings}
          className="inline-flex items-center gap-2 rounded-full border border-[#141414]/15 bg-white/70 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:border-[#141414]/35 hover:bg-white"
          title="AI Settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden md:inline">AI Settings</span>
        </button>
        <div className={`hidden rounded-full border px-3.5 py-2 md:flex md:flex-col md:items-end ${statusToneClass}`}>
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] opacity-70">Status</span>
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
            <span className={`h-2 w-2 rounded-full ${isActiveStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {status || 'IDLE'}
          </span>
        </div>
      </div>
      </div>
    </header>
  );
}
