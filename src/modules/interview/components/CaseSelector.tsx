import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { PatientCase } from '../types';

interface CaseSelectorProps {
  cases: PatientCase[];
  onSelectCase: (c: PatientCase) => void;
}

const DIFFICULTY_STYLE: Record<string, { color: string; border: string; hoverBorder: string; dot: string }> = {
  easy: {
    color: 'text-emerald-700',
    border: 'border-emerald-600/30',
    hoverBorder: 'hover:border-emerald-600',
    dot: 'bg-emerald-500',
  },
  medium: {
    color: 'text-amber-700',
    border: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-600',
    dot: 'bg-amber-500',
  },
  hard: {
    color: 'text-red-700',
    border: 'border-red-500/30',
    hoverBorder: 'hover:border-red-600',
    dot: 'bg-red-500',
  },
};

export default function CaseSelector({ cases, onSelectCase }: CaseSelectorProps) {
  const { t } = useTranslation();
  const order = ['easy', 'medium', 'hard'];
  const sorted = [...cases].sort(
    (a, b) => order.indexOf(a.difficulty) - order.indexOf(b.difficulty),
  );

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { label: t('interview.easy'), focusTitle: t('interview.foundational'), description: t('interview.foundationalDesc'), helper: t('interview.foundationalHelper') };
      case 'medium': return { label: t('interview.medium'), focusTitle: t('interview.mixedSignals'), description: t('interview.mixedDesc'), helper: t('interview.mixedHelper') };
      case 'hard': return { label: t('interview.hard'), focusTitle: t('interview.redFlag'), description: t('interview.redFlagDesc'), helper: t('interview.redFlagHelper') };
      default: return { label: t('interview.easy'), focusTitle: t('interview.foundational'), description: t('interview.foundationalDesc'), helper: t('interview.foundationalHelper') };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl bg-white border border-[#141414] rounded-2xl p-6 lg:p-8 space-y-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-45">{t('interview.clinicalInterview')}</p>
          <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight font-display">{t('interview.chooseLevel')}</h2>
          <p className="max-w-2xl text-sm lg:text-base leading-relaxed opacity-65">
            {t('interview.chooseLevelDesc')}
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-[#141414]/15 bg-[#141414]/[0.03] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
          {t('interview.liveCases', { count: sorted.length })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {sorted.map((c, idx) => {
          const style = DIFFICULTY_STYLE[c.difficulty] ?? DIFFICULTY_STYLE.easy;
          const text = getDifficultyText(c.difficulty);
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * idx, duration: 0.25 }}
              onClick={() => onSelectCase(c)}
              className={`w-full h-full min-h-[220px] group text-left p-5 lg:p-6 border-2 ${style.border} rounded-2xl ${style.hoverBorder} hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)] transition-all duration-200 flex flex-col justify-between gap-6`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] border ${style.border} ${style.color} transition-colors`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot} shrink-0`} />
                    {text.label}
                  </span>
                  <ChevronRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="space-y-2">
                  <div className={`font-bold uppercase text-xl tracking-tight font-display ${style.color} transition-colors`}>{text.focusTitle}</div>
                  <div className="text-sm leading-relaxed opacity-70 group-hover:opacity-90 transition-opacity">{text.description}</div>
                </div>
                <div className="rounded-xl border border-[#141414]/10 bg-[#141414]/[0.03] px-3 py-2">
                  <div className="text-[9px] font-mono uppercase tracking-[0.16em] opacity-45 mb-1">{t('common.bestFor')}</div>
                  <div className="text-xs font-medium leading-relaxed opacity-75 group-hover:opacity-95 transition-opacity">
                    {text.helper}
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-55 group-hover:opacity-100 transition-opacity">
                {t('common.openCase')}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
