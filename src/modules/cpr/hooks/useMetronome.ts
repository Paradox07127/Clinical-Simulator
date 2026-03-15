import { useCallback, useEffect, useRef, useState } from 'react';

interface UseMetronomeReturn {
  isPlaying: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useMetronome(): UseMetronomeReturn {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playBeep = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      audioCtxRef.current = new AudioCtor();
    }
    const context = audioCtxRef.current;
    if (context.state === 'suspended') {
      void context.resume();
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current !== null) return;
    intervalRef.current = window.setInterval(playBeep, 545);
    setIsPlaying(true);
  }, [playBeep]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  return { isPlaying, start, stop, toggle };
}
