import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { RefreshCw, TrendingUp, AlertTriangle, ArrowRight, Compass, Play } from 'lucide-react';
import type { CprEvaluation } from '../types';
import type { CprFeedbackSummary } from '../evaluation/FeedbackGenerator';

interface EvaluationReportProps {
  evaluation: CprEvaluation;
  feedback: CprFeedbackSummary;
  onNewSession: () => void;
  onRetrySession?: () => void;
}

interface DimensionDef {
  key: string;
  label: string;
  score: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export default function EvaluationReport({
  evaluation,
  feedback,
  onNewSession,
  onRetrySession,
}: EvaluationReportProps) {
  const { t } = useTranslation();

  function getScoreConclusion(score: number): string {
    if (score >= 85) return t('cpr.readyHarder');
    if (score >= 70) return t('cpr.strongSession');
    if (score >= 50) return t('cpr.goodBase');
    return t('cpr.reviewFundamentals');
  }

  const scoreConclusion = getScoreConclusion(evaluation.totalScore);

  const dimLabels: Record<string, string> = {
    rhythm: t('cpr.rhythm'), form: t('cpr.form'), readiness: t('cpr.readiness'),
    depthProxy: t('cpr.compressionDepth'), recoil: t('cpr.chestRecoil'),
    compressionFraction: t('cpr.compressionFraction'), rateConsistency: t('cpr.rateConsistency'),
  };

  const dimensions: DimensionDef[] = [
    { key: 'rhythm', label: '按压节律', score: evaluation.breakdown.rhythm },
    { key: 'form', label: '动作姿势', score: evaluation.breakdown.form },
    { key: 'readiness', label: '准备度', score: evaluation.breakdown.readiness },
    ...(evaluation.breakdown.depthProxy != null
      ? [{ key: 'depthProxy', label: '运动幅度', score: evaluation.breakdown.depthProxy }]
      : []),
    ...(evaluation.breakdown.recoil != null
      ? [{ key: 'recoil', label: '胸廓回位', score: evaluation.breakdown.recoil }]
      : []),
    ...(evaluation.breakdown.compressionFraction != null
      ? [{ key: 'compressionFraction', label: '按压分数', score: evaluation.breakdown.compressionFraction }]
      : []),
    ...(evaluation.breakdown.rateConsistency != null
      ? [{ key: 'rateConsistency', label: '频率一致性', score: evaluation.breakdown.rateConsistency }]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid gap-6 rounded-2xl bg-[#141414] p-8 text-[#E4E3E0] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] lg:grid-cols-[minmax(0,1.4fr)_280px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#E4E3E0]/45">{t('cpr.afterAction')}</p>
            <h2 className="text-3xl lg:text-4xl font-display font-bold uppercase tracking-tight">{t('cpr.cprReview')}</h2>
            <p className="text-base leading-relaxed text-[#E4E3E0]/82">{scoreConclusion}</p>
          </div>

          <div className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/75">
            {feedback.headline}
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-[#E4E3E0]/75">{feedback.summary}</p>
        </div>

        <div className="flex flex-col justify-center rounded-2xl bg-[#E4E3E0] p-6 text-center text-[#141414]">
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-45">{t('common.overallScore')}</p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className={`mt-2 text-6xl font-display font-bold tracking-tighter ${scoreTextColor(evaluation.totalScore)}`}
          >
            {evaluation.totalScore}
          </motion.div>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest opacity-65">{t('common.sessionSummary')}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#141414] bg-white p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
        <div className="mb-4">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-50">{t('cpr.performanceBreakdown')}</div>
          <h3 className="mt-2 text-xl font-display font-bold uppercase tracking-tight">{t('cpr.scoreBreakdown')}</h3>
        </div>
        <div className="grid gap-x-8 gap-y-3 lg:grid-cols-2">
          {dimensions.map((dim, i) => (
            <motion.div
              key={dim.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{dimLabels[dim.key] || dim.label}</span>
                <span className={`text-xs font-bold ${scoreTextColor(dim.score)}`}>
                  {dim.score}%
                </span>
              </div>
              <div className="h-1.5 bg-[#141414]/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.score}%` }}
                  transition={{ duration: 0.5, delay: 0.05 * i }}
                  className={`h-full rounded-full ${scoreColor(dim.score)}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      {(evaluation.strengths.length > 0 || evaluation.gaps.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {evaluation.strengths.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-[#141414] bg-white p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0d9488]" />
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">
                {t('cpr.whatWentWell')}
              </span>
            </div>
            {evaluation.strengths.map((s, i) => (
              <div
                key={i}
                className="rounded-r-xl border-l-4 border-[#0d9488] bg-[#0d9488]/5 px-4 py-2 text-sm"
              >
                {s}
              </div>
            ))}
          </div>
          )}

          {evaluation.gaps.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-[#141414] bg-white p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">
                  {t('cpr.nextFixes')}
                </span>
              </div>
              {evaluation.gaps.map((g, i) => (
                <div
                  key={i}
                  className="rounded-r-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-2 text-sm"
                >
                  {g}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {evaluation.nextSteps.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-[#141414] bg-[#141414] p-6 text-[#E4E3E0] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">
              {t('cpr.coachNotes')}
            </span>
          </div>
          {evaluation.nextSteps.map((ns, i) => (
            <div key={i} className="flex items-start gap-2 text-sm opacity-85">
              <span className="mt-0.5 opacity-40">&#8226;</span>
              <span>{ns}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-[#141414] bg-white p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">
            {t('cpr.whatToDoNext')}
          </span>
        </div>

        <p className="text-sm font-medium leading-relaxed">
          {getScoreConclusion(evaluation.totalScore)}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {onRetrySession && (
            <button
              onClick={onRetrySession}
              className="flex items-center justify-center gap-2 border border-[#141414] px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#141414]/5 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.retry')}
            </button>
          )}
          <button
            onClick={onNewSession}
            className="flex items-center justify-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#141414]/90 transition-all shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
          >
            <Play className="w-4 h-4" />
            {t('cpr.newScenario')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
