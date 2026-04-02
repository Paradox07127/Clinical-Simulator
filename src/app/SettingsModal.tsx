import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIProvider } from '../platform/types';
import type { AIConfig } from '../platform/types';

interface SettingsModalProps {
  show: boolean;
  aiConfig: AIConfig;
  onClose: () => void;
  onConfigChange: (config: AIConfig) => void;
}

export default function SettingsModal({ show, aiConfig, onClose, onConfigChange }: SettingsModalProps) {
  const { t } = useTranslation();
  const providerButtonClass = (isActive: boolean) => `rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
    isActive
      ? 'border-[#141414] bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]'
      : 'border-[#141414]/15 bg-white text-[#141414] hover:border-[#141414]/35 hover:bg-[#141414]/[0.02]'
  }`;

  const inputClass = 'w-full rounded-xl border border-[#141414]/20 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 ring-[#141414]/10';

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#141414]/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-[#141414] bg-[#E4E3E0] shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]"
          >
            <div className="border-b border-[#141414]/10 bg-white/65 px-6 py-5 lg:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-50">{t('settings.label')}</p>
                  <h2 className="text-2xl font-black uppercase tracking-tight font-display lg:text-3xl">{t('settings.title')}</h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-[#141414]/65">
                    {t('settings.description')}
                  </p>
                </div>
                <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-[#141414]/5">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-6 py-6 lg:px-8">
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="space-y-5 rounded-2xl border border-[#141414]/10 bg-white/80 p-5 shadow-[6px_6px_0px_0px_rgba(20,20,20,0.08)]">
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">{t('settings.conversation')}</p>
                    <h3 className="text-lg font-bold uppercase tracking-tight font-display">{t('settings.dialogueEval')}</h3>
                    <p className="text-sm leading-relaxed text-[#141414]/60">
                      {t('settings.dialogueDesc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-50">{t('settings.provider')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => onConfigChange({...aiConfig, textProvider: AIProvider.GEMINI, textModel: 'gemini-3.1-pro-preview'})}
                        className={providerButtonClass(aiConfig.textProvider === AIProvider.GEMINI)}
                      >
                        Gemini
                      </button>
                      <button
                        onClick={() => onConfigChange({...aiConfig, textProvider: AIProvider.OPENAI, textModel: 'gpt-4o'})}
                        className={providerButtonClass(aiConfig.textProvider === AIProvider.OPENAI)}
                      >
                        OpenAI
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-50">{t('settings.apiKey')}</label>
                    <input
                      type="password"
                      value={aiConfig.textApiKey}
                      onChange={(e) => onConfigChange({...aiConfig, textApiKey: e.target.value})}
                      placeholder="API Key"
                      className={inputClass}
                    />
                  </div>

                  {aiConfig.textProvider === AIProvider.OPENAI && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-50">{t('settings.baseUrl')}</label>
                      <input
                        type="text"
                        value={aiConfig.textBaseUrl || ''}
                        onChange={(e) => onConfigChange({...aiConfig, textBaseUrl: e.target.value})}
                        placeholder="https://api.openai.com/v1"
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-50">{t('settings.model')}</label>
                    <input
                      type="text"
                      value={aiConfig.textModel || ''}
                      onChange={(e) => onConfigChange({...aiConfig, textModel: e.target.value})}
                      placeholder="Model Name"
                      className={inputClass}
                    />
                  </div>
                </section>

                <section className="space-y-5 rounded-2xl border border-[#141414]/10 bg-white/80 p-5 shadow-[6px_6px_0px_0px_rgba(20,20,20,0.08)]">
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">{t('settings.voice')}</p>
                    <h3 className="text-lg font-bold uppercase tracking-tight font-display">{t('settings.voiceSettings')}</h3>
                    <p className="text-sm leading-relaxed text-[#141414]/60">
                      {t('settings.voiceDesc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-50">{t('settings.provider')}</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => onConfigChange({...aiConfig, speechProvider: AIProvider.GEMINI, speechModel: 'gemini-2.5-flash-preview-tts'})}
                        className={providerButtonClass(aiConfig.speechProvider === AIProvider.GEMINI)}
                      >
                        Gemini
                      </button>
                      <button
                        onClick={() => onConfigChange({...aiConfig, speechProvider: AIProvider.OPENAI, speechModel: 'tts-1'})}
                        className={providerButtonClass(aiConfig.speechProvider === AIProvider.OPENAI)}
                      >
                        OpenAI
                      </button>
                      <button
                        onClick={() => onConfigChange({...aiConfig, speechProvider: AIProvider.QWEN, speechModel: 'qwen3-tts-instruct-flash'})}
                        className={providerButtonClass(aiConfig.speechProvider === AIProvider.QWEN)}
                      >
                        Qwen
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-50">{t('settings.apiKey')}</label>
                    <input
                      type="password"
                      value={aiConfig.speechApiKey}
                      onChange={(e) => onConfigChange({...aiConfig, speechApiKey: e.target.value})}
                      placeholder="API Key"
                      className={inputClass}
                    />
                  </div>

                  {(aiConfig.speechProvider === AIProvider.OPENAI || aiConfig.speechProvider === AIProvider.QWEN) && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-50">{t('settings.baseUrl')}</label>
                      <input
                        type="text"
                        value={aiConfig.speechBaseUrl || ''}
                        onChange={(e) => onConfigChange({...aiConfig, speechBaseUrl: e.target.value})}
                        placeholder={aiConfig.speechProvider === AIProvider.OPENAI ? 'https://api.openai.com/v1' : 'https://dashscope-intl.aliyuncs.com/api/v1'}
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-50">{t('settings.modelVoice')}</label>
                    <input
                      type="text"
                      value={aiConfig.speechModel || ''}
                      onChange={(e) => onConfigChange({...aiConfig, speechModel: e.target.value})}
                      placeholder="Model Name"
                      className={inputClass}
                    />
                  </div>
                </section>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#141414]/10 bg-white/65 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <p className="text-sm leading-relaxed text-[#141414]/60">
                {t('settings.autoSaved')}
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl bg-[#141414] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#E4E3E0] transition-all hover:bg-[#141414]/90"
              >
                {t('common.done')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
