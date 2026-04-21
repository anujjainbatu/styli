"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, AlertCircle, Instagram, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";
import { trackEvent } from "@/lib/posthog";
import type { InstagramMedia, InstagramErrorCode } from "@/types/api";

const MIN_SELECT = 1;
const MAX_SELECT = 5;

type MediaState =
  | { status: "loading" }
  | { status: "error"; code: InstagramErrorCode; message: string }
  | { status: "ready"; media: InstagramMedia[]; accountType: string };

function InstagramScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<MediaState>({ status: "loading" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("instagram_media_picker_opened");

    fetch("/api/instagram/media")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setState({
            status: "error",
            code: (data.error as InstagramErrorCode) ?? "api_error",
            message: data.message ?? "Failed to load Instagram photos",
          });
        } else {
          setState({ status: "ready", media: data.media, accountType: data.accountType });
        }
      })
      .catch(() => {
        setState({ status: "error", code: "api_error", message: "Could not connect to Instagram" });
      });
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECT) {
        next.add(id);
      }
      return next;
    });
  };

  const handleAnalyze = async () => {
    if (selected.size < MIN_SELECT || state.status !== "ready") return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const selectedMedia = state.media.filter((m) => selected.has(m.id));
      trackEvent("instagram_media_selected", { count: selectedMedia.length });

      // Fetch images server-side by submitting selected media URLs.
      // We POST them as a JSON body; the server fetches and analyses.
      const res = await fetch("/api/scan/upload-from-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrls: selectedMedia.map((m) => m.mediaUrl),
          source: "instagram",
          consentGivenAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(msg ?? "Analysis failed");
      }

      trackEvent("scan_upload_completed", { file_count: selectedMedia.length });
      router.push("/scan/confirm");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      trackEvent("intake_fallback", { reason: "upload_error", fallback_to: "instagram" });
    } finally {
      setSubmitting(false);
    }
  };

  const instagramError = searchParams.get("instagram_error");

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border sticky top-0 bg-bg-base/90 backdrop-blur-md z-10">
        <Link href="/intake" className="text-muted hover:text-cream text-sm font-sans transition-colors">
          ← Choose method
        </Link>
        <span className="font-display text-base font-medium text-cream">Select Instagram photos</span>
        <div className="w-24" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Auth error from redirect */}
        {instagramError && (
          <div className="flex items-start gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            {instagramError === "cancelled"
              ? "Instagram connection was cancelled."
              : "Instagram connection failed. Please try again."}
          </div>
        )}

        {/* Loading */}
        {state.status === "loading" && (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-bg-surface border border-border animate-pulse" />
            ))}
          </div>
        )}

        {/* Personal account error */}
        {state.status === "error" && state.code === "personal_account" && (
          <div className="bg-bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Instagram size={22} className="text-gold mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-display text-xl font-medium text-cream mb-1">Business or Creator account required</h2>
                <p className="text-sm font-sans text-muted leading-relaxed">
                  Instagram's API only allows photo access for Business and Creator accounts. Personal accounts are blocked by Instagram's policy — this is not something we can change.
                </p>
              </div>
            </div>
            <div className="bg-bg-elevated border border-border/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-sans font-medium text-cream uppercase tracking-widest mb-2">How to switch</p>
              <ol className="space-y-1.5 text-sm font-sans text-muted">
                <li>1. Open the Instagram app → tap your profile</li>
                <li>2. Tap the menu → <strong className="text-cream">Settings and privacy</strong></li>
                <li>3. Tap <strong className="text-cream">Account type and tools</strong></li>
                <li>4. Tap <strong className="text-cream">Switch to professional account</strong></li>
                <li>5. Choose <strong className="text-cream">Creator</strong> or <strong className="text-cream">Business</strong>, then come back</li>
              </ol>
            </div>
            <a
              href="https://help.instagram.com/502981923235522"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-sans text-gold hover:underline"
            >
              <ExternalLink size={11} />
              Instagram help: switch to professional account
            </a>
            <div className="border-t border-border pt-4">
              <p className="text-xs font-sans text-muted mb-3">Or use a different method:</p>
              <div className="flex gap-3">
                <GoldButton size="sm" onClick={() => {
                  trackEvent("intake_fallback", { reason: "personal_account", fallback_to: "camera" });
                  router.push("/scan");
                }}>
                  Use camera scan
                </GoldButton>
                <GoldButton variant="outline" size="sm" onClick={() => {
                  trackEvent("intake_fallback", { reason: "personal_account", fallback_to: "upload" });
                  router.push("/scan/upload");
                }}>
                  Upload photos
                </GoldButton>
              </div>
            </div>
          </div>
        )}

        {/* Generic API error */}
        {state.status === "error" && state.code !== "personal_account" && (
          <div className="bg-bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-display text-xl font-medium text-cream mb-1">Couldn't load your photos</h2>
                <p className="text-sm font-sans text-muted">{state.message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <GoldButton size="sm" onClick={() => setState({ status: "loading" })}>
                <RefreshCw size={13} />
                Try again
              </GoldButton>
              <GoldButton variant="outline" size="sm" onClick={() => router.push("/intake")}>
                Choose different method
              </GoldButton>
            </div>
          </div>
        )}

        {/* Media grid */}
        {state.status === "ready" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-sans text-muted">
                Select {MIN_SELECT}–{MAX_SELECT} photos for analysis
              </p>
              <span className="text-xs font-sans px-2 py-1 rounded-full bg-bg-elevated border border-border/50 text-muted">
                {selected.size}/{MAX_SELECT} selected
              </span>
            </div>

            {state.media.length === 0 ? (
              <div className="text-center py-16 text-muted font-sans text-sm">
                No photos found on this account.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {state.media.map((item) => {
                  const isSelected = selected.has(item.id);
                  const isDisabled = !isSelected && selected.size >= MAX_SELECT;
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      disabled={isDisabled}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                        isSelected ? "border-gold" : "border-transparent",
                        isDisabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnailUrl ?? item.mediaUrl}
                        alt="Instagram photo"
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center">
                            <Check size={14} className="text-bg-base" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {submitError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <div className="flex flex-col gap-3 pb-8">
              <GoldButton
                size="lg"
                className="w-full justify-center gap-2"
                disabled={selected.size < MIN_SELECT || submitting}
                loading={submitting}
                onClick={handleAnalyze}
              >
                <Check size={16} />
                {submitting ? "Analysing…" : `Analyse ${selected.size} photo${selected.size !== 1 ? "s" : ""}`}
              </GoldButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function InstagramScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-muted font-sans text-sm">Loading…</div>
      </div>
    }>
      <InstagramScanContent />
    </Suspense>
  );
}
