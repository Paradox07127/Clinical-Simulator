import { useMemo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Camera } from 'lucide-react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

interface CameraSetupGuideProps {
  landmarks: NormalizedLandmark[] | null;
  onReady: () => void;
}

const VISIBILITY_THRESHOLD = 0.5;
const COUNTDOWN_SECONDS = 3;

export default function CameraSetupGuide({ landmarks, onReady }: CameraSetupGuideProps) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownActiveRef = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const keyLandmarks = [
    { index: 11, label: t('cpr.lShoulder') },
    { index: 12, label: t('cpr.rShoulder') },
    { index: 13, label: t('cpr.lElbow') },
    { index: 14, label: t('cpr.rElbow') },
    { index: 15, label: t('cpr.lWrist') },
    { index: 16, label: t('cpr.rWrist') },
  ];

  const landmarkStatus = useMemo(() => {
    return keyLandmarks.map(kl => {
      const lm = landmarks?.[kl.index];
      const visible = lm ? (lm.visibility ?? 0) > VISIBILITY_THRESHOLD : false;
      return { ...kl, visible };
    });
  }, [landmarks]);

  const allVisible = landmarkStatus.every(s => s.visible);

  useEffect(() => {
    if (allVisible && !countdownActiveRef.current) {
      // Start countdown
      countdownActiveRef.current = true;
      let remaining = COUNTDOWN_SECONDS;
      setCountdown(remaining);

      timerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          countdownActiveRef.current = false;
          setCountdown(null);
          onReadyRef.current();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    } else if (!allVisible && countdownActiveRef.current) {
      // Lost tracking — cancel
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      countdownActiveRef.current = false;
      setCountdown(null);
    }
  }, [allVisible]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const visibleCount = landmarkStatus.filter(s => s.visible).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#141414]/70 backdrop-blur-sm"
    >
      <div className="max-w-sm w-full mx-4 space-y-6">
        <div className="bg-white border border-[#141414] rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5" />
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.16em]">{t('cpr.cameraSetup')}</h3>
          </div>

          <p className="text-xs leading-relaxed opacity-70">
            {t('cpr.cameraSetupDesc')}
          </p>

          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase opacity-50 tracking-widest">
              {t('cpr.bodyTracking')} ({visibleCount}/6)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {landmarkStatus.map(lm => (
                <div key={lm.index} className="flex items-center gap-2 p-2 rounded-lg border border-[#141414]/10">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${lm.visible ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-[9px] font-mono uppercase tracking-wider truncate">{lm.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-2 bg-[#141414]/10 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(visibleCount / keyLandmarks.length) * 100}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full rounded-full ${allVisible ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
          </div>

          <div className="text-center">
            {countdown !== null ? (
              <motion.div
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold text-emerald-600"
              >
                {countdown}
              </motion.div>
            ) : allVisible ? (
              <div className="text-xs font-bold uppercase text-emerald-600">{t('cpr.lockedIn')}</div>
            ) : (
              <div className="text-xs font-bold uppercase opacity-40">{t('cpr.adjustPosition')}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
