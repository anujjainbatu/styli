"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, AlertTriangle, X, Camera, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";

type ScanStep = "consent" | "guidance" | "scanning" | "complete" | "error";

const GUIDANCE_INSTRUCTIONS = [
  { id: "distance", text: "Stand 5–6 feet from camera", met: true },
  { id: "posture", text: "Stand straight, arms slightly out", met: true },
  { id: "lighting", text: "Good lighting detected", met: true },
  { id: "fullbody", text: "Full body visible", met: false },
];

const SCAN_FRAMES = [1, 2, 3, 4, 5];

export default function ScanPage() {
  const [scanStep, setScanStep] = useState<ScanStep>("consent");
  const [bipaChecked, setBipaChecked] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [qualityScore] = useState(0.82);

  const startScan = () => {
    setScanStep("guidance");
    setTimeout(() => {
      setScanStep("scanning");
      // Simulate frame capture
      let frame = 0;
      const interval = setInterval(() => {
        frame += 1;
        setCapturedFrames(frame);
        if (frame >= 5) {
          clearInterval(interval);
          setTimeout(() => setScanStep("complete"), 600);
        }
      }, 800);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <Link href="/onboarding" className="text-muted hover:text-cream text-sm font-sans transition-colors flex items-center gap-2">
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
                { icon: "📐", text: "Body proportions (33 pose landmarks)" },
                { icon: "◇", text: "Face shape (468 facial landmarks)" },
                { icon: "🎨", text: "Skin tone (ITA angle analysis)" },
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
                "Raw camera frames are NEVER stored",
                "Biometric data encrypted per-user (AES-256)",
                "Delete your data anytime from settings",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-sans text-muted">{item}</span>
                </div>
              ))}
            </div>

            {/* BIPA two-step consent */}
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-border hover:border-gold/30 transition-colors">
              <input
                type="checkbox"
                checked={bipaChecked}
                onChange={(e) => setBipaChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-gold cursor-pointer"
              />
              <span className="text-xs font-sans text-muted leading-relaxed">
                I consent to the collection and processing of my biometric data
                (facial geometry and body proportions) for style analysis, as described in
                the{" "}
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

      {/* Guidance + scanning step */}
      {(scanStep === "guidance" || scanStep === "scanning") && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
          <div className="w-full max-w-sm space-y-4">
            {/* Camera frame mock */}
            <div className="relative w-full aspect-[3/4] bg-bg-elevated rounded-3xl border-2 border-gold/30 overflow-hidden shadow-gold-lg">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-bg-elevated to-bg-surface" />

              {/* Body silhouette overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 120 240" className="w-32 h-auto opacity-20 animate-pulse-soft">
                  <ellipse cx="60" cy="28" rx="18" ry="18" fill="#C8A96E" />
                  <path d="M38 55 Q60 48 82 55 L88 135 Q75 132 60 133 Q45 132 32 135 Z" fill="#C8A96E" />
                  <path d="M32 135 L26 210 L45 210 L60 158 L75 210 L94 210 L88 135 Z" fill="#C8A96E" />
                  <path d="M38 55 L18 110" stroke="#C8A96E" strokeWidth="6" strokeLinecap="round" />
                  <path d="M82 55 L102 110" stroke="#C8A96E" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </div>

              {/* Landmark dots */}
              {scanStep === "scanning" && (
                <div className="absolute inset-0">
                  {[[60, 28], [60, 55], [38, 55], [82, 55], [30, 100], [90, 100], [38, 135], [82, 135], [40, 175], [80, 175]].map(([x, y], i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-gold/70 animate-pulse"
                      style={{
                        left: `${(x / 120) * 100}%`,
                        top: `${(y / 240) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Scan line */}
              {scanStep === "scanning" && (
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent animate-scan-line" />
              )}

              {/* Corner brackets */}
              {[
                "top-3 left-3 border-t-2 border-l-2 rounded-tl-lg w-8 h-8",
                "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg w-8 h-8",
                "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg w-8 h-8",
                "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg w-8 h-8",
              ].map((cls, i) => (
                <div key={i} className={`absolute border-gold/60 ${cls}`} />
              ))}

              {/* Status overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                {scanStep === "guidance" && (
                  <div className="text-center text-sm font-sans text-gold/80 animate-pulse">
                    Position yourself in the frame
                  </div>
                )}
                {scanStep === "scanning" && (
                  <div className="bg-bg-base/80 rounded-xl px-4 py-2 text-center">
                    <span className="text-sm font-sans text-gold">
                      Capturing frame {capturedFrames} of 5
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quality score */}
            <div className="bg-bg-surface border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-muted">Pose quality</span>
                <span className="text-gold">{Math.round(qualityScore * 100)}%</span>
              </div>
              <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all duration-500"
                  style={{ width: `${qualityScore * 100}%` }}
                />
              </div>
            </div>

            {/* Guidance chips */}
            <div className="space-y-2">
              {GUIDANCE_INSTRUCTIONS.map((inst) => (
                <div
                  key={inst.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans border",
                    inst.met
                      ? "bg-success/10 border-success/20 text-success"
                      : "bg-warning/10 border-warning/20 text-warning"
                  )}
                >
                  {inst.met ? <Check size={14} /> : <AlertTriangle size={14} />}
                  {inst.text}
                </div>
              ))}
            </div>

            {/* Frame indicators */}
            {scanStep === "scanning" && (
              <div className="flex items-center justify-center gap-3">
                {SCAN_FRAMES.map((f) => (
                  <div
                    key={f}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                      capturedFrames >= f
                        ? "border-gold bg-gold"
                        : "border-border bg-transparent"
                    )}
                  >
                    {capturedFrames >= f && (
                      <Check size={14} className="text-bg-base" />
                    )}
                  </div>
                ))}
              </div>
            )}
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
                5 frames captured. Analyzing your body proportions, face shape, and skin tone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-sans text-gold">
              <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              Computing your style profile...
            </div>
            <Link href="/scan/confirm">
              <GoldButton size="lg" className="w-full justify-center">
                View results →
              </GoldButton>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
