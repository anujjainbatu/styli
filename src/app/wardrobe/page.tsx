"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, List, Plus, SortAsc } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import PageWrapper from "@/components/layout/PageWrapper";
import CategoryFilter from "@/components/ui/CategoryFilter";
import WardrobeItemCard from "@/components/wardrobe/WardrobeItemCard";
import { WardrobeItemSkeleton } from "@/components/ui/SkeletonCard";
import { WARDROBE_CATEGORIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type View = "grid" | "list";

const SORT_OPTIONS = [
  { label: "Recently added", value: "recent"     },
  { label: "Most worn",      value: "most_worn"  },
  { label: "Least worn",     value: "least_worn" },
  { label: "By color",       value: "by_color"   },
] as const;

type WardrobeItem = {
  id: string;
  productName: string;
  brand?: string | null;
  category: string;
  primaryColor?: string | null;
  primaryColorHex?: string | null;
  imageUrl?: string | null;
  wearCount: number;
  lastWornAt?: string | null;
  isFavorite: boolean;
  price?: number | null;
  formalityLevel?: number | null;
  source: string;
};

export default function WardrobePage() {
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<View>("grid");
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<WardrobeItem[]>([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    params.set("sort", sort);

    fetch(`/api/wardrobe?${params}`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then(({ items: fetched }) => setItems(fetched ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, sort]);

  const uniqueCategories = [...new Set(items.map((i) => i.category))].length;
  const capsuleScore = Math.round((uniqueCategories / 7) * 100);

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-cream">
                My wardrobe
              </h1>
              <p className="text-muted text-sm font-sans mt-1">
                {items.length} items across {uniqueCategories} categories
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-bg-surface border border-border rounded-2xl p-4 text-center">
              <div className="font-display text-3xl font-light text-cream">
                {items.length}
              </div>
              <div className="text-xs font-sans text-muted mt-1">Total items</div>
            </div>
            <div className="bg-bg-surface border border-border rounded-2xl p-4 text-center">
              <div className="font-display text-3xl font-light text-cream">{uniqueCategories}</div>
              <div className="text-xs font-sans text-muted mt-1">Categories</div>
            </div>
            <div className="bg-bg-surface border border-border rounded-2xl p-4 text-center relative overflow-hidden">
              {/* Capsule ring */}
              <div className="relative w-10 h-10 mx-auto mb-1">
                <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#2E2E3A" strokeWidth="3" />
                  <circle
                    cx="20" cy="20" r="16" fill="none" stroke="#C8A96E" strokeWidth="3"
                    strokeDasharray={`${(capsuleScore / 100) * 100.5} 100.5`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-sans font-bold text-gold">
                  {capsuleScore}%
                </span>
              </div>
              <div className="text-xs font-sans text-muted">Capsule</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <CategoryFilter
              categories={WARDROBE_CATEGORIES}
              selected={category}
              onSelect={setCategory}
              className="flex-1"
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sort */}
              <div className="flex items-center gap-1">
                <SortAsc size={14} className="text-muted" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-2 py-1.5 bg-bg-surface border border-border rounded-lg text-xs font-sans text-muted hover:text-cream focus:outline-none focus:border-gold/40 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* View toggle */}
              <div className="flex rounded-lg bg-bg-surface border border-border p-0.5">
                <button
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    view === "grid" ? "bg-gold text-bg-base" : "text-muted hover:text-cream"
                  )}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    view === "list" ? "bg-gold text-bg-base" : "text-muted hover:text-cream"
                  )}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Grid / List */}
          {loading ? (
            <div className={cn(view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2")}>
              {Array.from({ length: 8 }).map((_, i) => <WardrobeItemSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="text-4xl opacity-30">◻</div>
              <h3 className="font-display text-2xl font-light text-cream">No items here yet</h3>
              <p className="text-muted text-sm font-sans">
                {category === "All"
                  ? "Your wardrobe is empty — add your first item"
                  : `No ${category.toLowerCase()} in your wardrobe`}
              </p>
              <Link
                href="/wardrobe/add"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-bg-base text-sm font-sans font-medium hover:bg-gold-light transition-colors"
              >
                <Plus size={14} />
                Add item
              </Link>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <WardrobeItemCard key={item.id} item={item} view="grid" />
              ))}
            </div>
          ) : (
            <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
              {/* List header */}
              <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-b border-border">
                <div className="w-12 flex-shrink-0" />
                <div className="flex-1 text-xs font-sans text-muted uppercase tracking-widest">Item</div>
                <div className="w-24 text-xs font-sans text-muted uppercase tracking-widest hidden sm:block">Category</div>
                <div className="w-20 text-xs font-sans text-muted uppercase tracking-widest hidden md:block">Color</div>
                <div className="w-16 text-xs font-sans text-muted uppercase tracking-widest text-right hidden sm:block">Worn</div>
                <div className="w-24 text-xs font-sans text-muted uppercase tracking-widest text-right hidden lg:block">Last worn</div>
                <div className="w-16" />
              </div>
              {items.map((item) => (
                <WardrobeItemCard key={item.id} item={item} view="list" />
              ))}
            </div>
          )}
        </div>

        {/* FAB */}
        <Link
          href="/wardrobe/add"
          aria-label="Add wardrobe item"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gold text-bg-base shadow-gold-lg flex items-center justify-center hover:bg-gold-light hover:scale-105 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
        >
          <Plus size={22} />
        </Link>
      </PageWrapper>
    </>
  );
}
