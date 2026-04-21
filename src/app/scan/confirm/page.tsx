"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight, Info, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";
import MonkSwatch from "@/components/ui/MonkSwatch";
import { MONK_TONES, SEASON_PALETTES } from "@/lib/mock-data";

type Undertone = "warm" | "cool" | "neutral";

const UNDERTONE_OPTIONS: { id: Undertone; label: string; desc: string; indicator: string }[] = [
  { id: "warm", label: "Warm", desc: "Golden, peachy, yellow undertones", indicator: "🌅" },
  { id: "cool", label: "Cool", desc: "Pink, red, bluish undertones", indicator: "🌊" },
  { id: "neutral", label: "Neutral", desc: "A mix of both warm and cool", indicator: "⚖️" },
];

const SEASON_FOR_COMBO: Record<string, Record<string, string>> = {
  "1": { warm: "bright_spring", cool: "cool_summer", neutral: "light_spring" },
  "2": { warm: "light_spring", cool: "light_summer", neutral: "cool_summer" },
  "3": { warm: "warm_spring", cool: "cool_summer", neutral: "soft_summer" },
  "4": { warm: "warm_autumn", cool: "soft_summer", neutral: "soft_autumn" },
  "5": { warm: "warm_autumn", cool: "soft_summer", neutral: "warm_autumn" },
  "6": { warm: "warm_autumn", cool: "deep_winter", neutral: "soft_autumn" },
  "7": { warm: "deep_autumn", cool: "deep_winter", neutral: "warm_autumn" },
  "8": { warm: "deep_autumn", cool: "deep_winter", neutral: "deep_autumn" },
  "9": { warm: "deep_autumn", cool: "deep_winter", neutral: "deep_winter" },
  "10": { warm: "deep_winter", cool: "deep_winter", neutral: "deep_winter" },
};

type BodyProfile = {
  bodyShape?: string | null;
  bodyShapeConfidence?: number | null;
  faceShape?: string | null;
  faceShapeConfidence?: number | null;
  monkTone?: number | null;
  skinUndertone?: string | null;
  recommendedSilhouettes?: string[];
  recommendedNecklines?: string[];
};

export default function ScanConfirmPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BodyProfile | null>(null);
  const [monkTone, setMonkTone] = useState(5);
  const [detectedTone, setDetectedTone] = useState(5);
  const [undertone, setUndertone] = useState<Undertone>("warm");
  const [toneConfirmed, setToneConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/scan/confirm")
      .then((r) => r.json())
      .then(({ profile: p }) => {
        if (!p) return;
        setProfile(p);
        setMonkTone(p.monkTone ?? 5);
        setDetectedTone(p.monkTone ?? 5);
        setUndertone((p.skinUndertone as Undertone) ?? "warm");
      })
      .catch(() => {/* keep defaults on error */});
  }, []);

  const seasonKey = SEASON_FOR_COMBO[monkTone.toString()]?.[undertone] ?? "warm_autumn";
  const season = SEASON_PALETTES[seasonKey] ?? SEASON_PALETTES["warm_autumn"];

  const bodyShape = profile?.bodyShape ?? "hourglass";
  const faceShape = profile?.faceShape ?? "oval";
  const bodyConfidence = profile?.bodyShapeConfidence ?? 0.88;
  const faceConfidence = profile?.faceShapeConfidence ?? 0.92;
  const silhouettes = profile?.recommendedSilhouettes?.length
    ? profile.recommendedSilhouettes
    : ["Wrap dresses", "Belted styles", "A-line skirts", "Fit-and-flare"];
  const necklines = profile?.recommendedNecklines?.length
    ? profile.recommendedNecklines
    : ["V-neck", "Scoop neck", "Sweetheart"];

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await fetch("/api/scan/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monkTone,
          skinUndertone: undertone,
          bodyShape,
          bodyShapeConfidence: bodyConfidence,
          faceShape,
          faceShapeConfidence: faceConfidence,
          colorSeason: seasonKey,
          recommendedSilhouettes: silhouettes,
          recommendedNecklines: necklines,
          colorPalette: season?.colors ?? [],
          avoidColors: [],
          source: "camera",
          consentGivenAt: new Date().toISOString(),
        }),
      });
      router.push("/recommendations");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border sticky top-0 bg-bg-base/90 backdrop-blur-md z-10">
        <Link href="/scan" className="text-muted hover:text-cream text-sm font-sans transition-colors">
          ← Re-scan
        </Link>
        <span className="font-display text-base font-medium text-cream">Confirm your profile</span>
        <div className="w-16" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Body shape */}
        <section className="bg-bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-sans text-muted uppercase tracking-widest mb-1">Body shape</p>
              <h2 className="font-display text-3xl font-medium text-cream capitalize">
                {bodyShape}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-sans px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-success">
                {Math.round(bodyConfidence * 100)}% confidence
              </span>
              <button className="text-xs text-muted hover:text-gold font-sans flex items-center gap-1 transition-colors">
                <Edit2 size={10} />
                Edit
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Silhouette illustration */}
            <div className="w-20 h-28 flex-shrink-0 bg-bg-elevated rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 60 100" className="w-12 h-auto">
                <ellipse cx="30" cy="10" rx="8" ry="8" fill="#C8A96E" opacity="0.6" />
                <path d="M20 22 Q30 18 40 22 L42 52 Q36 56 30 55 Q24 56 18 52 Z" fill="#C8A96E" opacity="0.6" />
                <path d="M18 52 L14 88 L24 88 L30 68 L36 88 L46 88 L42 52 Z" fill="#C8A96E" opacity="0.6" />
                <path d="M20 22 L8 46" stroke="#C8A96E" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
                <path d="M40 22 L52 46" stroke="#C8A96E" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-sans text-muted leading-relaxed">
                Defined waist with balanced shoulder and hip measurements. Naturally proportioned figure.
              </p>
              <div className="flex flex-wrap gap-2">
                {silhouettes.map((s) => (
                  <span key={s} className="text-xs font-sans px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Face shape */}
        <section className="bg-bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-sans text-muted uppercase tracking-widest mb-1">Face shape</p>
              <h2 className="font-display text-3xl font-medium text-cream capitalize">
                {faceShape}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-sans px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-success">
                {Math.round(faceConfidence * 100)}% confidence
              </span>
              <button className="text-xs text-muted hover:text-gold font-sans flex items-center gap-1 transition-colors">
                <Edit2 size={10} />
                Edit
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 flex-shrink-0 bg-bg-elevated rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 40 50" className="w-10 h-auto">
                <ellipse cx="20" cy="25" rx="14" ry="20" fill="none" stroke="#C8A96E" strokeWidth="2" opacity="0.6" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-sans text-muted leading-relaxed">
                Balanced proportions with a gently rounded jaw. Most necklines and frame styles suit you.
              </p>
              <div className="flex flex-wrap gap-2">
                {necklines.map((n) => (
                  <span key={n} className="text-xs font-sans px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Skin tone confirmation */}
        <section className="bg-bg-surface border border-border rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-xs font-sans text-muted uppercase tracking-widest mb-1">Skin tone</p>
            <h2 className="font-display text-3xl font-medium text-cream">
              Monk {monkTone}
            </h2>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
            <Info size={14} className="text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs font-sans text-warning/90">
              Lighting affects skin tone detection. Please confirm or adjust below.
            </p>
          </div>

          <div>
            <p className="text-sm font-sans text-muted mb-3">Select your actual skin tone:</p>
            <div className="flex items-center gap-3 flex-wrap">
              {MONK_TONES.map((t) => (
                <MonkSwatch
                  key={t.tone}
                  tone={t.tone}
                  hex={t.hex}
                  label={t.label}
                  selected={monkTone === t.tone}
                  detected={t.tone === detectedTone}
                  onSelect={setMonkTone}
                />
              ))}
            </div>
            <p className="text-xs font-sans text-muted/60 mt-2">
              ✦ Gold dot = initially detected tone
            </p>
          </div>

          {/* Undertone */}
          <div className="space-y-3">
            <p className="text-sm font-sans text-muted">Your undertone:</p>
            <div className="grid grid-cols-3 gap-3">
              {UNDERTONE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setUndertone(opt.id)}
                  className={cn(
                    "p-3 rounded-xl border text-center transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    undertone === opt.id
                      ? "border-gold bg-gold/10"
                      : "border-border bg-bg-elevated hover:border-gold/40"
                  )}
                >
                  <span className="text-xl block mb-1" aria-hidden="true">{opt.indicator}</span>
                  <span className="text-sm font-sans font-medium text-cream">{opt.label}</span>
                  <span className="text-xs font-sans text-muted block mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={toneConfirmed}
              onChange={(e) => setToneConfirmed(e.target.checked)}
              className="w-4 h-4 accent-gold cursor-pointer"
            />
            <span className="text-sm font-sans text-muted">
              This looks right for my skin tone
            </span>
          </label>
        </section>

        {/* Color season preview */}
        {toneConfirmed && (
          <section className="bg-bg-surface border border-gold/30 rounded-2xl p-6 space-y-4 animate-fade-in">
            <div>
              <p className="text-xs font-sans text-muted uppercase tracking-widest mb-1">Your color season</p>
              <h2 className="font-display text-3xl font-medium text-cream">
                {season.label}
              </h2>
              <p className="text-sm font-sans text-muted mt-1">
                Based on Monk {monkTone} skin tone with {undertone} undertone
              </p>
            </div>

            <div>
              <p className="text-xs font-sans text-muted mb-2">Your palette:</p>
              <div className="flex gap-2">
                {season.colors.map((hex, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-border/50 flex-shrink-0"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3 pb-8">
          <GoldButton
            size="lg"
            className="w-full justify-center gap-2"
            disabled={!toneConfirmed}
            loading={saving}
            onClick={handleConfirm}
          >
            <Check size={16} />
            Looks right — show my recommendations
            <ChevronRight size={16} />
          </GoldButton>
          <button className="text-sm font-sans text-muted hover:text-gold transition-colors text-center">
            Edit profile manually
          </button>
        </div>
      </div>
    </div>
  );
}
