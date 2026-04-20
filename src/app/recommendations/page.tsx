"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, ChevronDown, AlertCircle, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import PageWrapper from "@/components/layout/PageWrapper";
import CategoryFilter from "@/components/ui/CategoryFilter";
import RecommendationCard from "@/components/recommendations/RecommendationCard";
import { ProductCardSkeleton } from "@/components/ui/SkeletonCard";
import { SEASON_PALETTES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"] as const;
const SORT_OPTIONS = [
  { label: "Best match",           value: "best_match"  },
  { label: "Price: Low to High",   value: "price_asc"   },
  { label: "Price: High to Low",   value: "price_desc"  },
  { label: "Newest",               value: "newest"      },
] as const;

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
};

export default function RecommendationsPage() {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("best_match");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gapOpen, setGapOpen] = useState(true);
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/scan/confirm")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.profile) {
          const p = data.profile;
          setUserProfile({
            bodyShape: p.bodyShape ?? "hourglass",
            faceShape: p.faceShape ?? "oval",
            colorSeason: p.colorSeason ?? "warm_autumn",
            colorPalette: p.colorPalette ?? [],
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    params.set("sort", sort);

    fetch(`/api/recommendations?${params}`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then(({ items: fetched }) => setItems(fetched ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, sort]);

  const colorSeason = userProfile?.colorSeason ?? "warm_autumn";
  const season = SEASON_PALETTES[colorSeason] ?? SEASON_PALETTES["warm_autumn"];

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar (desktop) */}
            <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6">
              <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4 sticky top-24">
                <h3 className="text-xs font-sans font-semibold text-muted uppercase tracking-widest">
                  Style profile
                </h3>

                <div className="space-y-3">
                  {[
                    { label: "Body shape",   value: userProfile?.bodyShape ?? "—" },
                    { label: "Face shape",   value: userProfile?.faceShape ?? "—" },
                    { label: "Color season", value: season.label },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs font-sans text-muted">{item.label}</span>
                      <span className="text-xs font-sans text-cream capitalize">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-sans text-muted mb-2">Your palette</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {season.colors.map((hex, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border border-border/50"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-xs font-sans font-semibold text-muted uppercase tracking-widest">
                    Filters
                  </p>
                  {["Budget: Mid ($50–$150)", "Size: M / 8", "In stock only"].map((f) => (
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
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl font-light text-cream">
                    Recommended for you
                  </h1>
                  <p className="text-muted text-sm font-sans mt-1">
                    {items.length} pieces · scored for your style profile
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
    </>
  );
}
