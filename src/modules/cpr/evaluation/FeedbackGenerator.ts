import type { CprEvaluation, CprSessionState } from '../types';

export interface CprFeedbackSummary {
  headline: string;
  summary: string;
  evaluation: CprEvaluation;
  /** Per-cycle comparison text, if multiple cycles were completed */
  cycleComparison?: string;
  /** Specific improvement suggestion based on the weakest scoring dimension */
  focusArea?: string;
}

/** Identify the weakest dimension and return an improvement suggestion */
function identifyFocusArea(breakdown: CprEvaluation['breakdown']): string {
  const dimensions: { name: string; score: number; advice: string }[] = [
    { name: '按压节律', score: breakdown.rhythm, advice: 'AHA 建议每分钟 100-120 次按压。可使用节拍器（110 BPM）辅助练习。' },
    { name: '动作姿势', score: breakdown.form, advice: '注意锁定肘关节、双手居中于胸骨、肩膀正对双手。' },
    { name: '运动幅度', score: breakdown.depthProxy ?? 100, advice: 'AHA 建议按压深度至少 5 厘米但不超过 6 厘米。请用体重而非手臂力量按压。' },
    { name: '胸廓回位', score: breakdown.recoil ?? 100, advice: '每次按压后允许胸廓完全回弹。稍微抬起双手，避免倚靠在胸部。' },
    { name: '按压分数', score: breakdown.compressionFraction ?? 100, advice: 'AHA 建议尽量减少中断，保持按压分数在 60% 以上。' },
    { name: '频率一致性', score: breakdown.rateConsistency ?? 100, advice: '稳定的节奏比忽快忽慢更有效。可使用节拍器辅助保持节奏。' },
  ];

  const weakest = dimensions.reduce((min, d) => d.score < min.score ? d : min, dimensions[0]);
  return `重点改进：${weakest.name}（${weakest.score}/100）。${weakest.advice}`;
}

/** Generate per-cycle comparison text */
function generateCycleComparison(state: CprSessionState): string | undefined {
  const cycles = state.cycleHistory ?? [];
  if (cycles.length < 2) return undefined;

  const lines: string[] = [`已完成 ${cycles.length} 个周期：`];
  for (const cycle of cycles) {
    lines.push(
      `  周期 ${cycle.cycleNumber}：平均 ${cycle.averageRate} 次/分钟，共 ${cycle.compressionCount} 次按压，一致性 ${cycle.rateConsistency}/100`
    );
  }

  const first = cycles[0];
  const last = cycles[cycles.length - 1];
  const rateDelta = last.averageRate - first.averageRate;
  if (Math.abs(rateDelta) > 5) {
    lines.push(
      rateDelta < 0
        ? `频率从周期 1 到周期 ${last.cycleNumber} 下降了 ${Math.abs(rateDelta)} 次/分钟——请注意疲劳影响。`
        : `频率上升了 ${rateDelta} 次/分钟——可能在压力下加速了。`
    );
  } else {
    lines.push('各周期频率保持一致——耐力表现良好。');
  }

  return lines.join('\n');
}

export function generateCprFeedback(
  evaluation: CprEvaluation,
  state: CprSessionState
): CprFeedbackSummary {
  const headline = evaluation.totalScore >= 85
    ? 'CPR 操作达标，表现优秀。'
    : evaluation.totalScore >= 70
      ? 'CPR 操作基本合格，有可改进的空间。'
      : 'CPR 操作需要更多引导练习。';

  const parts: string[] = [
    `平均频率 ${state.averageRate || 0} 次/分钟`,
    `手部可见率 ${Math.round(state.visibleRatio * 100)}%`,
    `手臂伸直率 ${Math.round(state.straightArmRatio * 100)}%`,
  ];

  // Include new metrics in summary when available
  if (state.compressionFraction !== undefined) {
    parts.push(`按压分数 ${Math.round(state.compressionFraction * 100)}%`);
  }
  if (state.rateConsistency !== undefined) {
    parts.push(`频率一致性 ${state.rateConsistency}/100`);
  }
  if (state.recoilRatio !== undefined) {
    parts.push(`胸廓回位率 ${Math.round(state.recoilRatio * 100)}%`);
  }

  const summary = parts.join(', ') + '.';

  const focusArea = identifyFocusArea(evaluation.breakdown);
  const cycleComparison = generateCycleComparison(state);

  return {
    headline,
    summary,
    evaluation,
    cycleComparison,
    focusArea,
  };
}
