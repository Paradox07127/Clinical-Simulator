import type { CprDecision, CprSessionState } from '../types';

/** Phase instruction text for pre-compression BLS steps */
const PHASE_INSTRUCTIONS: Record<string, string> = {
  BRIEFING: '请查看场景说明，准备好后点击"确认"开始。',
  SCENE_SAFETY: '环顾四周，确认现场是否安全。确认后点击"确认"。',
  CHECK_RESPONSE: '拍打伤者肩膀并大声呼唤"你还好吗？"确认后点击"确认"。',
  CALL_FOR_HELP: '拨打 120（或指派旁人拨打）并请求 AED。确认后点击"确认"。',
  CHECK_BREATHING: '看、听、感觉是否有呼吸（最多 10 秒）。确认后点击"确认"。',
  VENTILATION: '仰头抬颏，实施 2 次人工呼吸。确认后点击"确认"。',
  AED_PROMPT: 'AED 已到达，请按照 AED 语音提示操作。确认后点击"确认"。',
  CYCLE_BREAK: '请换人！你已持续按压 2 分钟。休息后点击"确认"继续。',
};

export class DecisionEngine {
  decide(state: CprSessionState): CprDecision {
    // ----- Pre-compression / non-compression phases -----
    const phase = state.currentPhase;
    if (
      phase === 'BRIEFING' ||
      phase === 'SCENE_SAFETY' ||
      phase === 'CHECK_RESPONSE' ||
      phase === 'CALL_FOR_HELP' ||
      phase === 'CHECK_BREATHING' ||
      phase === 'AED_PROMPT'
    ) {
      return {
        message: PHASE_INSTRUCTIONS[phase] ?? 'Follow the on-screen instructions.',
        rhythmStatus: 'WAITING',
        formStatus: 'READY',
        riskLevel: 'LOW',
        canEvaluate: false,
        phaseInstruction: PHASE_INSTRUCTIONS[phase],
      };
    }

    if (phase === 'VENTILATION') {
      return {
        message: PHASE_INSTRUCTIONS.VENTILATION,
        rhythmStatus: 'WAITING',
        formStatus: 'READY',
        riskLevel: 'LOW',
        canEvaluate: false,
        phaseInstruction: PHASE_INSTRUCTIONS.VENTILATION,
      };
    }

    if (phase === 'CYCLE_BREAK') {
      return {
        message: PHASE_INSTRUCTIONS.CYCLE_BREAK,
        rhythmStatus: 'WAITING',
        formStatus: 'READY',
        riskLevel: 'LOW',
        canEvaluate: false,
        phaseInstruction: PHASE_INSTRUCTIONS.CYCLE_BREAK,
      };
    }

    if (phase === 'ASSESSMENT' || phase === 'COMPLETED') {
      return {
        message: phase === 'ASSESSMENT' ? '正在评估你的表现…' : '训练结束。请查看评估结果。',
        rhythmStatus: 'WAITING',
        formStatus: 'READY',
        riskLevel: state.riskLevel,
        canEvaluate: true,
      };
    }

    // ----- COMPRESSIONS phase: existing rhythm/form logic + new metrics -----
    let rhythmStatus: CprDecision['rhythmStatus'] = 'WAITING';
    let formStatus: CprDecision['formStatus'] = 'READY';
    let message = '请就位，开始胸外按压。';

    if (state.currentRate > 0 && state.currentRate < 100) {
      rhythmStatus = 'SLOW';
      message = '按压偏慢，请加快到指南目标频率。';
    } else if (state.currentRate >= 100 && state.currentRate <= 120) {
      rhythmStatus = 'GOOD';
      message = '节奏很好，请保持稳定。';
    } else if (state.currentRate > 120) {
      rhythmStatus = 'FAST';
      message = '按压偏快，请适当放慢节奏。';
    }

    if (state.visibleRatio < 0.5) {
      formStatus = 'HANDS_HIDDEN';
      message = '手部不够清晰，请调整位置确保摄像头可见。';
    } else if (state.straightArmRatio < 0.55) {
      formStatus = 'ARMS_BENT';
      message = '请伸直手臂，肩膀正对双手。';
    } else if (state.centeredRatio < 0.55) {
      formStatus = 'OFF_CENTER';
      message = '请将双手重新居中于胸骨中线。';
    } else if (state.currentRate > 0) {
      formStatus = 'GOOD';
    }

    // Add new-metric warnings when form & rhythm are already GOOD
    if (formStatus === 'GOOD' && rhythmStatus === 'GOOD') {
      // Recoil warning
      if ((state.recoilRatio ?? 1) < 0.5) {
        message = '请让胸廓在每次按压之间充分回弹。';
      }
      // Depth proxy warning
      else if ((state.depthProxyAverage ?? 0.5) < 0.3) {
        message = '按压幅度偏小，请加大力度。';
      }
      // Rate consistency warning
      else if ((state.rateConsistency ?? 100) < 60) {
        message = '节奏不够稳定，请保持均匀的按压间隔。';
      }
      // Compression fraction warning
      else if ((state.compressionFraction ?? 1) < 0.6 && state.elapsedSeconds > 10) {
        message = '请减少中断，保持按压分数在 60% 以上。';
      }
    }

    return {
      message,
      rhythmStatus,
      formStatus,
      riskLevel: state.riskLevel,
      canEvaluate: state.elapsedSeconds >= 10 && state.observations.some(item => item.compressionRate > 0),
    };
  }
}
