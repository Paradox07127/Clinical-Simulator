import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';

interface UsePoseDetectionReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isModelLoaded: boolean;
  isStreaming: boolean;
  landmarks: NormalizedLandmark[] | null;
  modelError: string | null;
  cameraError: string | null;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
}

export function usePoseDetection(): UsePoseDetectionReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);
  const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  /** Capture the active MediaStream so cleanup doesn't depend on ref nullification timing */
  const streamRef = useRef<MediaStream | null>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Load MediaPipe PoseLandmarker model on mount
  useEffect(() => {
    let cancelled = false;
    const modelPath =
      'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';
    const initModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
        );
        if (cancelled) return;

        // Try GPU first, fall back to CPU on failure
        try {
          landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
        } catch {
          landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: modelPath, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
        }

        if (!cancelled) setIsModelLoaded(true);
      } catch (error) {
        console.error('Failed to load pose landmarker', error);
        if (!cancelled) setModelError(error instanceof Error ? error.message : 'Failed to load pose model');
      }
    };
    void initModel();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
    };
  }, []);

  // Video processing loop
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const now = performance.now();
      const results = landmarker.detectForVideo(video, now);

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const detected = results.landmarks?.[0] ?? null;
      if (detected) {
        if (!drawingUtilsRef.current) drawingUtilsRef.current = new DrawingUtils(ctx);
        const drawingUtils = drawingUtilsRef.current;
        drawingUtils.drawConnectors(detected, PoseLandmarker.POSE_CONNECTIONS, {
          color: '#ef4444',
          lineWidth: 4,
        });
        drawingUtils.drawLandmarks(detected, {
          color: '#141414',
          lineWidth: 2,
          radius: 4,
        });
      }

      ctx.restore();

      // Update the ref synchronously for per-frame consumers,
      // then batch the state update for React renders
      landmarksRef.current = detected;
      setLandmarks(detected);
    }

    requestRef.current = requestAnimationFrame(processFrame);
  }, []);

  // Start the rAF loop whenever streaming starts, stop when it ends
  useEffect(() => {
    if (isStreaming) {
      requestRef.current = requestAnimationFrame(processFrame);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isStreaming, processFrame]);

  const startCamera = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not support camera access.');
      return false;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        setCameraError('Camera element is not ready yet. Please try again.');
        return false;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;

      // Wait for metadata with timeout fallback
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        await Promise.race([
          new Promise<void>(resolve => video.addEventListener('loadedmetadata', () => resolve(), { once: true })),
          new Promise<void>(resolve => setTimeout(resolve, 3000)),
        ]);
      }

      await video.play();
      setIsStreaming(true);
      return true;
    } catch (error) {
      console.error('Failed to access webcam', error);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraError(error instanceof Error ? error.message : 'Unable to start the camera.');
      setIsStreaming(false);
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    cancelAnimationFrame(requestRef.current);
    setIsStreaming(false);
    landmarksRef.current = null;
    setLandmarks(null);
  }, []);

  // Cleanup on unmount — uses streamRef to avoid stale videoRef
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isModelLoaded,
    isStreaming,
    landmarks,
    modelError,
    cameraError,
    startCamera,
    stopCamera,
  };
}
