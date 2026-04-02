import React from 'react';
import { User, AlertCircle, ClipboardCheck, RefreshCw, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { InterviewStatus } from '../types';
import type { PatientCase, SessionState, MustAskItem } from '../types';

interface PatientInfoPanelProps {
  currentCase: PatientCase;
  status: InterviewStatus;
  diagnosis: string;
  isLoading: boolean;
  showDiagnosis: boolean;
  showTips: boolean;
  sessionState?: SessionState;
  criticalGaps?: MustAskItem[];
  onDiagnosisChange: (val: string) => void;
  onToggleDiagnosis: () => void;
  onToggleTips: () => void;
  onSubmitDiagnosis: () => void;
  beginnerMode?: boolean;
  /** Inline warning message shown above submit */
  warningMessage?: string | null;
  onDismissWarning?: () => void;
}

export default function PatientInfoPanel({
  currentCase,
  status,
  diagnosis,
  isLoading,
  showDiagnosis,
  showTips,
  sessionState,
  criticalGaps,
  onDiagnosisChange,
  onToggleDiagnosis,
  onToggleTips,
  onSubmitDiagnosis,
  beginnerMode,
  warningMessage,
  onDismissWarning,
}: PatientInfoPanelProps) {
  const { t } = useTranslation();
  const [isSupportOpen, setIsSupportOpen] = React.useState(false);
  const isInterviewing = status === InterviewStatus.INTERVIEWING;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-[#141414] rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] flex flex-col max-h-[calc(100dvh-9rem)]"
    >
      {/* Patient header — fixed */}
      <div className="bg-[#0d9488] p-5 text-[#E4E3E0] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#E4E3E0] rounded-full flex items-center justify-center shrink-0">
            <User className="text-[#0d9488] w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase">{currentCase.name}</h2>
            <p className="text-xs opacity-70 font-mono uppercase tracking-widest">{currentCase.age}y &bull; {currentCase.gender}</p>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
        <div className="space-y-1">
          <span className="text-[10px] font-mono opacity-50 uppercase">{t('interview.chiefComplaint')}</span>
          <p className="text-sm leading-relaxed italic">"{currentCase.initialComplaint}"</p>
        </div>

        {isInterviewing && sessionState && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#141414]/10 bg-[#141414]/[0.02] px-3 py-2.5">
              <p className="text-[9px] font-mono uppercase tracking-[0.16em] opacity-45">{t('interview.coverage')}</p>
              <p className="mt-0.5 text-lg font-bold">{Math.round(sessionState.overallCoverage)}%</p>
            </div>
            <div className="rounded-xl border border-[#141414]/10 bg-[#141414]/[0.02] px-3 py-2.5">
              <p className="text-[9px] font-mono uppercase tracking-[0.16em] opacity-45">{t('interview.turns')}</p>
              <p className="mt-0.5 text-lg font-bold">{sessionState.turnCount}</p>
            </div>
          </div>
        )}

        {isInterviewing && (
          <div className="pt-3 border-t border-[#141414]/10">
            <button
              onClick={() => setIsSupportOpen(!isSupportOpen)}
              className="w-full flex items-center justify-between p-2.5 bg-[#0d9488]/5 rounded-xl border border-[#0d9488]/20 hover:bg-[#0d9488]/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0d9488]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#0d9488]">{t('interview.clinicalSupport')}</span>
              </div>
              {isSupportOpen ? <ChevronUp className="w-4 h-4 text-[#0d9488]" /> : <ChevronDown className="w-4 h-4 text-[#0d9488]" />}
            </button>

            <AnimatePresence>
              {isSupportOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2.5">
                    {/* Diagnosis Cheat */}
                    <button
                      onClick={onToggleDiagnosis}
                      className={`w-full flex items-center justify-between p-2.5 text-[10px] font-bold uppercase tracking-wider border border-[#141414] rounded-xl transition-all ${showDiagnosis ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
                    >
                      <span>{showDiagnosis ? t('interview.hideDiagnosis') : t('interview.revealDiagnosis')}</span>
                      <AlertCircle className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showDiagnosis && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 font-medium">
                            {t('interview.correctDiagnosis')}: <span className="font-bold">{currentCase.correctDiagnosis}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tips */}
                    <button
                      onClick={onToggleTips}
                      className={`w-full flex items-center justify-between p-2.5 text-[10px] font-bold uppercase tracking-wider border border-[#141414] rounded-xl transition-all ${showTips ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
                    >
                      <span>{t('interview.interviewingTips')}</span>
                      <ClipboardCheck className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showTips && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-3 bg-[#0d9488]/5 border border-[#0d9488]/20 rounded-xl space-y-2">
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold uppercase text-[#0d9488]">{t('interview.hpc')}</p>
                              <ul className="text-[9px] text-[#0d9488]/80 space-y-0.5 list-disc pl-3">
                                <li><strong>{t('interview.onset')}:</strong> {t('interview.onsetQ')}</li>
                                <li><strong>{t('interview.triggers')}:</strong> {t('interview.triggersQ')}</li>
                                <li><strong>{t('interview.relief')}:</strong> {t('interview.reliefQ')}</li>
                                <li><strong>{t('interview.associated')}:</strong> {t('interview.associatedQ')}</li>
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold uppercase text-[#0d9488]">{t('interview.backgroundHistory')}</p>
                              <ul className="text-[9px] text-[#0d9488]/80 space-y-0.5 list-disc pl-3">
                                <li><strong>{t('interview.medical')}:</strong> {t('interview.medicalQ')}</li>
                                <li><strong>{t('interview.social')}:</strong> {t('interview.socialQ')}</li>
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Critical Gaps */}
                    {criticalGaps && criticalGaps.length > 0 && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          <span className="text-[9px] font-bold uppercase text-red-700">{t('interview.criticalGaps')}</span>
                        </div>
                        <ul className="space-y-0.5">
                          {criticalGaps.slice(0, 3).map((gap, i) => (
                            <li key={i} className="text-[9px] text-red-800 flex items-start gap-1">
                              <span className="opacity-50">•</span>
                              <span>{gap.subItem}</span>
                            </li>
                          ))}
                          {criticalGaps.length > 3 && (
                            <li className="text-[9px] text-red-600 italic pl-3">{t('interview.more', { count: criticalGaps.length - 3 })}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Submit footer — always visible, pinned to bottom */}
      {isInterviewing && (
        <div className="shrink-0 border-t border-[#141414]/10 p-4 space-y-3 bg-white">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono opacity-50 uppercase">{t('interview.finalDiagnosis')}</label>
            <textarea
              value={diagnosis}
              onChange={(e) => onDiagnosisChange(e.target.value)}
              placeholder={t('interview.diagnosisPlaceholder')}
              className="w-full h-20 p-3 border border-[#141414] rounded-xl text-sm focus:outline-none focus:ring-2 ring-[#0d9488]/20 resize-none"
            />
          </div>

          {/* Inline warning */}
          <AnimatePresence>
            {warningMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-amber-800 flex-1">{warningMessage}</p>
                  {onDismissWarning && (
                    <button onClick={onDismissWarning} className="opacity-40 hover:opacity-80 shrink-0">
                      <span className="text-xs">✕</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {beginnerMode && sessionState && sessionState.overallCoverage < 40 ? (
            <div className="w-full py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-center text-[10px] font-bold uppercase tracking-widest text-amber-700">
              {t('interview.reachCoverage', { value: Math.round(sessionState.overallCoverage) })}
            </div>
          ) : (
            <button
              onClick={onSubmitDiagnosis}
              disabled={!diagnosis.trim() || isLoading}
              className="w-full bg-[#0d9488] text-[#E4E3E0] py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-[#0d9488]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
              {t('interview.submitDiagnosis')}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
