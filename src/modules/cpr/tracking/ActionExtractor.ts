import type { CprSessionState } from '../types';

export type CprAction =
  | 'started_compressions'
  | 'paused_compressions'
  | 'achieved_target_rate'
  | 'lost_target_rate'
  | 'form_degraded'
  | 'form_recovered'
  | 'cycle_completed'
  | 'recoil_lost'
  | 'depth_shallow';

const TARGET_MIN = 100;
const TARGET_MAX = 120;

function isInTargetRange(rate: number): boolean {
  return rate >= TARGET_MIN && rate <= TARGET_MAX;
}

function hasGoodForm(state: CprSessionState): boolean {
  return state.visibleRatio >= 0.5 && state.straightArmRatio >= 0.55 && state.centeredRatio >= 0.55;
}

export function extractActions(
  prev: CprSessionState,
  current: CprSessionState
): CprAction[] {
  const actions: CprAction[] = [];

  // Started / paused compressions
  const prevCompressing = prev.currentRate > 0;
  const currCompressing = current.currentRate > 0;
  if (!prevCompressing && currCompressing) {
    actions.push('started_compressions');
  }
  if (prevCompressing && !currCompressing) {
    actions.push('paused_compressions');
  }

  // Target rate achieved / lost
  if (!isInTargetRange(prev.currentRate) && isInTargetRange(current.currentRate)) {
    actions.push('achieved_target_rate');
  }
  if (isInTargetRange(prev.currentRate) && !isInTargetRange(current.currentRate) && current.currentRate > 0) {
    actions.push('lost_target_rate');
  }

  // Form degraded / recovered
  const prevGoodForm = hasGoodForm(prev);
  const currGoodForm = hasGoodForm(current);
  if (prevGoodForm && !currGoodForm) {
    actions.push('form_degraded');
  }
  if (!prevGoodForm && currGoodForm) {
    actions.push('form_recovered');
  }

  // Cycle completed
  const prevCycleCount = prev.cycleHistory?.length ?? 0;
  const currCycleCount = current.cycleHistory?.length ?? 0;
  if (currCycleCount > prevCycleCount) {
    actions.push('cycle_completed');
  }

  // Recoil lost – sustained poor recoil
  const prevRecoilOk = (prev.recoilRatio ?? 1) >= 0.5;
  const currRecoilBad = (current.recoilRatio ?? 1) < 0.5;
  if (prevRecoilOk && currRecoilBad && currCompressing) {
    actions.push('recoil_lost');
  }

  // Depth shallow
  const prevDepthOk = (prev.depthProxyAverage ?? 0.5) >= 0.3;
  const currDepthShallow = (current.depthProxyAverage ?? 0.5) < 0.3;
  if (prevDepthOk && currDepthShallow && currCompressing) {
    actions.push('depth_shallow');
  }

  return actions;
}
