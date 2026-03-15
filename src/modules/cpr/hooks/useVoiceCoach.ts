import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVoiceCoachReturn {
  isEnabled: boolean;
  speak: (text: string) => void;
  toggle: () => void;
  stop: () => void;
}

export function useVoiceCoach(): UseVoiceCoachReturn {
  const lastSpokenTimeRef = useRef(0);
  const [isEnabled, setIsEnabled] = useState(false);

  const speak = useCallback(
    (text: string) => {
      if (!isEnabled) return;
      const now = performance.now();
      if (now - lastSpokenTimeRef.current <= 4000) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
      lastSpokenTimeRef.current = now;
    },
    [isEnabled]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    setIsEnabled(prev => {
      if (prev) {
        window.speechSynthesis.cancel();
      }
      return !prev;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return { isEnabled, speak, toggle, stop };
}
