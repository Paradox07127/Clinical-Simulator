import React, { useRef, useEffect, useMemo } from 'react';
import { Mic, MicOff, Send, MessageSquare, Volume2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { Message, AIConfig } from '../../../platform/types';
import type { SessionState } from '../types';
import GuidanceCard from '../../../app/GuidanceCard';
interface InterviewChatProps {
  messages: Message[];
  inputText: string;
  isLoading: boolean;
  isListening: boolean;
  isSupported: boolean;
  aiConfig: AIConfig;
  onInputChange: (val: string) => void;
  onSend: (e?: React.FormEvent) => void;
  onToggleListening: () => void;
  sessionState?: SessionState;
  beginnerMode?: boolean;
}

function useGuidanceHint(
  messages: Message[],
  sessionState: SessionState | undefined,
  beginnerMode: boolean | undefined,
  t: TFunction
): { title: string; description: string; tips?: string[]; variant: 'info' | 'action' | 'success' | 'warning' } | null {
  return useMemo(() => {
    const studentMessages = messages.filter((m) => m.role === 'student');
    const studentCount = studentMessages.length;
    const turnsWithoutProgress = sessionState?.turnsWithoutProgress ?? 0;

    // Show hints: in the first few turns OR when stuck
    const shouldShow = beginnerMode
      ? studentCount < 6 || turnsWithoutProgress > 1
      : studentCount < 3 || turnsWithoutProgress > 2;

    if (!shouldShow) return null;

    // Before the student has said anything, the dedicated starter prompt card handles guidance.
    if (studentCount === 0) return null;

    // After the first exchange
    if (studentCount === 1) {
      return {
        title: t('interview.exploreFurther'),
        description: t('interview.exploreDesc'),
        tips: beginnerMode
          ? [t('interview.exploreTip1'), t('interview.exploreTip2'), t('interview.exploreTip3')]
          : undefined,
        variant: 'info' as const,
      };
    }

    // After 2 exchanges — suggest widening
    if (studentCount === 2 && beginnerMode) {
      return {
        title: t('interview.digDeeper'),
        description: t('interview.digDeeperDesc'),
        tips: [t('interview.digTip1'), t('interview.digTip2')],
        variant: 'info' as const,
      };
    }

    // Stuck: no progress for several turns
    if (turnsWithoutProgress > (beginnerMode ? 1 : 2)) {
      return {
        title: t('interview.tryDifferent'),
        description: t('interview.tryDifferentDesc'),
        tips: beginnerMode
          ? [t('interview.tryTip1'), t('interview.tryTip2'), t('interview.tryTip3')]
          : undefined,
        variant: 'warning' as const,
      };
    }

    return null;
  }, [messages, sessionState, beginnerMode, t]);
}

export default function InterviewChat({
  messages,
  inputText,
  isLoading,
  isListening,
  isSupported,
  aiConfig,
  onInputChange,
  onSend,
  onToggleListening,
  sessionState,
  beginnerMode,
}: InterviewChatProps) {
  const { t } = useTranslation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const exchangeLabel = `${messages.length} ${messages.length === 1 ? t('interview.exchange') : t('interview.exchanges')}`;
  const starterPrompts = [
    t('interview.starterPrompt1'),
    t('interview.starterPrompt2'),
    t('interview.starterPrompt3'),
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const playMessageAudio = (audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.onerror = () => URL.revokeObjectURL(audioUrl);
      audio.play().catch(() => URL.revokeObjectURL(audioUrl));
    }
  };

  const guidanceHint = useGuidanceHint(messages, sessionState, beginnerMode, t);
  const studentMessages = messages.filter((msg) => msg.role === 'student');

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white border border-[#141414] rounded-2xl h-[calc(100vh-8rem)] flex flex-col shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] sticky top-20"
    >

      <div className="p-4 border-b border-[#141414] flex items-center justify-between bg-[#0d9488]/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#0d9488]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#0d9488]">{t('interview.interviewSession')}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 border-l border-[#141414]/10 pl-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#141414]/10 bg-white px-3 py-1 text-[9px] font-mono uppercase tracking-[0.16em] opacity-65">
              {t('interview.patientSimulation')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#141414]/10 bg-white px-3 py-1 text-[9px] font-mono uppercase tracking-[0.16em] opacity-65">
              {aiConfig.speechProvider ? t('interview.voiceReady') : t('interview.voiceOff')}
            </span>
          </div>
        </div>
        <div className="text-[10px] font-mono opacity-50 uppercase">
          {exchangeLabel}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#0d9488] scrollbar-track-transparent">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'student' ? 'justify-end' : msg.role === 'coach' ? 'justify-center' : 'justify-start'}`}
          >
            {msg.role === 'coach' ? (
              <div className="max-w-[90%] p-3 bg-[#0d9488]/5 border border-[#0d9488]/20 rounded-xl text-xs text-[#0d9488] font-medium text-center">
                {msg.text}
              </div>
            ) : (
              <div className={`max-w-[80%] space-y-1 ${msg.role === 'student' ? 'items-end' : 'items-start'}`}>
                <div className={`text-[10px] font-mono uppercase opacity-50 px-2 ${msg.role === 'student' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'student' ? t('interview.student') : t('interview.patient')}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'student'
                    ? 'bg-[#0d9488] text-[#E4E3E0] rounded-tr-none'
                    : 'bg-[#E4E3E0] text-[#141414] rounded-tl-none border border-[#141414]/10'
                }`}>
                  {msg.text}
                  {msg.audioUrl && (
                    <button
                      onClick={() => playMessageAudio(msg.audioUrl)}
                      className="ml-2 inline-flex items-center justify-center p-1 rounded-full hover:bg-black/10 transition-colors"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {studentMessages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#141414]/10 bg-[#141414]/[0.02] p-5 space-y-4 md:p-6"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0d9488]" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-45">{t('interview.suggestedOpening')}</p>
                <p className="text-sm font-medium leading-relaxed">
                  {t('interview.suggestedOpeningDesc')}
                </p>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onInputChange(prompt)}
                  className={`text-left rounded-xl border border-[#141414]/10 bg-white px-4 py-3 text-sm leading-relaxed hover:border-[#0d9488]/40 hover:bg-[#0d9488]/5 transition-colors ${
                    idx === starterPrompts.length - 1 ? 'md:col-span-2' : ''
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#E4E3E0] p-4 rounded-2xl rounded-tl-none border border-[#141414]/10">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#0d9488] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#0d9488] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#0d9488] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Guidance hint above the input form */}
      <AnimatePresence>
        {guidanceHint && (
          <div className="px-6 pt-3">
            <GuidanceCard
              title={guidanceHint.title}
              description={guidanceHint.description}
              tips={guidanceHint.tips}
              variant={guidanceHint.variant}
            />
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={onSend} className="p-6 border-t border-[#141414] bg-[#0d9488]/5 flex gap-4">
        <button
          type="button"
          onClick={onToggleListening}
          title={isSupported ? t('interview.voiceInput') : t('interview.voiceNotSupported')}
          className={`p-4 rounded-xl border border-[#141414] transition-all ${
            !isSupported ? 'opacity-20 cursor-not-allowed bg-gray-100' :
            isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-[#0d9488] hover:text-white'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={t('interview.askPatient')}
          className="flex-1 p-4 border border-[#141414] rounded-xl text-sm focus:outline-none focus:ring-2 ring-[#0d9488]/20"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-[#0d9488] text-[#E4E3E0] p-4 rounded-xl hover:bg-[#0d9488]/90 disabled:opacity-50 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
}
