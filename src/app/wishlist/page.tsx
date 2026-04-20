"use client";

import { useState, useEffect } from "react";
import { Heart, Share2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import PageWrapper from "@/components/layout/PageWrapper";
import CategoryFilter from "@/components/ui/CategoryFilter";
import ExplanationChip from "@/components/ui/ExplanationChip";
import { ProductCardSkeleton } from "@/components/ui/SkeletonCard";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"] as const;

type WishlistItem = {
  id: string;
  productName: string;
  brand?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  category?: string | null;
  matchScore?: number | null;
  affiliateUrl?: string | null;
  explanations?: Array<{ icon: string; text: string }> | null;
};

export default function WishlistPage() {
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);

    fetch(`/api/wishlist?${params}`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then(({ items: fetched }) => setItems(fetched ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category]);

  const removeFromWishlist = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const moveToWardrobe = async (item: WishlistItem) => {
    await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: item.productName,
        brand: item.brand,
        category: item.category ?? "Other",
        primaryColor: null,
        imageUrl: item.imageUrl,
        price: item.price,
        source: "url",
        seasonTags: [],
        productUrl: item.affiliateUrl,
      }),
    }).catch(() => {});
    removeFromWishlist(item.id);
  };

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-cream flex items-center gap-3">
                <Heart size={28} className="text-gold fill-gold/20" />
                Wishlist
              </h1>
              <p className="text-muted text-sm font-sans mt-1">
                {items.length} saved item{items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-xl border border-border text-muted hover:text-cream hover:border-gold/30 transition-colors"
                aria-label="Share wishlist"
              >
                <Share2 size={16} />
              </button>
              <div className="hidden sm:block">
                <select className="px-3 py-2 bg-bg-surface border border-border rounded-xl text-xs font-sans text-muted hover:text-cream focus:outline-none focus:border-gold/40 cursor-pointer">
                  <option>Sort: Recently saved</option>
                  <option>Sort: Price: Low to High</option>
                  <option>Sort: Price: High to Low</option>
                  <option>Sort: Best match</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category filter */}
          <CategoryFilter
            categories={CATEGORIES}
            selected={category}
            onSelect={setCategory}
          />

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <div className="text-center py-20 space-y-5">
              <div className="w-16 h-16 rounded-full bg-bg-surface border border-border flex items-center justify-center mx-auto">
                <Heart size={24} className="text-muted" />
              </div>
              <h3 className="font-display text-2xl font-light text-cream">
                Your wishlist is empty
              </h3>
              <p className="text-muted text-sm font-sans max-w-sm mx-auto">
                Save items from your recommendations to track them here. Click the heart icon on any recommendation.
              </p>
              <Link href="/recommendations">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-bg-base text-sm font-sans font-medium hover:bg-gold-light transition-colors">
                  Browse recommendations
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          )}

          {/* Wishlist grid */}
          {!loading && items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="bg-bg-surface border border-border rounded-2xl overflow-hidden group hover:border-gold/20 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] bg-bg-elevated overflow-hidden">
                    <img
                      src={item.imageUrl ?? undefined}
                      alt={item.productName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Match score */}
                    {item.matchScore != null && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full glass text-xs font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                        <span className="text-gold font-medium">{Math.round(item.matchScore * 100)}% match</span>
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      aria-label="Remove from wishlist"
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-error/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      <Heart size={14} className="text-error fill-error" />
                    </button>

                    {/* Price tracker stub */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-base/70 backdrop-blur-sm text-xs font-sans text-muted/70">
                      <Tag size={9} />
                      Price not tracked
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-sans text-muted">{item.brand}</p>
                      <h3 className="text-sm font-sans font-medium text-cream leading-snug mt-0.5">
                        {item.productName}
                      </h3>
                      {item.price != null && (
                        <p className="text-base font-sans font-semibold text-cream mt-1">
                          {formatPrice(item.price)}
                        </p>
                      )}
                    </div>

                    {/* Top explanation chip */}
                    {item.explanations && item.explanations.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        <ExplanationChip icon={item.explanations[0].icon} text={item.explanations[0].text} />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={cn(
                          "flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-sans border transition-colors",
                          "border-border text-muted hover:border-gold/30 hover:text-cream"
                        )}
                        onClick={() => moveToWardrobe(item)}
                      >
                        Move to wardrobe
                      </button>
                      <a
                        href={item.affiliateUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gold/10 border border-gold/25 text-gold text-xs font-sans hover:bg-gold/20 hover:border-gold/50 transition-all"
                      >
                        <ShoppingBag size={12} />
                        Shop
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Cross-sell */}
          {items.length > 0 && (
            <div className="border-t border-border pt-8 text-center space-y-3">
              <p className="text-muted text-sm font-sans">Want more recommendations?</p>
              <Link
                href="/recommendations"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-light text-sm font-sans transition-colors"
              >
                View all recommendations
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
