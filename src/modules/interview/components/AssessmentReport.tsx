import React from 'react';
import { CheckCircle2, AlertCircle, Play, RefreshCw, ArrowRight, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import type { FeedbackReport, Assessment } from '../types';

interface AssessmentReportProps {
  assessment: Assessment | null;
  feedbackReport: FeedbackReport | null;
  onNewSession: () => void;
  onRetryCase?: () => void;
}

function getScoreConclusion(score: number): string {
  if (score >= 85) return 'Ready for harder cases.';
  if (score >= 70) return 'Strong session. Tighten the gaps below.';
  if (score >= 50) return 'Good start. Repeat this case once more.';
  return 'Repeat the core interview framework before retrying.';
}

export default function AssessmentReport({ assessment, feedbackReport, onNewSession, onRetryCase }: AssessmentReportProps) {
  const overallScore = feedbackReport
    ? feedbackReport.rubricResult.weightedTotal
    : assessment?.score ?? 0;
  const scoreConclusion = getScoreConclusion(overallScore);

  return (
    <motion.div
      key="assessment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-[#141414] text-[#E4E3E0] rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_280px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E4E3E0]/45">After-Action Review</p>
            <h2 className="text-3xl font-bold uppercase tracking-tight font-display">Interview Debrief</h2>
            <p className="text-base leading-relaxed text-[#E4E3E0]/82">{scoreConclusion}</p>
          </div>

          <div className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            Interview Review
          </div>
        </div>

        <div className="rounded-2xl bg-[#E4E3E0] text-[#141414] p-6 text-center flex flex-col justify-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-45">Overall Score</p>
          <div className="mt-2 text-6xl font-bold tracking-tighter">{overallScore}</div>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] opacity-65">Session Summary</p>
        </div>
      </div>

      {/* Rubric-based assessment */}
      {feedbackReport && (
        <div className="bg-white border border-[#141414] rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <div className="mb-6">
            <h3 className="text-xl font-bold uppercase tracking-[0.14em] font-display">Performance Breakdown</h3>
          </div>

          {/* Dimension Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {feedbackReport.rubricResult.dimensionScores.map(dim => (
              <div key={dim.dimensionId} className="rounded-xl border border-[#141414]/10 bg-[#141414]/[0.02] p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-45">Dimension</div>
                    <div className="mt-1 text-sm font-bold uppercase tracking-wide">{dim.dimensionName}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold">{dim.rawScore}%</div>
                    <div className="text-[10px] font-mono uppercase opacity-45">{Math.round(dim.weight * 100)}% weight</div>
                  </div>
                </div>
                <div className="bg-[#E4E3E0] rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dim.rawScore >= 70 ? 'bg-emerald-500' :
                      dim.rawScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dim.rawScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {feedbackReport.strengths.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> What Went Well
                </h3>
                <ul className="space-y-2">
                  {feedbackReport.strengths.map((s, i) => (
                    <li key={i} className="text-sm border-l-2 border-emerald-500 pl-3 py-1 bg-emerald-500/5">{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedbackReport.areasForImprovement.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Next Fixes
                </h3>
                <ul className="space-y-2">
                  {feedbackReport.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-sm border-l-2 border-amber-500 pl-3 py-1 bg-amber-500/5">{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {feedbackReport.specificRecommendations.length > 0 && (
            <div className="bg-[#141414] text-[#E4E3E0] p-6 rounded-xl space-y-2 mb-6">
              <span className="text-[10px] font-mono opacity-50 uppercase tracking-[0.16em]">Coach Notes</span>
              <ul className="space-y-2">
                {feedbackReport.specificRecommendations.map((r, i) => (
                  <li key={i} className="text-sm">&bull; {r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          <div className="p-6 border border-[#141414] rounded-xl bg-white space-y-2">
            <span className="text-[10px] font-mono opacity-50 uppercase">Session Summary</span>
            <p className="text-sm leading-relaxed italic">&ldquo;{feedbackReport.summary}&rdquo;</p>
          </div>
        </div>
      )}

      {/* Legacy assessment fallback */}
      {!feedbackReport && assessment && (
        <div className="bg-white border border-[#141414] rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-[0.14em] font-display">Performance Breakdown</h3>
              <p className="mt-2 text-sm opacity-60">Session breakdown and feedback notes.</p>
            </div>
            <div className="text-right flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{assessment.clinicalReasoningScore}</div>
                <div className="text-[8px] font-mono uppercase opacity-50">Reasoning</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{assessment.bedsideMannerScore}</div>
                <div className="text-[8px] font-mono uppercase opacity-50">Bedside</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold tracking-tighter">{assessment.score}</div>
                <div className="text-[10px] font-mono uppercase opacity-50">Overall</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Key Questions Asked
                </h3>
                <ul className="space-y-2">
                  {assessment.keyQuestionsAsked.map((q, i) => (
                    <li key={i} className="text-sm border-l-2 border-emerald-500 pl-3 py-1 bg-emerald-500/5">{q}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Missing Information
                </h3>
                <ul className="space-y-2">
                  {assessment.missingQuestions.map((q, i) => (
                    <li key={i} className="text-sm border-l-2 border-amber-500 pl-3 py-1 bg-amber-500/5">{q}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#141414] text-[#E4E3E0] p-6 rounded-xl space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono opacity-50 uppercase">Diagnostic Accuracy ({assessment.diagnosticAccuracyScore}%)</span>
                  <p className="text-sm">{assessment.diagnosticAccuracy}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono opacity-50 uppercase">Clinical Reasoning Feedback</span>
                  <p className="text-sm">{assessment.clinicalReasoningFeedback}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono opacity-50 uppercase">Bedside Manner Feedback</span>
                  <p className="text-sm">{assessment.bedsideMannerFeedback}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono opacity-50 uppercase">Efficiency Feedback</span>
                  <p className="text-sm">{assessment.efficiencyFeedback}</p>
                </div>
              </div>
              <div className="p-6 border border-[#141414] rounded-xl bg-white space-y-2">
                <span className="text-[10px] font-mono opacity-50 uppercase">Overall Feedback</span>
                <p className="text-sm leading-relaxed italic">&ldquo;{assessment.overallFeedback}&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps section */}
      <div className="bg-white border border-[#141414] rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Next Step</span>
        </div>

        {feedbackReport?.nextCaseSuggestion && (
          <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <ArrowRight className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-mono uppercase opacity-50">Recommended Next Case</span>
              <p className="text-sm font-bold text-emerald-700">{feedbackReport.nextCaseSuggestion}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-2">
          {onRetryCase && (
            <button
              onClick={onRetryCase}
              className="flex items-center gap-2 border-2 border-[#141414] px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry This Case
            </button>
          )}
          <button
            onClick={onNewSession}
            className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#141414]/90 transition-all"
          >
            <Play className="w-4 h-4" />
            Try Another Case
          </button>
        </div>
      </div>
    </motion.div>
  );
}
