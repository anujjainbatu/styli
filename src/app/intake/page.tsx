"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Upload, Instagram, ChevronRight, ShieldCheck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";
import { trackEvent } from "@/lib/posthog";

type IntakeSource = "camera" | "upload" | "instagram";

type OptionCard = {
  id: IntakeSource;
  icon: React.ReactNode;
  title: string;
  description: string;
  effort: string;
  privacyNote: string;
  href: string;
};

const OPTIONS: OptionCard[] = [
  {
    id: "camera",
    icon: <Camera size={24} />,
    title: "Live camera scan",
    description: "Stand in front of your device camera for the most accurate body and face analysis.",
    effort: "~2 minutes",
    privacyNote: "No frames stored — processed in memory only",
    href: "/scan",
  },
  {
    id: "upload",
    icon: <Upload size={24} />,
    title: "Upload photos",
    description: "Upload 3–5 full-body or portrait photos from your camera roll for offline analysis.",
    effort: "Upload 3–5 photos",
    privacyNote: "Photos deleted after analysis — not stored long-term",
    href: "/scan/upload",
  },
  {
    id: "instagram",
    icon: <Instagram size={24} />,
    title: "Import from Instagram",
    description: "Connect your Instagram account and pick photos for analysis. Requires a Business or Creator account.",
    effort: "Connect account + pick photos",
    privacyNote: "We only read media you select — no posting",
    href: "/api/auth/instagram",
  },
];

export default function IntakePage() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IntakeSource | null>(null);

  useEffect(() => {
    trackEvent("intake_hub_viewed");
    fetch("/api/scan/confirm")
      .then((r) => r.json())
      .then(({ profile }) => {
        setHasProfile(profile?.skinToneConfirmed === true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (option: OptionCard) => {
    setSelected(option.id);
    trackEvent("intake_source_selected", { source: option.id });
    if (option.id === "instagram") {
      window.location.href = option.href;
    } else {
      router.push(option.href);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border sticky top-0 bg-bg-base/90 backdrop-blur-md z-10">
        <Link href="/onboarding" className="text-muted hover:text-cream text-sm font-sans transition-colors">
          ← Back
        </Link>
        <span className="font-display text-base font-medium text-cream">How would you like to share photos?</span>
        <div className="w-16" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          {hasProfile ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-sans mb-4">
                <RefreshCw size={12} />
                You already have a style profile — re-scanning will update it
              </div>
              <h1 className="font-display text-3xl font-medium text-cream">Update your profile</h1>
              <p className="text-muted font-sans text-sm mt-2">
                Choose how you'd like to re-analyse your style.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl font-medium text-cream mb-3">
                Tell us about your style
              </h1>
              <p className="text-muted font-sans text-sm max-w-sm mx-auto">
                We'll analyse your body shape, face shape, and skin tone to personalise recommendations just for you.
              </p>
            </>
          )}
        </div>

        {/* Option cards */}
        <div className="space-y-4">
          {loading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-bg-surface border border-border animate-pulse" />
              ))
            : OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  disabled={selected !== null}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border transition-all duration-200 group",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    selected === opt.id
                      ? "border-gold bg-gold/10"
                      : "border-border bg-bg-surface hover:border-gold/50 hover:bg-bg-elevated"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                        selected === opt.id
                          ? "bg-gold/20 text-gold"
                          : "bg-bg-elevated text-muted group-hover:bg-gold/10 group-hover:text-gold"
                      )}
                    >
                      {opt.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-sans font-semibold text-cream text-base">{opt.title}</h3>
                        <ChevronRight
                          size={16}
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            selected === opt.id ? "text-gold" : "text-muted group-hover:text-gold"
                          )}
                        />
                      </div>
                      <p className="text-sm font-sans text-muted mt-1 leading-relaxed">{opt.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-bg-elevated border border-border/50 text-muted">
                          {opt.effort}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-sans text-muted/60">
                          <ShieldCheck size={11} />
                          {opt.privacyNote}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
        </div>

        {/* Skip */}
        <div className="text-center mt-8">
          <GoldButton
            variant="ghost"
            size="sm"
            onClick={() => router.push("/recommendations")}
          >
            Skip for now — browse without a profile
          </GoldButton>
        </div>
      </div>
    </div>
  );
}
