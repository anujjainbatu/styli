"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface QualityCheck {
  tooFar: boolean;
  tooClose: boolean;
  tooLeft: boolean;
  tooRight: boolean;
  bodyNotVisible: boolean;
  ready: boolean;
}

const FALLBACK_TIMEOUT_MS = 8000;

function computeQuality(landmarks: PoseLandmark[]): QualityCheck {
  const v = (i: number) => landmarks[i]?.visibility ?? 0;
  const fullBody =
    v(0) > 0.65 && v(11) > 0.65 && v(12) > 0.65 && v(23) > 0.65 && v(24) > 0.65 && v(27) > 0.55 && v(28) > 0.55;

  const hipCenterX = ((landmarks[23]?.x ?? 0.5) + (landmarks[24]?.x ?? 0.5)) / 2;
  // Mirror because video is flipped (scale-x-[-1])
  const mirroredHipCenterX = 1 - hipCenterX;
  const centered = mirroredHipCenterX > 0.38 && mirroredHipCenterX < 0.62;

  const lx = landmarks[11]?.x ?? 0;
  const rx = landmarks[12]?.x ?? 0;
  const shoulderWidth = Math.abs(lx - rx);
  const tooFar = fullBody && shoulderWidth < 0.10;
  const tooClose = shoulderWidth > 0.28;
  const tooLeft = fullBody && mirroredHipCenterX < 0.38;
  const tooRight = fullBody && mirroredHipCenterX > 0.62;

  return {
    tooFar,
    tooClose,
    tooLeft,
    tooRight,
    bodyNotVisible: !fullBody,
    ready: fullBody && centered && shoulderWidth >= 0.10 && shoulderWidth <= 0.28,
  };
}

const EMPTY_QUALITY: QualityCheck = {
  tooFar: false,
  tooClose: false,
  tooLeft: false,
  tooRight: false,
  bodyNotVisible: true,
  ready: false,
};

export function usePoseLandmarker(videoRef: React.RefObject<HTMLVideoElement | null>, active: boolean) {
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);
  const [qualityCheck, setQualityCheck] = useState<QualityCheck>(EMPTY_QUALITY);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const landmarkerRef = useRef<unknown>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      stopLoop();
      setLandmarks([]);
      setQualityCheck(EMPTY_QUALITY);
      return;
    }

    let cancelled = false;
    const fallbackTimer = setTimeout(() => {
      if (!cancelled && isLoading) {
        setFailed(true);
        setIsLoading(false);
      }
    }, FALLBACK_TIMEOUT_MS);

    async function load() {
      try {
        const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        if (cancelled) return;

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        if (cancelled) return;

        const lm = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (cancelled) return;

        landmarkerRef.current = lm;
        clearTimeout(fallbackTimer);
        setIsLoading(false);

        function detect() {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.currentTime === lastVideoTimeRef.current) {
            rafRef.current = requestAnimationFrame(detect);
            return;
          }
          lastVideoTimeRef.current = video.currentTime;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (lm as any).detectForVideo(video, performance.now());
          const lmks: PoseLandmark[] = result?.landmarks?.[0] ?? [];
          setLandmarks(lmks);
          setQualityCheck(lmks.length > 0 ? computeQuality(lmks) : EMPTY_QUALITY);

          rafRef.current = requestAnimationFrame(detect);
        }
        rafRef.current = requestAnimationFrame(detect);
      } catch {
        if (!cancelled) {
          setFailed(true);
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      stopLoop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { landmarks, qualityCheck, isLoading, failed };
}
