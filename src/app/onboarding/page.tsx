"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";
import StepIndicator from "@/components/ui/StepIndicator";
import { GENDER_OPTIONS, STYLE_OPTIONS, BUDGET_TIERS } from "@/lib/mock-data";

const TOTAL_STEPS = 4;

const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  budget: { min: 0, max: 50 },
  mid: { min: 50, max: 150 },
  premium: { min: 150, max: 500 },
  luxury: { min: 500, max: 10000 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<string | null>(null);
  const [height, setHeight] = useState(165);
  const [unit, setUnit] = useState<"cm" | "ft">("cm");
  const [styles, setStyles] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("mid");
  const [saving, setSaving] = useState(false);

  const canProceed = () => {
    if (step === 1) return gender !== null;
    if (step === 2) return height > 0;
    if (step === 3) return styles.length > 0;
    return true;
  };

  const toggleStyle = (id: string) => {
    setStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const heightDisplay = unit === "cm"
    ? `${height} cm`
    : `${Math.floor(height / 30.48)}′ ${Math.round((height % 30.48) / 2.54)}″`;

  const handleFinish = async () => {
    setSaving(true);
    try {
      const budgetRange = BUDGET_RANGES[budget] ?? { min: 50, max: 150 };
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genderIdentity: gender,
          heightCm: height,
          preferredStyles: styles,
          budgetTier: budget,
          budgetMinUsd: budgetRange.min,
          budgetMaxUsd: budgetRange.max,
        }),
      });
      router.push("/intake");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <Link href="/" className="text-muted hover:text-cream text-sm font-sans transition-colors">
          ← Styli
        </Link>
        <StepIndicator total={TOTAL_STEPS} current={step} />
        <button
          onClick={() => step < TOTAL_STEPS ? setStep(step + 1) : handleFinish()}
          className="text-muted hover:text-gold text-xs font-sans transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto w-full">

        {/* Step 1: Gender */}
        {step === 1 && (
          <div className="w-full space-y-8 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-4xl sm:text-5xl font-light text-cream mb-3">
                How do you identify?
              </h1>
              <p className="text-muted font-sans text-sm">
                This helps us tailor recommendations. All options are equally supported.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setGender(opt.id)}
                  className={cn(
                    "relative py-6 px-4 rounded-2xl border-2 text-center font-sans font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    gender === opt.id
                      ? "border-gold bg-gold/10 text-cream"
                      : "border-border bg-bg-surface text-muted hover:border-gold/40 hover:text-cream"
                  )}
                >
                  {gender === opt.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                      <Check size={12} className="text-bg-base" />
                    </div>
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Height */}
        {step === 2 && (
          <div className="w-full space-y-8 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-4xl sm:text-5xl font-light text-cream mb-3">
                What&apos;s your height?
              </h1>
              <p className="text-muted font-sans text-sm">
                Used to calibrate body proportion measurements during your scan.
              </p>
            </div>

            <div className="bg-bg-surface border border-border rounded-2xl p-8 space-y-6">
              {/* Unit toggle */}
              <div className="flex rounded-xl bg-bg-elevated border border-border p-1 w-fit mx-auto">
                {(["cm", "ft"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-sans transition-all",
                      unit === u
                        ? "bg-gold text-bg-base font-medium"
                        : "text-muted hover:text-cream"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>

              {/* Height display */}
              <div className="text-center">
                <span className="font-display text-6xl font-light text-cream">{heightDisplay}</span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={140}
                max={210}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #C8A96E ${((height - 140) / 70) * 100}%, #2E2E3A ${((height - 140) / 70) * 100}%)`,
                }}
                aria-label="Height slider"
              />
              <div className="flex justify-between text-xs text-muted font-sans">
                <span>4&apos;7&quot;</span>
                <span>6&apos;11&quot;</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Style preferences */}
        {step === 3 && (
          <div className="w-full space-y-8 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-4xl sm:text-5xl font-light text-cream mb-3">
                What&apos;s your style?
              </h1>
              <p className="text-muted font-sans text-sm">
                Select all that resonate. We&apos;ll weight recommendations accordingly.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleStyle(opt.id)}
                  className={cn(
                    "relative py-4 px-3 rounded-xl border text-center font-sans text-sm transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    styles.includes(opt.id)
                      ? "border-gold bg-gold/10 text-cream"
                      : "border-border bg-bg-surface text-muted hover:border-gold/40 hover:text-cream"
                  )}
                >
                  {styles.includes(opt.id) && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                      <Check size={10} className="text-bg-base" />
                    </div>
                  )}
                  <span className="text-xl block mb-1" aria-hidden="true">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Budget */}
        {step === 4 && (
          <div className="w-full space-y-8 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-4xl sm:text-5xl font-light text-cream mb-3">
                What&apos;s your budget?
              </h1>
              <p className="text-muted font-sans text-sm">
                Per item, typically. We&apos;ll prioritize recommendations in this range.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BUDGET_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setBudget(tier.id)}
                  className={cn(
                    "p-5 rounded-2xl border-2 text-left transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    budget === tier.id
                      ? "border-gold bg-gold/10"
                      : "border-border bg-bg-surface hover:border-gold/40"
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-sans font-semibold text-cream">{tier.label}</span>
                    {budget === tier.id && (
                      <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                        <Check size={12} className="text-bg-base" />
                      </div>
                    )}
                  </div>
                  <span className="text-muted text-sm font-sans">{tier.range}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between w-full mt-10">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-2 text-muted hover:text-cream text-sm font-sans transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <GoldButton
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              size="lg"
              className="gap-2"
            >
              Continue
              <ArrowRight size={16} />
            </GoldButton>
          ) : (
            <GoldButton
              size="lg"
              className="gap-2"
              loading={saving}
              onClick={handleFinish}
            >
              Continue to scan
              <ArrowRight size={16} />
            </GoldButton>
          )}
        </div>
      </div>
    </div>
  );
}
