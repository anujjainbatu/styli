"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, AlertTriangle, X, Camera, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";

type ScanStep = "consent" | "guidance" | "scanning" | "analysing" | "complete" | "failed";

const GUIDANCE_CHECKS = [
  { id: "distance", text: "Stand 5–6 feet from camera" },
  { id: "posture", text: "Stand straight, arms slightly out" },
  { id: "lighting", text: "Ensure good lighting" },
  { id: "fullbody", text: "Full body visible in frame" },
];

const TOTAL_FRAMES = 5;

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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanStep("guidance");

      await new Promise((resolve) => setTimeout(resolve, 2500));
      setScanStep("scanning");

      const blobs: Blob[] = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        const blob = await captureFrame();
        if (blob) blobs.push(blob);
        setCapturedFrames((n) => n + 1);
      }

      stopCamera();
      setScanStep("analysing");

      const form = new FormData();
      blobs.forEach((blob, i) => form.append("frames", blob, `frame_${i}.jpg`));
      if (consentTimestamp.current) form.append("consentGivenAt", consentTimestamp.current);

      const res = await fetch("/api/scan/frames", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Analysis failed");
      }
      const data = await res.json();
      setWarnings(data.warnings ?? []);
      setScanStep("complete");
    } catch (err) {
      stopCamera();
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access in your browser settings.");
        setScanStep("consent");
      } else if (err instanceof DOMException) {
        setCameraError("Camera not available. Please check your device.");
        setScanStep("consent");
      } else {
        setApiError(err instanceof Error ? err.message : "Analysis failed");
        setScanStep("failed");
      }
    }
  }, [captureFrame, stopCamera]);

  const retry = useCallback(() => {
    setCapturedFrames(0);
    setApiError(null);
    setWarnings([]);
    setScanStep("consent");
  }, []);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <Link href="/intake" className="text-muted hover:text-cream text-sm font-sans transition-colors flex items-center gap-2">
          <X size={16} />
          Cancel
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-gold" />
          <span className="font-display text-base font-medium text-cream">Style scan</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Consent step */}
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
                Styli will analyze your body proportions, face shape, and skin tone
                to build your personal style profile.
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
                I consent to the collection and processing of my biometric data
                (facial geometry and body proportions) for style analysis, as described in the{" "}
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

      {/* Guidance + scanning — live video feed */}
      {(scanStep === "guidance" || scanStep === "scanning") && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
          <div className="w-full max-w-sm space-y-4">
            <div className="relative w-full aspect-[3/4] bg-bg-elevated rounded-3xl border-2 border-gold/30 overflow-hidden shadow-gold-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />

              {scanStep === "scanning" && (
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent animate-scan-line" />
              )}

              {[
                "top-3 left-3 border-t-2 border-l-2 rounded-tl-lg w-8 h-8",
                "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg w-8 h-8",
                "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg w-8 h-8",
                "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg w-8 h-8",
              ].map((cls, i) => (
                <div key={i} className={`absolute border-gold/60 ${cls}`} />
              ))}

              <div className="absolute bottom-4 left-4 right-4">
                {scanStep === "guidance" && (
                  <div className="bg-bg-base/70 rounded-xl px-4 py-2 text-center backdrop-blur-sm">
                    <span className="text-sm font-sans text-gold/90 animate-pulse">
                      Position yourself in the frame
                    </span>
                  </div>
                )}
                {scanStep === "scanning" && (
                  <div className="bg-bg-base/80 rounded-xl px-4 py-2 text-center backdrop-blur-sm">
                    <span className="text-sm font-sans text-gold">
                      Capturing frame {capturedFrames} of {TOTAL_FRAMES}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {GUIDANCE_CHECKS.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans border bg-success/10 border-success/20 text-success"
                >
                  <Check size={14} />
                  {inst.text}
                </div>
              ))}
            </div>

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

      {/* Analysing step */}
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

      {/* Complete step */}
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

      {/* Failed step */}
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
              <GoldButton variant="outline" size="sm" className="w-full justify-center" onClick={() => router.push("/intake")}>
                Choose different method
              </GoldButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
