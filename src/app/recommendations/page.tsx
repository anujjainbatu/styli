"use client";

import { useState, useEffect } from "react";
import {
  SlidersHorizontal, ChevronDown, AlertCircle, Sparkles, Search, X, Pencil,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import PageWrapper from "@/components/layout/PageWrapper";
import CategoryFilter from "@/components/ui/CategoryFilter";
import RecommendationCard from "@/components/recommendations/RecommendationCard";
import { ProductCardSkeleton } from "@/components/ui/SkeletonCard";
import MonkSwatch from "@/components/ui/MonkSwatch";
import GoldButton from "@/components/ui/GoldButton";
import {
  SEASON_PALETTES, MONK_TONES, STYLE_OPTIONS, GENDER_OPTIONS, BUDGET_TIERS,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"] as const;
const SORT_OPTIONS = [
  { label: "Best match",         value: "best_match" },
  { label: "Price: Low to High", value: "price_asc"  },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest",             value: "newest"     },
] as const;

const BODY_SHAPES = [
  "hourglass", "pear", "apple", "rectangle", "inverted_triangle",
  "athletic", "oval", "diamond", "spoon",
];
const FACE_SHAPES = ["oval", "round", "square", "heart", "oblong", "diamond", "triangle"];
const COLOR_SEASONS = [
  "bright_spring", "light_spring", "warm_spring",
  "light_summer", "cool_summer", "soft_summer",
  "soft_autumn", "warm_autumn", "deep_autumn",
  "deep_winter", "cool_winter", "bright_winter",
];

function formatSeason(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function cmToFtIn(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

type RecommendationItem = {
  id: string;
  productName: string;
  brand: string;
  price: number;
  imageUrl: string;
  category: string;
  matchScore: number;
  explanations: Array<{ icon: string; text: string }>;
  pairsWithCount: number;
  inWishlist: boolean;
  affiliateUrl: string;
  primaryColor: string;
  primaryColorHex: string;
};

type UserProfile = {
  bodyShape: string;
  faceShape: string;
  colorSeason: string;
  colorPalette: string[];
  monkTone: number;
  skinUndertone: string;
  recommendedSilhouettes: string[];
  recommendedNecklines: string[];
  genderIdentity: string;
  heightCm: number | null;
  preferredStyles: string[];
  budgetTier: string;
};

export default function RecommendationsPage() {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("best_match");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gapOpen, setGapOpen] = useState(true);
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [intentKeywords, setIntentKeywords] = useState<string[]>([]);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [intentInput, setIntentInput] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/scan/confirm").then((r) => r.ok ? r.json() : null),
      fetch("/api/onboarding").then((r) => r.ok ? r.json() : null),
    ]).then(([bodyData, prefData]) => {
      const p = bodyData?.profile ?? {};
      const pr = prefData?.preferences ?? {};
      setUserProfile({
        bodyShape:               p.bodyShape               ?? "hourglass",
        faceShape:               p.faceShape               ?? "oval",
        colorSeason:             p.colorSeason             ?? "warm_autumn",
        colorPalette:            p.colorPalette            ?? [],
        monkTone:                p.monkTone                ?? 5,
        skinUndertone:           p.skinUndertone           ?? "warm",
        recommendedSilhouettes:  p.recommendedSilhouettes  ?? [],
        recommendedNecklines:    p.recommendedNecklines    ?? [],
        genderIdentity:          pr.genderIdentity         ?? "",
        heightCm:                pr.heightCm               ?? null,
        preferredStyles:         pr.preferredStyles        ?? [],
        budgetTier:              pr.budgetTier             ?? "mid",
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    fetch("/api/recommendations/intent", { method: "POST" })
      .then((r) => r.ok ? r.json() : { keywords: [] })
      .then(({ keywords }: { keywords: string[] }) => {
        if (keywords?.length) {
          setIntentKeywords(keywords);
          setIntent(keywords[0]);
        }
      })
      .catch(() => {});
  }, [userProfile]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    params.set("sort", sort);
    if (intent) params.set("intent", intent);

    fetch(`/api/recommendations?${params}`)
      .then((r) => r.ok ? r.json() : { items: [], fallback: false })
      .then(({ items: fetched, fallback, fallbackReason: reason }: {
        items: RecommendationItem[];
        fallback: boolean;
        fallbackReason?: string;
      }) => {
        setItems(fetched ?? []);
        setFallbackReason(fallback ? (reason ?? null) : null);
      })
      .catch(() => { setItems([]); setFallbackReason(null); })
      .finally(() => setLoading(false));
  }, [category, sort, intent]);

  function openDrawer() {
    if (userProfile) setDraft({ ...userProfile });
    setIsDrawerOpen(true);
  }

  async function handleSave() {
    if (!draft) return;
    setIsSaving(true);
    try {
      const [bodyRes, prefRes] = await Promise.all([
        fetch("/api/scan/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monkTone:               draft.monkTone,
            skinUndertone:          draft.skinUndertone,
            bodyShape:              draft.bodyShape,
            faceShape:              draft.faceShape,
            colorSeason:            draft.colorSeason,
            recommendedSilhouettes: [],
            recommendedNecklines:   [],
            colorPalette:           [],
            avoidColors:            [],
          }),
        }),
        fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genderIdentity: draft.genderIdentity || undefined,
            heightCm:       draft.heightCm       ?? undefined,
            preferredStyles: draft.preferredStyles,
            budgetTier:     draft.budgetTier      || undefined,
          }),
        }),
      ]);

      if (bodyRes.ok && prefRes.ok) {
        const [bodyData, prefData] = await Promise.all([bodyRes.json(), prefRes.json()]);
        const p  = bodyData?.profile      ?? {};
        const pr = prefData?.preferences  ?? {};
        setUserProfile({
          bodyShape:               p.bodyShape               ?? draft.bodyShape,
          faceShape:               p.faceShape               ?? draft.faceShape,
          colorSeason:             p.colorSeason             ?? draft.colorSeason,
          colorPalette:            p.colorPalette            ?? [],
          monkTone:                p.monkTone                ?? draft.monkTone,
          skinUndertone:           p.skinUndertone           ?? draft.skinUndertone,
          recommendedSilhouettes:  p.recommendedSilhouettes  ?? [],
          recommendedNecklines:    p.recommendedNecklines    ?? [],
          genderIdentity:          pr.genderIdentity         ?? draft.genderIdentity,
          heightCm:                pr.heightCm               ?? draft.heightCm,
          preferredStyles:         pr.preferredStyles        ?? draft.preferredStyles,
          budgetTier:              pr.budgetTier             ?? draft.budgetTier,
        });
        setIsDrawerOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const colorSeason   = userProfile?.colorSeason ?? "warm_autumn";
  const season        = SEASON_PALETTES[colorSeason] ?? SEASON_PALETTES["warm_autumn"];
  const paletteColors = (userProfile?.colorPalette?.length ?? 0) > 0
    ? userProfile!.colorPalette
    : season.colors;
  const monkHex    = MONK_TONES.find((m) => m.tone === (userProfile?.monkTone ?? 5))?.hex ?? "#D7B899";
  const budgetMeta = BUDGET_TIERS.find((b) => b.id === (userProfile?.budgetTier ?? "mid"));

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6">
              <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4 sticky top-24">
                <h3 className="text-xs font-sans font-semibold text-muted uppercase tracking-widest">
                  Style profile
                </h3>

                {/* Physical measurements */}
                {(userProfile?.genderIdentity || userProfile?.heightCm) && (
                  <div className="space-y-2.5">
                    {userProfile.genderIdentity && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-sans text-muted">Gender</span>
                        <span className="text-xs font-sans text-cream capitalize">
                          {GENDER_OPTIONS.find((g) => g.id === userProfile.genderIdentity)?.label
                           ?? userProfile.genderIdentity}
                        </span>
                      </div>
                    )}
                    {userProfile.heightCm && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-sans text-muted">Height</span>
                        <span className="text-xs font-sans text-cream">
                          {userProfile.heightCm} cm · {cmToFtIn(userProfile.heightCm)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Body & face */}
                <div className={cn(
                  "space-y-2.5",
                  (userProfile?.genderIdentity || userProfile?.heightCm) && "border-t border-border/50 pt-3"
                )}>
                  {[
                    { label: "Body shape",   value: userProfile?.bodyShape
                        ? userProfile.bodyShape.replace(/_/g, " ") : "—" },
                    { label: "Face shape",   value: userProfile?.faceShape ?? "—" },
                    { label: "Color season", value: formatSeason(userProfile?.colorSeason ?? "warm_autumn") },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs font-sans text-muted">{item.label}</span>
                      <span className="text-xs font-sans text-cream capitalize">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Skin tone */}
                <div className="border-t border-border/50 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans text-muted">Skin tone</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: monkHex }}
                      />
                      <span className="text-xs font-sans text-cream">
                        Monk {userProfile?.monkTone ?? 5}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans text-muted">Undertone</span>
                    <span className="text-xs font-sans text-cream capitalize">
                      {userProfile?.skinUndertone ?? "warm"}
                    </span>
                  </div>
                </div>

                {/* Palette */}
                <div className="border-t border-border/50 pt-3">
                  <p className="text-xs font-sans text-muted mb-2">Your palette</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {paletteColors.map((hex, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border border-border/50"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preferred styles */}
                {(userProfile?.preferredStyles?.length ?? 0) > 0 && (
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-xs font-sans text-muted mb-2">Preferred styles</p>
                    <div className="flex gap-1 flex-wrap">
                      {userProfile!.preferredStyles.map((styleId) => {
                        const style = STYLE_OPTIONS.find((s) => s.id === styleId);
                        return style ? (
                          <span
                            key={styleId}
                            className="px-2 py-0.5 bg-bg-base border border-border rounded-full text-xs font-sans text-muted"
                          >
                            {style.icon} {style.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-xs font-sans font-semibold text-muted uppercase tracking-widest">
                    Filters
                  </p>
                  {[
                    budgetMeta
                      ? `Budget: ${budgetMeta.label} (${budgetMeta.range})`
                      : "Budget: Mid ($50–$150)",
                    "Size: M / 8",
                    "In stock only",
                  ].map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-3.5 h-3.5 accent-gold cursor-pointer"
                      />
                      <span className="text-xs font-sans text-muted group-hover:text-cream transition-colors">
                        {f}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Edit button */}
                <button
                  onClick={openDrawer}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border/60 text-muted hover:text-cream hover:border-gold/40 text-xs font-sans transition-colors"
                >
                  <Pencil size={11} />
                  Edit profile
                </button>
              </div>
            </aside>

            {/* ── Main content ─────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl font-light text-cream">
                    Recommended for you
                  </h1>
                  <p className="text-muted text-sm font-sans mt-1">
                    {items.length} pieces ·{" "}
                    {intent ? `matched for "${intent}"` : "scored for your style profile"}
                  </p>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface border border-border text-muted hover:text-cream text-sm font-sans transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  Filter
                </button>
              </div>

              {/* Mobile filters */}
              {showFilters && (
                <div className="lg:hidden bg-bg-surface border border-border rounded-xl p-4 space-y-3 animate-fade-in">
                  {["Budget: Mid ($50–$150)", "Size: M / 8", "In stock only"].map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 accent-gold" />
                      <span className="text-sm font-sans text-muted">{f}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Intent search + AI chips */}
              <div className="space-y-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = intentInput.trim();
                    if (trimmed) setIntent(trimmed);
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    <input
                      type="text"
                      value={intentInput}
                      onChange={(e) => setIntentInput(e.target.value)}
                      placeholder="e.g. white relaxed pant, navy blazer…"
                      className="w-full pl-9 pr-8 py-2.5 bg-bg-surface border border-border rounded-xl text-sm font-sans text-cream placeholder:text-muted/50 focus:outline-none focus:border-gold/40"
                    />
                    {intentInput && (
                      <button
                        type="button"
                        onClick={() => { setIntentInput(""); setIntent(null); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/25 text-gold text-sm font-sans font-medium hover:bg-gold/20 transition-colors"
                  >
                    Search
                  </button>
                </form>

                {intentKeywords.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted font-sans flex items-center gap-1">
                      <Sparkles size={10} className="text-gold" /> AI suggests:
                    </span>
                    {intentKeywords.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => {
                          setIntent(intent === kw ? null : kw);
                          setIntentInput(intent === kw ? "" : kw);
                        }}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-sans border transition-colors",
                          intent === kw
                            ? "bg-gold/20 border-gold/50 text-gold"
                            : "bg-bg-surface border-border text-muted hover:text-cream"
                        )}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Wardrobe gap callout */}
              <div className="bg-bg-surface border border-gold/20 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setGapOpen(!gapOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center">
                      <Sparkles size={12} className="text-gold" />
                    </div>
                    <div>
                      <span className="text-sm font-sans font-medium text-cream">Wardrobe gaps</span>
                      <span className="text-xs text-muted font-sans ml-2">3 items missing</span>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn("text-muted transition-transform", gapOpen ? "rotate-180" : "")}
                  />
                </button>
                {gapOpen && (
                  <div className="px-5 pb-4 space-y-2 border-t border-border animate-fade-in">
                    {[
                      { cat: "Shoes",       msg: "No neutral heels in your wardrobe" },
                      { cat: "Outerwear",   msg: "Missing a casual layer for spring" },
                      { cat: "Accessories", msg: "No structured bag detected" },
                    ].map((gap) => (
                      <div key={gap.cat} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={12} className="text-warning" />
                          <span className="text-xs font-sans text-muted">{gap.msg}</span>
                        </div>
                        <button
                          onClick={() => setCategory(gap.cat)}
                          className="text-xs font-sans text-gold hover:text-gold-light transition-colors"
                        >
                          Show options →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter + sort bar */}
              <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
                <CategoryFilter
                  categories={CATEGORIES}
                  selected={category}
                  onSelect={setCategory}
                  className="flex-1"
                />
                <div className="flex-shrink-0">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="px-3 py-2 bg-bg-surface border border-border rounded-xl text-sm font-sans text-muted hover:text-cream focus:outline-none focus:border-gold/40 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fallback notice */}
              {fallbackReason && (
                <div className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-warning/20 rounded-xl">
                  <AlertCircle size={12} className="text-warning" />
                  <span className="text-xs font-sans text-muted">{fallbackReason}</span>
                </div>
              )}

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="text-4xl">✦</div>
                  <h3 className="font-display text-2xl font-light text-cream">
                    No items in this category
                  </h3>
                  <p className="text-muted text-sm font-sans">
                    Try a different filter or{" "}
                    <button
                      onClick={() => setCategory("All")}
                      className="text-gold hover:text-gold-light underline"
                    >
                      view all recommendations
                    </button>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>

      {/* ── Edit Profile Drawer ──────────────────────────────────────────── */}
      {isDrawerOpen && draft && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-surface border-l border-border z-50 flex flex-col shadow-2xl">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
              <h2 className="font-sans font-semibold text-cream text-base">Edit Style Profile</h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-muted hover:text-cream transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Gender */}
              <div className="space-y-2">
                <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">
                  Gender identity
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setDraft((d) => d ? { ...d, genderIdentity: g.id } : d)}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-xs font-sans transition-colors",
                        draft.genderIdentity === g.id
                          ? "bg-gold/20 border-gold/50 text-gold"
                          : "bg-bg-base border-border text-muted hover:text-cream"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height */}
              <div className="space-y-2">
                <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">
                  Height
                  <span className="ml-2 text-cream normal-case font-normal">
                    {draft.heightCm
                      ? `${draft.heightCm} cm · ${cmToFtIn(draft.heightCm)}`
                      : "Not set"}
                  </span>
                </p>
                <input
                  type="range"
                  min={140}
                  max={220}
                  step={1}
                  value={draft.heightCm ?? 165}
                  onChange={(e) =>
                    setDraft((d) => d ? { ...d, heightCm: Number(e.target.value) } : d)
                  }
                  className="w-full accent-gold"
                />
                <div className="flex justify-between text-xs font-sans text-muted/50">
                  <span>140 cm</span>
                  <span>220 cm</span>
                </div>
              </div>

              {/* Body shape */}
              <div className="space-y-2">
                <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">
                  Body shape
                </p>
                <select
                  value={draft.bodyShape}
                  onChange={(e) =>
                    setDraft((d) => d ? { ...d, bodyShape: e.target.value } : d)
                  }
                  className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-sans text-cream focus:outline-none focus:border-gold/40 cursor-pointer"
                >
                  {BODY_SHAPES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Face shape */}
              <div className="space-y-2">
                <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">
                  Face shape
                </p>
                <select
                  value={draft.faceShape}
                  onChange={(e) =>
                    setDraft((d) => d ? { ...d, faceShape: e.target.value } : d)
                  }
                  className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-sans text-cream focus:outline-none focus:border-gold/40 cursor-pointer"
                >
                  {FACE_SHAPES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color season */}
              <div className="space-y-2">
                <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">
                  Color season
                </p>
                <select
                  value={draft.colorSeason}
                  onChange={(e) =>
                    setDraft((d) => d ? { ...d, colorSeason: e.target.value } : d)
                  }
                  className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-sans text-cream focus:outline-none focus:border-gold/40 cursor-pointer"
                >
                  {COLOR_SEASONS.map((s) => (
                    <option key={s} value={s}>{formatSeason(s)}</option>
                  ))}
                </select>
              </div>

              {/* Skin tone — Monk scale */}
              <div className="space-y-3">
                <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">
                  Skin tone (Monk scale)
                </p>
                <div className="flex flex-wrap gap-2">
                  {MONK_TONES.map((m) => (
                    <MonkSwatch
                      key={m.tone}
                      tone={m.tone}
                      hex={m.hex}
                      label={m.label}
                      selected={draft.monkTone === m.tone}
                      onSelect={(tone) =>
                        setDraft((d) => d ? { ...d, monkTone: tone } : d)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Skin undertone */}
              <div className="space-y-2">
                <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">
                  Skin undertone
                </p>
                <div className="flex gap-2">
                  {(["warm", "cool", "neutral"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() =>
                        setDraft((d) => d ? { ...d, skinUndertone: u } : d)
                      }
                      className={cn(
                        "flex-1 py-2 rounded-xl border text-xs font-sans capitalize transition-colors",
                        draft.skinUndertone === u
                          ? "bg-gold/20 border-gold/50 text-gold"
                          : "bg-bg-base border-border text-muted hover:text-cream"
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred styles */}
              <div className="space-y-2">
                <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">
                  Preferred styles
                </p>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((style) => {
                    const selected = draft.preferredStyles.includes(style.id);
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() =>
                          setDraft((d) => {
                            if (!d) return d;
                            const styles = selected
                              ? d.preferredStyles.filter((s) => s !== style.id)
                              : [...d.preferredStyles, style.id];
                            return { ...d, preferredStyles: styles };
                          })
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-full border text-xs font-sans transition-colors",
                          selected
                            ? "bg-gold/20 border-gold/50 text-gold"
                            : "bg-bg-base border-border text-muted hover:text-cream"
                        )}
                      >
                        {style.icon} {style.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">
                  Budget
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() =>
                        setDraft((d) => d ? { ...d, budgetTier: tier.id } : d)
                      }
                      className={cn(
                        "px-3 py-2.5 rounded-xl border text-xs font-sans transition-colors text-left",
                        draft.budgetTier === tier.id
                          ? "bg-gold/20 border-gold/50 text-gold"
                          : "bg-bg-base border-border text-muted hover:text-cream"
                      )}
                    >
                      <div className="font-medium">{tier.label}</div>
                      <div className="text-[10px] opacity-70">{tier.range}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border flex-shrink-0">
              <GoldButton
                variant="primary"
                size="md"
                loading={isSaving}
                onClick={handleSave}
                className="flex-1"
              >
                Save changes
              </GoldButton>
              <GoldButton
                variant="ghost"
                size="md"
                onClick={() => setIsDrawerOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </GoldButton>
            </div>
          </div>
        </>
      )}
    </>
  );
}
