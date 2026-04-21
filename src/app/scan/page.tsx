"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  AlertTriangle,
  X,
  Camera,
  Sparkles,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";
import ScanOverlay from "@/components/scan/ScanOverlay";
import { usePoseLandmarker } from "@/hooks/usePoseLandmarker";
import type { QualityCheck } from "@/hooks/usePoseLandmarker";

type ScanStep = "consent" | "guidance" | "scanning" | "analysing" | "complete" | "failed";

const TOTAL_FRAMES = 5;

// Shown only when no pose detected yet (hint list)
const SETUP_HINTS = [
  "Stand 5–6 feet from your camera",
  "Full body should fit in the frame",
  "Good lighting helps accuracy",
];

function getPositionMessage(qc: QualityCheck): string {
  if (qc.bodyNotVisible) return "Step back so your full body is visible";
  if (qc.tooClose) return "Step back a little";
  if (qc.tooFar) return "Step forward a little";
  if (qc.tooLeft) return "Move right";
  if (qc.tooRight) return "Move left";
  if (qc.ready) return "Perfect — hold still";
  return "Position yourself in the frame";
}

interface ArrowCueProps {
  direction: "up" | "down" | "left" | "right";
  label: string;
}

function ArrowCue({ direction, label }: ArrowCueProps) {
  const Icon =
    direction === "up"
      ? ChevronUp
      : direction === "down"
      ? ChevronDown
      : direction === "left"
      ? ChevronLeft
      : ChevronRight;

  const positionClass =
    direction === "up"
      ? "top-3 left-1/2 -translate-x-1/2 flex-col"
      : direction === "down"
      ? "bottom-14 left-1/2 -translate-x-1/2 flex-col"
      : direction === "left"
      ? "left-3 top-1/2 -translate-y-1/2 flex-row"
      : "right-3 top-1/2 -translate-y-1/2 flex-row";

  const animClass =
    direction === "up"
      ? "animate-arrow-bounce-up"
      : direction === "down"
      ? "animate-arrow-bounce-down"
      : direction === "left"
      ? "animate-arrow-bounce-left"
      : "animate-arrow-bounce-right";

  return (
    <div
      className={cn(
        "absolute flex items-center gap-1 px-2 py-1.5 rounded-xl bg-bg-base/85 border border-gold/40 backdrop-blur-sm",
        positionClass,
        animClass
      )}
    >
      <Icon size={16} className="text-gold" />
      <span className="text-xs font-sans text-gold/90 whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const [scanStep, setScanStep] = useState<ScanStep>("consent");
  const [bipaChecked, setBipaChecked] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const consentTimestamp = useRef<string | null>(null);

  const poseActive = scanStep === "guidance" || scanStep === "scanning";
  const { landmarks, qualityCheck, isLoading: poseLoading, failed: poseFailed } = usePoseLandmarker(
    videoRef,
    poseActive
  );

  // Auto-advance when position is good for 1.5s
  useEffect(() => {
    if (scanStep !== "guidance" || poseFailed) return;
    if (!qualityCheck.ready) return;
    const t = setTimeout(() => {
      setScanStep("scanning");
    }, 1500);
    return () => clearTimeout(t);
  }, [qualityCheck.ready, scanStep, poseFailed]);

  // Fallback: if pose detection failed, advance after 3s
  useEffect(() => {
    if (scanStep !== "guidance" || !poseFailed) return;
    const t = setTimeout(() => setScanStep("scanning"), 3000);
    return () => clearTimeout(t);
  }, [scanStep, poseFailed]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const captureFrame = useCallback((): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return Promise.resolve(null);
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
    });
  }, []);

  const startScan = useCallback(async () => {
    setCameraError(null);
    consentTimestamp.current = new Date().toISOString();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      // Move to guidance FIRST so the <video> element mounts, then wire it up in useEffect
      setScanStep("guidance");
    } catch (err) {
      stopCamera();
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access in your browser settings.");
      } else {
        setCameraError("Camera not available. Please check your device.");
      }
    }
  }, [stopCamera]);

  // Wire the stream to the video element after it mounts (guidance step)
  useEffect(() => {
    if (scanStep !== "guidance") return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [scanStep]);

  // Capture frames once scanning starts
  useEffect(() => {
    if (scanStep !== "scanning") return;

    let cancelled = false;
    async function runCapture() {
      const blobs: Blob[] = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        await new Promise((r) => setTimeout(r, 900));
        if (cancelled) return;
        const blob = await captureFrame();
        if (blob) blobs.push(blob);
        if (!cancelled) setCapturedFrames((n) => n + 1);
      }
      if (cancelled) return;

      stopCamera();
      setScanStep("analysing");

      const form = new FormData();
      blobs.forEach((blob, i) => form.append("frames", blob, `frame_${i}.jpg`));
      if (consentTimestamp.current) form.append("consentGivenAt", consentTimestamp.current);

      try {
        const res = await fetch("/api/scan/frames", { method: "POST", body: form });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? "Analysis failed");
        }
        const data = (await res.json()) as { warnings?: string[] };
        setWarnings(data.warnings ?? []);
        setScanStep("complete");
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "Analysis failed");
        setScanStep("failed");
      }
    }

    runCapture();
    return () => { cancelled = true; };
  }, [scanStep, captureFrame, stopCamera]);

  const retry = useCallback(() => {
    setCapturedFrames(0);
    setApiError(null);
    setWarnings([]);
    setScanStep("consent");
  }, []);

  const showLiveCamera = scanStep === "guidance" || scanStep === "scanning";

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <Link
          href="/intake"
          className="text-muted hover:text-cream text-sm font-sans transition-colors flex items-center gap-2"
        >
          <X size={16} />
          Cancel
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-gold" />
          <span className="font-display text-base font-medium text-cream">Style scan</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Consent */}
      {scanStep === "consent" && (
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                <Camera size={28} className="text-gold" />
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-cream mb-3">
                Before we scan
              </h1>
              <p className="text-muted font-sans text-sm leading-relaxed">
                Styli will analyze your body proportions, face shape, and skin tone to build your
                personal style profile.
              </p>
            </div>

            <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-cream font-sans font-semibold text-sm">What we collect:</h3>
              {[
                { icon: "📐", text: "Body proportions & silhouette" },
                { icon: "◇", text: "Face shape classification" },
                { icon: "🎨", text: "Skin tone (Monk scale 1–10)" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-base" aria-hidden="true">{item.icon}</span>
                  <span className="text-sm font-sans text-muted">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="bg-gold/5 border border-gold/15 rounded-2xl p-4 space-y-3">
              <h3 className="text-gold font-sans font-semibold text-sm">Privacy guarantee:</h3>
              {[
                "Camera frames retained 7 days for quality checks, then permanently deleted",
                "Derived style attributes encrypted at rest (AES-256)",
                "Delete your data anytime from settings",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-sans text-muted">{item}</span>
                </div>
              ))}
            </div>

            {cameraError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                {cameraError}
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-border hover:border-gold/30 transition-colors">
              <input
                type="checkbox"
                checked={bipaChecked}
                onChange={(e) => setBipaChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-gold cursor-pointer"
              />
              <span className="text-xs font-sans text-muted leading-relaxed">
                I consent to the collection and processing of my biometric data (facial geometry and
                body proportions) for style analysis, as described in the{" "}
                <a href="#" className="text-gold underline underline-offset-2 hover:text-gold-light">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="#" className="text-gold underline underline-offset-2 hover:text-gold-light">
                  BIPA Notice
                </a>
                .
              </span>
            </label>

            <GoldButton
              size="lg"
              className="w-full justify-center gap-3"
              disabled={!bipaChecked}
              onClick={startScan}
            >
              <Camera size={18} />
              I agree — start scan
            </GoldButton>
          </div>
        </div>
      )}

      {/* Guidance + Scanning — live camera */}
      {showLiveCamera && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4">
          <div className="w-full max-w-sm space-y-4">
            {/* Status message */}
            <div className="text-center min-h-[28px]">
              {poseLoading && !poseFailed && (
                <span className="text-xs font-sans text-muted flex items-center justify-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  Activating pose guide…
                </span>
              )}
              {(!poseLoading || poseFailed) && scanStep === "guidance" && (
                <p
                  className={cn(
                    "text-sm font-sans font-medium transition-colors",
                    qualityCheck.ready ? "text-success" : "text-gold"
                  )}
                >
                  {getPositionMessage(qualityCheck)}
                </p>
              )}
              {scanStep === "scanning" && (
                <p className="text-sm font-sans text-gold">
                  Hold still — capturing frame {capturedFrames} of {TOTAL_FRAMES}
                </p>
              )}
            </div>

            {/* Camera viewport */}
            <div
              className={cn(
                "relative w-full aspect-[3/4] rounded-3xl border-2 overflow-hidden transition-all duration-500",
                scanStep === "scanning"
                  ? "border-gold/60"
                  : qualityCheck.ready
                  ? "border-success animate-pulse-ring shadow-[0_0_28px_rgba(92,184,122,0.25)]"
                  : "border-gold/30"
              )}
            >
              {/* Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />

              {/* Canvas overlay: silhouette + center line + skeleton */}
              <ScanOverlay
                landmarks={landmarks}
                ready={qualityCheck.ready}
                showSilhouette={scanStep === "guidance" && !poseLoading}
              />

              {/* Directional arrows — shown only during guidance when pose active */}
              {scanStep === "guidance" && !poseLoading && !qualityCheck.ready && (
                <>
                  {(qualityCheck.bodyNotVisible || qualityCheck.tooClose) && (
                    <ArrowCue direction="up" label="Step back" />
                  )}
                  {qualityCheck.tooFar && (
                    <ArrowCue direction="down" label="Come closer" />
                  )}
                  {qualityCheck.tooLeft && (
                    <ArrowCue direction="right" label="Move right" />
                  )}
                  {qualityCheck.tooRight && (
                    <ArrowCue direction="left" label="Move left" />
                  )}
                </>
              )}

              {/* Corner brackets */}
              {[
                "top-3 left-3 border-t-2 border-l-2 rounded-tl-lg w-8 h-8",
                "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg w-8 h-8",
                "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg w-8 h-8",
                "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg w-8 h-8",
              ].map((cls, i) => (
                <div key={i} className={cn("absolute border-gold/60", cls)} />
              ))}

              {/* Scanning sweep line */}
              {scanStep === "scanning" && (
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent animate-scan-line" />
              )}

              {/* Ready indicator */}
              {scanStep === "guidance" && qualityCheck.ready && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-success/15 border border-success/40 rounded-xl px-4 py-2 text-center backdrop-blur-sm">
                    <span className="text-sm font-sans text-success font-medium">
                      Great position — scanning in a moment…
                    </span>
                  </div>
                </div>
              )}

              {/* Guidance hint when no pose detected yet */}
              {scanStep === "guidance" && !poseLoading && !qualityCheck.ready && qualityCheck.bodyNotVisible && poseFailed && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-bg-base/75 rounded-xl px-4 py-2 text-center backdrop-blur-sm">
                    <span className="text-xs font-sans text-muted">
                      Align your body with the silhouette
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Setup hints — shown only in guidance before pose detected */}
            {scanStep === "guidance" && qualityCheck.bodyNotVisible && (
              <div className="space-y-1.5">
                {SETUP_HINTS.map((hint) => (
                  <div
                    key={hint}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-sans border bg-bg-surface/60 border-border text-muted"
                  >
                    <Check size={12} className="text-gold flex-shrink-0" />
                    {hint}
                  </div>
                ))}
              </div>
            )}

            {/* Frame capture progress */}
            {scanStep === "scanning" && (
              <div className="flex items-center justify-center gap-3">
                {Array.from({ length: TOTAL_FRAMES }, (_, i) => i + 1).map((f) => (
                  <div
                    key={f}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                      capturedFrames >= f ? "border-gold bg-gold" : "border-border bg-transparent"
                    )}
                  >
                    {capturedFrames >= f && <Check size={14} className="text-bg-base" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysing */}
      {scanStep === "analysing" && (
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
            <div>
              <h2 className="font-display text-2xl font-light text-cream mb-2">Analysing…</h2>
              <p className="text-muted font-sans text-sm">
                Processing your frames for body shape, face shape, and skin tone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Complete */}
      {scanStep === "complete" && (
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-sm w-full text-center space-y-6 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-success/10 border-2 border-success flex items-center justify-center mx-auto">
              <Check size={36} className="text-success" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-light text-cream mb-2">Scan complete</h2>
              <p className="text-muted font-sans text-sm">
                {TOTAL_FRAMES} frames analysed. Your style profile is ready to review.
              </p>
            </div>
            {warnings.length > 0 && (
              <div className="text-left space-y-1 p-3 rounded-xl bg-warning/10 border border-warning/20">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-sans text-warning">
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}
            <GoldButton
              size="lg"
              className="w-full justify-center"
              onClick={() => router.push("/scan/confirm")}
            >
              Review results →
            </GoldButton>
          </div>
        </div>
      )}

      {/* Failed */}
      {scanStep === "failed" && (
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-light text-cream mb-2">Analysis failed</h2>
              <p className="text-muted font-sans text-sm">
                {apiError ?? "Something went wrong during analysis."}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <GoldButton size="lg" className="w-full justify-center gap-2" onClick={retry}>
                <RefreshCw size={16} />
                Try again
              </GoldButton>
              <GoldButton
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => router.push("/intake")}
              >
                Choose different method
              </GoldButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
