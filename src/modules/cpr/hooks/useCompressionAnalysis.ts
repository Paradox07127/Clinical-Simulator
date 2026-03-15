import { useCallback, useRef, useState } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { CprObservation } from '../types';

const UI_UPDATE_INTERVAL_MS = 200;

/** Phase 2: minimum milliseconds between two accepted peaks (debounce) */
const MIN_INTER_PEAK_MS = 300;

/** Phase 2: visibility threshold raised from 0.2 to 0.5 */
const WRIST_VISIBILITY_THRESHOLD = 0.5;

/** Phase 2: rolling median window for adaptive threshold */
const ROLLING_MEDIAN_WINDOW = 10;

/** Phase 2: how many recent inter-peak intervals to use for rate */
const RECENT_INTERVALS_FOR_RATE = 3;

/** Phase 2.2: recoil is considered complete if wrist returns within this fraction of pre-compression baseline */
const RECOIL_TOLERANCE = 0.25;

/** Phase 2.3: depth proxy thresholds (unused here but documented for reference) */
// 'shallow' < 0.3, 'adequate' 0.3-0.7, 'deep' > 0.7

interface UseCompressionAnalysisReturn {
  currentRate: number;
  observation: CprObservation | null;
  wristHistory: Array<{ time: number; y: number }>;
  peakTimestamps: Array<{ time: number; y: number }>;
  processLandmarks: (landmarks: NormalizedLandmark[], timestamp: number) => void;
  reset: () => void;
}

function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/** Compute median of an array of numbers */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

interface PeakInfo {
  time: number;
  y: number;
  valleyY: number; // the valley Y just before this peak
}

function detectPeaks(
  data: { time: number; y: number; shoulderWidth: number }[],
  recentAmplitudes: number[]
): PeakInfo[] {
  if (data.length < 5) return [];

  // Phase 2.1: adaptive threshold based on rolling median of recent compression amplitudes
  let dynamicThreshold: number;
  if (recentAmplitudes.length >= 3) {
    dynamicThreshold = Math.max(0.005, median(recentAmplitudes) * 0.4);
  } else {
    // Fallback: use shoulder-width-based threshold
    const avgShoulderWidth = data.reduce((sum, item) => sum + item.shoulderWidth, 0) / data.length;
    dynamicThreshold = Math.max(0.01, avgShoulderWidth * 0.08);
  }

  const smoothed = data.map((point, index) => {
    let sum = 0;
    let count = 0;
    for (let pointer = Math.max(0, index - 2); pointer <= Math.min(data.length - 1, index + 2); pointer += 1) {
      sum += data[pointer].y;
      count += 1;
    }
    return { time: point.time, y: sum / count, originalY: point.y };
  });

  const rawPeaks: PeakInfo[] = [];
  let lastValley = smoothed[0].y;
  let lastValleyOriginal = data[0].y;
  for (let index = 1; index < smoothed.length - 1; index += 1) {
    const previous = smoothed[index - 1].y;
    const current = smoothed[index].y;
    const next = smoothed[index + 1].y;
    if (current < previous && current <= next) {
      lastValley = Math.min(lastValley, current);
      // Track the original (unsmoothed) valley for recoil detection
      if (data[index].y < lastValleyOriginal || rawPeaks.length === 0) {
        lastValleyOriginal = data[index].y;
      }
    }
    if (current > previous && current >= next && current - lastValley > dynamicThreshold) {
      rawPeaks.push({
        time: smoothed[index].time,
        y: smoothed[index].originalY,
        valleyY: lastValleyOriginal,
      });
      lastValley = current;
      lastValleyOriginal = data[index].y;
    }
  }

  // Phase 2.1: enforce minimum inter-peak interval (300ms debounce)
  const debounced: PeakInfo[] = [];
  for (const peak of rawPeaks) {
    if (debounced.length === 0 || peak.time - debounced[debounced.length - 1].time >= MIN_INTER_PEAK_MS) {
      debounced.push(peak);
    }
  }

  // Phase 2.1: reject isolated peaks – require at least 2 consecutive peaks with similar intervals (tolerance +/-40%)
  if (debounced.length < 2) return [];

  const validated: PeakInfo[] = [debounced[0]];
  for (let i = 1; i < debounced.length; i++) {
    const currentInterval = debounced[i].time - debounced[i - 1].time;

    // Check if there's a neighboring interval that's consistent
    let hasConsistentNeighbor = false;

    // Check previous interval
    if (i >= 2) {
      const prevInterval = debounced[i - 1].time - debounced[i - 2].time;
      const ratio = currentInterval / prevInterval;
      if (ratio >= 0.6 && ratio <= 1.4) {
        hasConsistentNeighbor = true;
      }
    }

    // Check next interval
    if (i < debounced.length - 1) {
      const nextInterval = debounced[i + 1].time - debounced[i].time;
      const ratio = currentInterval / nextInterval;
      if (ratio >= 0.6 && ratio <= 1.4) {
        hasConsistentNeighbor = true;
      }
    }

    // Always keep peaks that have consistent neighbors, or the first few peaks before we can validate
    if (hasConsistentNeighbor || debounced.length <= 3) {
      validated.push(debounced[i]);
    }
  }

  return validated;
}

export function useCompressionAnalysis(): UseCompressionAnalysisReturn {
  const historyRef = useRef<{ time: number; y: number; shoulderWidth: number }[]>([]);
  const smoothedRateRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  /** Phase 2.1: rolling amplitudes for adaptive threshold */
  const recentAmplitudesRef = useRef<number[]>([]);
  /** Phase 2.2: baseline wrist Y for recoil detection */
  const baselineWristYRef = useRef<number | null>(null);
  /** Phase 2.3: store last peak and valley for depth proxy */
  const lastPeakInfoRef = useRef<{ peakY: number; valleyY: number } | null>(null);

  const [currentRate, setCurrentRate] = useState(0);
  const [observation, setObservation] = useState<CprObservation | null>(null);
  const [wristHistory, setWristHistory] = useState<Array<{ time: number; y: number }>>([]);
  const [peakTimestamps, setPeakTimestamps] = useState<{ time: number; y: number }[]>([]);

  const processLandmarks = useCallback((landmarks: NormalizedLandmark[], timestamp: number) => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    // Phase 2.6: raised visibility threshold to 0.5
    const leftVisibility = leftWrist.visibility || 0;
    const rightVisibility = rightWrist.visibility || 0;
    const leftVisible = leftVisibility > WRIST_VISIBILITY_THRESHOLD;
    const rightVisible = rightVisibility > WRIST_VISIBILITY_THRESHOLD;
    const handsVisible = leftVisible || rightVisible;

    // Phase 2.6: tracking confidence as average visibility score
    const trackingConfidence = handsVisible
      ? (leftVisible && rightVisible
          ? (leftVisibility + rightVisibility) / 2
          : leftVisible ? leftVisibility : rightVisibility)
      : 0;

    if (!handsVisible) {
      setObservation({
        timestamp,
        compressionRate: 0,
        handsVisible: false,
        armsStraight: false,
        handsCentered: false,
        recoilComplete: false,
        depthProxy: 0,
        trackingConfidence: 0,
      });
      return;
    }

    const averageWrist = leftVisible && rightVisible
      ? {
          y: (leftWrist.y + rightWrist.y) / 2,
          x: (leftWrist.x + rightWrist.x) / 2,
        }
      : leftVisible
        ? { y: leftWrist.y, x: leftWrist.x }
        : { y: rightWrist.y, x: rightWrist.x };

    const armsStraight = leftVisible && rightVisible
      ? calculateAngle(leftShoulder, leftElbow, leftWrist) >= 150
        && calculateAngle(rightShoulder, rightElbow, rightWrist) >= 150
      : calculateAngle(
          leftVisible ? leftShoulder : rightShoulder,
          leftVisible ? leftElbow : rightElbow,
          leftVisible ? leftWrist : rightWrist
        ) >= 150;

    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const handsCentered = Math.abs(averageWrist.x - shoulderCenterX) < 0.1;
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    historyRef.current.push({ time: timestamp, y: averageWrist.y, shoulderWidth });
    historyRef.current = historyRef.current.filter(point => point.time > timestamp - 5000);

    const peaks = detectPeaks(historyRef.current, recentAmplitudesRef.current);

    // Update rolling amplitudes from detected peaks
    if (peaks.length >= 2) {
      const latestPeak = peaks[peaks.length - 1];
      const amplitude = Math.abs(latestPeak.y - latestPeak.valleyY);
      if (amplitude > 0) {
        recentAmplitudesRef.current.push(amplitude);
        if (recentAmplitudesRef.current.length > ROLLING_MEDIAN_WINDOW) {
          recentAmplitudesRef.current = recentAmplitudesRef.current.slice(-ROLLING_MEDIAN_WINDOW);
        }
      }
    }

    // Throttled UI update for chart data
    if (timestamp - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
      lastUiUpdateRef.current = timestamp;
      setPeakTimestamps(peaks.map(p => ({ time: p.time, y: p.y })));
      setWristHistory(historyRef.current.map(({ time, y }) => ({ time, y })));
    }

    // Phase 2.1: use last RECENT_INTERVALS_FOR_RATE inter-peak intervals for rate
    let rate = 0;
    if (peaks.length >= 2) {
      const recentPeaks = peaks.slice(-Math.min(peaks.length, RECENT_INTERVALS_FOR_RATE + 1));
      if (recentPeaks.length >= 2) {
        const seconds = (recentPeaks[recentPeaks.length - 1].time - recentPeaks[0].time) / 1000;
        if (seconds > 0) {
          rate = Math.round(((recentPeaks.length - 1) / seconds) * 60);
        }
      }
    }
    if (rate > 0) {
      smoothedRateRef.current = smoothedRateRef.current === 0
        ? rate
        : smoothedRateRef.current * 0.6 + rate * 0.4;
      rate = Math.round(smoothedRateRef.current);
    } else {
      smoothedRateRef.current = 0;
    }

    setCurrentRate(rate);

    // Phase 2.2: recoil detection
    let recoilComplete = false;
    if (peaks.length >= 1) {
      const latestPeak = peaks[peaks.length - 1];
      // Set baseline on first detection
      if (baselineWristYRef.current === null) {
        baselineWristYRef.current = latestPeak.valleyY;
      }
      const baseline = baselineWristYRef.current;
      // Check if current wrist Y is within 25% of baseline (between peaks)
      const distanceFromBaseline = Math.abs(averageWrist.y - baseline);
      const peakAmplitude = Math.abs(latestPeak.y - baseline);
      if (peakAmplitude > 0) {
        recoilComplete = distanceFromBaseline <= peakAmplitude * RECOIL_TOLERANCE;
      }
      // Update baseline slowly (weighted average)
      baselineWristYRef.current = baseline * 0.95 + latestPeak.valleyY * 0.05;
      lastPeakInfoRef.current = { peakY: latestPeak.y, valleyY: latestPeak.valleyY };
    }

    // Phase 2.3: depth proxy (peak-to-valley normalized by shoulder width)
    let depthProxy = 0;
    if (lastPeakInfoRef.current && shoulderWidth > 0) {
      const displacement = Math.abs(lastPeakInfoRef.current.peakY - lastPeakInfoRef.current.valleyY);
      depthProxy = Math.min(1, displacement / shoulderWidth);
    }

    const obs: CprObservation = {
      timestamp,
      compressionRate: rate,
      wristY: averageWrist.y,
      shoulderWidth,
      handsVisible,
      armsStraight,
      handsCentered,
      recoilComplete,
      depthProxy,
      trackingConfidence,
      peakTimestamps: peaks.map(p => p.time),
    };
    setObservation(obs);
  }, []);

  const reset = useCallback(() => {
    historyRef.current = [];
    smoothedRateRef.current = 0;
    lastUiUpdateRef.current = 0;
    recentAmplitudesRef.current = [];
    baselineWristYRef.current = null;
    lastPeakInfoRef.current = null;
    setCurrentRate(0);
    setObservation(null);
    setWristHistory([]);
    setPeakTimestamps([]);
  }, []);

  return {
    currentRate,
    observation,
    wristHistory,
    peakTimestamps,
    processLandmarks,
    reset,
  };
}
