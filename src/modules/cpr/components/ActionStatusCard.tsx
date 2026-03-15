import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Heart } from 'lucide-react';
import type { CprDecision, CprSessionState } from '../types';

interface ActionStatusCardProps {
  sessionState: CprSessionState | null;
  decision: CprDecision | null;
  compressionCount: number;
}

type OverallStatus = 'GOOD' | 'WARNING' | 'BAD' | 'IDLE';

function deriveOverallStatus(
  decision: CprDecision | null,
  sessionState: CprSessionState | null,
): OverallStatus {
  if (!decision || !sessionState || sessionState.currentRate === 0) return 'IDLE';
  const { rhythmStatus, formStatus } = decision;
  if (rhythmStatus === 'GOOD' && formStatus === 'GOOD') return 'GOOD';
  if (formStatus === 'HANDS_HIDDEN' || rhythmStatus === 'FAST') return 'BAD';
  return 'WARNING';
}

const STATUS_CONFIG: Record<OverallStatus, { icon: typeof CheckCircle2; iconColor: string; pill: string; label: string }> = {
  GOOD: { icon: CheckCircle2, iconColor: 'text-[#0d9488]', pill: 'border-[#0d9488]/20 bg-[#0d9488]/10 text-[#0d9488]', label: 'On Target' },
  WARNING: { icon: AlertTriangle, iconColor: 'text-amber-600', pill: 'border-amber-500/20 bg-amber-500/10 text-amber-700', label: 'Adjust Form' },
  BAD: { icon: XCircle, iconColor: 'text-red-500', pill: 'border-red-500/20 bg-red-500/10 text-red-600', label: 'Fix Required' },
  IDLE: { icon: Heart, iconColor: 'text-[#141414]/30', pill: 'border-[#141414]/10 bg-[#141414]/[0.04] text-[#141414]/55', label: 'Waiting' },
};

const RHYTHM_COLOR: Record<string, string> = {
  GOOD: 'text-emerald-600',
  SLOW: 'text-amber-500',
  FAST: 'text-red-500',
  WAITING: 'text-[#141414]/30',
};

function CheckRow({ label, ok, detail }: { label: string; ok: boolean | null; detail?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium opacity-70">{label}</span>
      <div className="flex items-center gap-1.5">
        {detail && <span className="text-[10px] font-mono opacity-50">{detail}</span>}
        {ok === null ? (
          <span className="w-3.5 h-3.5 rounded-full bg-[#141414]/10" />
        ) : ok ? (
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px] font-bold">✓</span>
        ) : (
          <span className="w-3.5 h-3.5 rounded-full bg-red-400 flex items-center justify-center text-white text-[8px] font-bold">✗</span>
        )}
      </div>
    </div>
  );
}

export default function ActionStatusCard({ sessionState, decision, compressionCount }: ActionStatusCardProps) {
  const overall = deriveOverallStatus(decision, sessionState);
  const config = STATUS_CONFIG[overall];
  const StatusIcon = config.icon;

  const currentRate = sessionState?.currentRate ?? 0;
  const rhythmColor = RHYTHM_COLOR[decision?.rhythmStatus ?? 'WAITING'];

  const hasData = currentRate > 0;
  const armsOk = hasData ? (sessionState?.straightArmRatio ?? 0) >= 0.55 : null;
  const handsOk = hasData ? (sessionState?.centeredRatio ?? 0) >= 0.55 : null;
  const visibleOk = hasData ? (sessionState?.visibleRatio ?? 0) >= 0.5 : null;
  const recoilOk = hasData ? (sessionState?.recoilRatio ?? 0) >= 0.5 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-2xl border border-[#141414] bg-white p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-colors duration-300"
    >
      {/* Header: status icon + label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Live Feedback</span>
        </div>
        <div className="flex items-center gap-2">
          {compressionCount > 0 && (
            <span className="text-[10px] font-mono opacity-40">#{compressionCount}</span>
          )}
          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${config.pill}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Rate display */}
      <div className="text-center">
        <motion.div
          key={currentRate}
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          className={`font-display text-5xl font-bold leading-none ${rhythmColor}`}
        >
          {currentRate || '—'}
        </motion.div>
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mt-1">
          CPM {currentRate > 0 && (currentRate >= 100 && currentRate <= 120 ? '· On Target' : currentRate < 100 ? '· Too Slow' : '· Too Fast')}
        </div>
      </div>

      {/* Guidance message */}
      {decision?.message && (
        <motion.div
          key={decision.message}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs font-semibold opacity-80 px-1"
        >
          {decision.message}
        </motion.div>
      )}

      {/* Divider */}
      <div className="border-t border-[#141414]/10" />

      {/* Form checks */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-50">Form Check</div>
        <CheckRow label="Hands Visible" ok={visibleOk} detail={hasData ? `${Math.round((sessionState?.visibleRatio ?? 0) * 100)}%` : undefined} />
        <CheckRow label="Arms Straight" ok={armsOk} detail={hasData ? `${Math.round((sessionState?.straightArmRatio ?? 0) * 100)}%` : undefined} />
        <CheckRow label="Hands Centered" ok={handsOk} detail={hasData ? `${Math.round((sessionState?.centeredRatio ?? 0) * 100)}%` : undefined} />
        <CheckRow label="Full Recoil" ok={recoilOk} detail={hasData ? `${Math.round((sessionState?.recoilRatio ?? 0) * 100)}%` : undefined} />
      </div>

      {/* Stats row */}
      {hasData && (
        <>
          <div className="border-t border-[#141414]/10" />
          <div className="grid grid-cols-3 gap-1 text-center">
            <div>
              <div className="text-sm font-bold">{sessionState?.averageRate ?? 0}</div>
              <div className="text-[8px] font-mono uppercase opacity-35">Avg</div>
            </div>
            <div>
              <div className="text-sm font-bold">{Math.round((sessionState?.compressionFraction ?? 0) * 100)}%</div>
              <div className="text-[8px] font-mono uppercase opacity-35">CF</div>
            </div>
            <div>
              <div className="text-sm font-bold">{sessionState?.rateConsistency ?? 0}</div>
              <div className="text-[8px] font-mono uppercase opacity-35">Consist.</div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
