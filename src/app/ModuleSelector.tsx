import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, ChevronRight, Heart, Clock, Zap, Play, Stethoscope, Activity, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import type { TrainingModuleDefinition } from '../platform/types';
import { getRecentSessions, type SessionSummary } from '../platform/storage/sessionStore';

interface ModuleSelectorProps {
  modules: TrainingModuleDefinition[];
  onSelectModule: (moduleId: string) => void;
  onGuidedStart?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Heart,
};


function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'between',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'between' | 'stacked';
}) {
  const containerClass = align === 'between'
    ? 'grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] xl:items-end'
    : 'space-y-2';

  return (
    <div className={containerClass}>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-45">{eyebrow}</p>
        <h3 className="mt-1 text-2xl font-black uppercase tracking-tight font-display">{title}</h3>
      </div>
      {description ? (
        <p className={`text-sm font-medium opacity-55 leading-relaxed ${align === 'between' ? 'max-w-sm xl:justify-self-end xl:text-right' : 'max-w-2xl'}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function ModuleSelector({ modules, onSelectModule, onGuidedStart }: ModuleSelectorProps) {
  const { t } = useTranslation();
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);

  const moduleMeta = useMemo(() => ({
    INTERVIEW: { time: t('modules.interview.time'), input: t('modules.interview.input'), outcome: t('modules.interview.outcome') },
    CPR: { time: t('modules.cpr.time'), input: t('modules.cpr.input'), outcome: t('modules.cpr.outcome') },
  }), [t]);

  const previewProjects = useMemo(() => [
    {
      id: 'AED_TRAINING', title: t('preview.aed.title'), description: t('preview.aed.description'),
      icon: Activity, accent: 'bg-amber-500',
      time: t('preview.aed.time'), input: t('preview.aed.input'), outcome: t('preview.aed.outcome'),
    },
    {
      id: 'FIRST_AID', title: t('preview.firstAid.title'), description: t('preview.firstAid.description'),
      icon: Stethoscope, accent: 'bg-red-500',
      time: t('preview.firstAid.time'), input: t('preview.firstAid.input'), outcome: t('preview.firstAid.outcome'),
    },
    {
      id: 'TRAUMA_RESPONSE', title: t('preview.trauma.title'), description: t('preview.trauma.description'),
      icon: FileText, accent: 'bg-[#0d9488]',
      time: t('preview.trauma.time'), input: t('preview.trauma.input'), outcome: t('preview.trauma.outcome'),
    },
  ], [t]);

  function formatDate(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('moduleSelector.justNow');
    if (diffMins < 60) return t('moduleSelector.mAgo', { count: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t('moduleSelector.hAgo', { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return t('moduleSelector.dAgo', { count: diffDays });
    return d.toLocaleDateString();
  }

  const getModTitle = (id: string, fallback: string) => id === 'INTERVIEW' ? t('modules.interview.title') : id === 'CPR' ? t('modules.cpr.title') : fallback;
  const getModDesc = (id: string, fallback: string) => id === 'INTERVIEW' ? t('modules.interview.description') : id === 'CPR' ? t('modules.cpr.description') : fallback;

  useEffect(() => {
    setRecentSessions(getRecentSessions(3));
  }, []);

  return (
    <div className="lg:col-span-12 w-full flex flex-col items-center gap-8 pt-2 pb-8 lg:gap-10 lg:pt-4 lg:pb-10">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-4xl space-y-4 text-center lg:space-y-5"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.26em] opacity-45">{t('moduleSelector.eyebrow')}</p>
        <h2 className="text-4xl font-bold tracking-tight leading-[0.95] text-[#141414] sm:text-5xl lg:text-6xl font-display">
          {t('moduleSelector.heading1')}<br />
          {t('moduleSelector.heading2')}
        </h2>
        <p className="mx-auto max-w-3xl text-base text-[#141414]/80 font-medium lg:text-lg">
          {t('moduleSelector.description')}
        </p>

        {/* CTAs */}
        {onGuidedStart && (
          <div className="flex items-center justify-center pt-1">
            <button
              onClick={onGuidedStart}
              className="bg-[#141414] text-[#E4E3E0] px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
            >
              {t('moduleSelector.startGuided')}
            </button>
          </div>
        )}
      </motion.div>

      <section className="w-full max-w-6xl space-y-5">
        <SectionHeader
          eyebrow={t('moduleSelector.interactiveNow')}
          title={t('moduleSelector.liveModules')}
          align="stacked"
        />

        {/* Module cards */}
        <div id="module-cards" className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {modules.map((mod, idx) => {
            const IconComp = ICON_MAP[mod.icon] || MessageSquare;
            const meta = (moduleMeta as Record<string, { time: string; input: string; outcome: string }>)[mod.id] || { time: '~5 min', input: 'Mixed', outcome: 'Score + Coach' };
            return (
              <motion.button
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * idx }}
                onClick={() => onSelectModule(mod.id)}
                className="group flex h-full flex-col gap-6 rounded-2xl border border-[#141414] bg-white p-7 text-left shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] lg:p-8"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl group-hover:rotate-6 transition-transform ${
                  mod.color === 'red' ? 'bg-red-500' :
                  mod.color === 'emerald' ? 'bg-[#0d9488]' :
                  'bg-[#141414]'
                }`}>
                  <IconComp className={`w-6 h-6 ${
                    mod.color === 'red' || mod.color === 'emerald' ? 'text-white' : 'text-[#E4E3E0]'
                  }`} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold uppercase tracking-tight font-display">{getModTitle(mod.id, mod.title)}</h3>
                  <p className="max-w-md text-sm leading-relaxed opacity-65">{getModDesc(mod.id, mod.description)}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#141414]/10 mt-auto">
                  <div>
                    <span className="text-[9px] font-mono uppercase opacity-40">{t('common.time')}</span>
                    <p className="text-xs font-bold">{meta.time}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase opacity-40">{t('common.input')}</span>
                    <p className="text-xs font-bold">{meta.input}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase opacity-40">{t('common.outcome')}</span>
                    <p className="text-xs font-bold">{meta.outcome}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${
                  mod.color === 'emerald' ? 'text-[#0d9488]' : ''
                }`}>
                  {t('common.startTraining')} <ChevronRight className="w-4 h-4" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="w-full max-w-6xl space-y-5"
      >
        <SectionHeader
          eyebrow={t('moduleSelector.platformRoadmap')}
          title={t('moduleSelector.previewTracks')}
          align="stacked"
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {previewProjects.map((project, idx) => {
            const IconComp = project.icon;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 * idx }}
                className="h-full rounded-2xl border border-[#141414]/15 bg-white/80 p-5 text-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] space-y-4 lg:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${project.accent}`}>
                    <IconComp className="h-5 w-5 text-white" />
                  </div>
                  <span className="px-3 py-1 rounded-full border border-[#141414]/15 text-[10px] font-bold uppercase tracking-[0.18em] text-[#141414]/60">
                    {t('common.previewOnly')}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold uppercase tracking-tight font-display">{project.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#141414]/65">{project.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#141414]/10">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-[#141414]/40">{t('common.time')}</span>
                    <p className="text-xs font-bold mt-1">{project.time}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-[#141414]/40">{t('common.input')}</span>
                    <p className="text-xs font-bold mt-1">{project.input}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-[#141414]/40">{t('common.outcome')}</span>
                    <p className="text-xs font-bold mt-1">{project.outcome}</p>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Recent Training */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="w-full max-w-6xl"
      >
        <div className="rounded-2xl border border-[#141414] bg-white p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,0.14)]">
          <div className="space-y-4">
            <SectionHeader
              eyebrow={t('moduleSelector.recentTraining')}
              title={t('moduleSelector.sessionHistory')}
              align="stacked"
            />
          </div>

          <div className="mt-5">
            {recentSessions.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-3 md:grid-cols-2">
                {recentSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectModule(s.module)}
                    className="group flex items-center gap-3 rounded-xl border border-[#141414]/10 p-3 text-left transition-all hover:border-[#141414]/30 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,0.08)]"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      s.module === 'INTERVIEW' ? 'bg-[#0d9488]' : 'bg-red-500'
                    }`}>
                      {s.module === 'INTERVIEW'
                        ? <MessageSquare className="w-4 h-4 text-white" />
                        : <Heart className="w-4 h-4 text-white" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate leading-tight">{s.caseOrScenarioName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono uppercase opacity-45">{s.module === 'INTERVIEW' ? t('modules.interview.title') : t('modules.cpr.title')}</span>
                        <span className="text-[9px] font-mono opacity-35">{formatDate(s.timestamp)}</span>
                      </div>
                    </div>
                    <div className={`text-lg font-bold shrink-0 ${
                      s.score >= 80 ? 'text-emerald-600' : s.score >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>{s.score}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-[#141414]/15 rounded-xl bg-[#141414]/[0.02]">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4 opacity-30" />
                  <Zap className="w-4 h-4 opacity-30" />
                </div>
                <p className="text-sm opacity-50 font-medium">{t('moduleSelector.noPreviousSessions')}</p>
                <p className="text-xs opacity-30 mt-1">{t('moduleSelector.completeToSee')}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
