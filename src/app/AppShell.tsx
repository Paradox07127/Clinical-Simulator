import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ModuleEntry } from '../platform/types';
import { MODULE_REGISTRY, loadModule } from './moduleRegistry';
import { useAIConfig } from './useAIConfig';
import Header from './Header';
import SettingsModal from './SettingsModal';
import ModuleSelector from './ModuleSelector';

export default function AppShell() {
  const { t } = useTranslation();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [moduleEntry, setModuleEntry] = useState<ModuleEntry | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [globalBackHandler, setGlobalBackHandler] = useState<(() => void) | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  const { aiConfig, setAiConfig } = useAIConfig();

  const handleSelectModule = useCallback(async (moduleId: string) => {
    setGlobalBackHandler(null);
    setActiveModuleId(moduleId);
    try {
      const entry = await loadModule(moduleId);
      if (!entry) {
        setActiveModuleId(null);
        setGlobalBackHandler(null);
        return;
      }
      setModuleEntry(entry);
    } catch (error) {
      console.error('Failed to load module:', error);
      setActiveModuleId(null);
      setModuleEntry(null);
      setGlobalBackHandler(null);
    }
  }, []);

  const handleBack = useCallback(() => {
    setActiveModuleId(null);
    setModuleEntry(null);
    setGlobalBackHandler(null);
  }, []);

  const registerGlobalBackHandler = useCallback((handler: (() => void) | null) => {
    setGlobalBackHandler(() => handler);
  }, []);

  const handleHeaderBack = useCallback(() => {
    if (globalBackHandler) {
      globalBackHandler();
      return;
    }
    handleBack();
  }, [globalBackHandler, handleBack]);

  const activeModuleDef = activeModuleId
    ? MODULE_REGISTRY.find(m => m.id === activeModuleId)
    : null;

  const getModuleTitle = (id: string | undefined) => {
    if (id === 'INTERVIEW') return t('modules.interview.title');
    if (id === 'CPR') return t('modules.cpr.title');
    return activeModuleDef?.title || t('header.title');
  };

  const mainViewportClass = activeModuleId
    ? 'overflow-visible lg:overflow-hidden'
    : 'overflow-y-auto';
  const mainSpacingClass = activeModuleId
    ? 'pt-4 pb-16'
    : 'pt-8 pb-16 lg:pt-10';

  useEffect(() => {
    if (!activeModuleId) {
      mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeModuleId]);

  return (
    <div className="min-h-screen lg:h-dvh lg:overflow-hidden bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0] relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      {/* Background watermark text — z-[1], behind all content */}
      <div className="fixed bottom-0 left-0 right-0 text-center opacity-[0.04] pointer-events-none z-[1] overflow-hidden">
        <div className="text-[100px] font-bold tracking-tighter uppercase leading-none whitespace-nowrap">
          {getModuleTitle(activeModuleId ?? undefined)}
        </div>
        <div className="text-[100px] font-bold tracking-tighter uppercase leading-none outline-text whitespace-nowrap">{t('header.title')}</div>
      </div>

      {/* Main content — z-10, above watermark */}
      <div className="relative z-10 flex flex-col min-h-screen lg:h-dvh">
        <Header
          activeModuleTitle={activeModuleId ? getModuleTitle(activeModuleId) : null}
          activeModuleId={activeModuleId}
          status={activeModuleId ? 'ACTIVE' : 'IDLE'}
          onBack={handleHeaderBack}
          onOpenSettings={() => setShowSettings(true)}
        />

        <main
          ref={mainRef}
          className={`flex-1 min-h-0 w-full ${mainViewportClass}`}
        >
        <div className={`max-w-[1600px] mx-auto w-full px-4 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-5 ${mainSpacingClass}`}>
          {!activeModuleId ? (
            <ModuleSelector modules={MODULE_REGISTRY} onSelectModule={handleSelectModule} />
          ) : moduleEntry ? (
            <moduleEntry.Screen
              aiConfig={aiConfig}
              onConfigChange={setAiConfig}
              onBack={handleBack}
              registerGlobalBackHandler={registerGlobalBackHandler}
            />
          ) : (
            <div className="lg:col-span-12 flex items-center justify-center h-[400px]">
              <p className="text-sm opacity-50 font-mono uppercase">{t('common.loading')}</p>
            </div>
          )}
        </div>
        </main>

        <style>{`
          .outline-text {
            color: transparent;
            -webkit-text-stroke: 1px #141414;
          }
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: #141414;
            border-radius: 10px;
          }
        `}</style>

        <SettingsModal
          show={showSettings}
          aiConfig={aiConfig}
          onClose={() => setShowSettings(false)}
          onConfigChange={setAiConfig}
        />
      </div>
    </div>
  );
}
