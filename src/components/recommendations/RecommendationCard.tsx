"use client";

import { useState } from "react";
import { Heart, ShoppingBag, Users, Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import ExplanationChip from "@/components/ui/ExplanationChip";
import type { RecommendationItem } from "@/lib/mock-data";

type WardrobeState = "idle" | "adding" | "added" | "error";

interface RecommendationCardProps {
  item: RecommendationItem;
}

export default function RecommendationCard({ item }: RecommendationCardProps) {
  const [wishlisted, setWishlisted] = useState(item.inWishlist);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [wardrobeState, setWardrobeState] = useState<WardrobeState>("idle");

  const addToWardrobe = async () => {
    if (wardrobeState !== "idle") return;
    setWardrobeState("adding");
    try {
      const res = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: item.productName,
          brand: item.brand,
          category: item.category,
          primaryColor: item.primaryColor,
          primaryColorHex: item.primaryColorHex,
          price: item.price,
          imageUrl: item.imageUrl,
          productUrl: item.affiliateUrl,
          source: "manual",
        }),
      });
      if (!res.ok) throw new Error();
      setWardrobeState("added");
    } catch {
      setWardrobeState("error");
      setTimeout(() => setWardrobeState("idle"), 2000);
    }
  };

  const toggleWishlist = async () => {
    const next = !wishlisted;
    setWishlisted(next);
    if (next) {
      fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: item.productName,
          brand: item.brand,
          price: item.price,
          imageUrl: item.imageUrl,
          category: item.category,
          matchScore: item.matchScore,
          affiliateUrl: item.affiliateUrl,
          primaryColor: item.primaryColor,
          primaryColorHex: item.primaryColorHex,
          explanations: item.explanations,
          externalId: item.id,
        }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.item?.id) setWishlistItemId(data.item.id) })
        .catch(() => {});
    } else if (wishlistItemId) {
      fetch(`/api/wishlist/${wishlistItemId}`, { method: "DELETE" }).catch(() => {});
    }
  };

  return (
    <article className="bg-bg-surface border border-border rounded-2xl overflow-hidden group transition-all duration-200 hover:border-gold/20 hover:shadow-card-hover hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-bg-elevated overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.productName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Match score badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full glass text-xs font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="text-gold font-medium">{Math.round(item.matchScore * 100)}% match</span>
        </div>

        {/* Wishlist button */}
        <button
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          onClick={toggleWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <Heart
            size={14}
            className={cn(
              "transition-colors",
              wishlisted ? "text-error fill-error" : "text-cream/70"
            )}
          />
        </button>

        {/* Wardrobe pairing badge */}
        {item.pairsWithCount > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-bg-base/80 backdrop-blur-sm text-xs font-sans text-cream/80">
            <Users size={10} />
            Pairs with {item.pairsWithCount} you own
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-sans text-muted">{item.brand}</p>
          <h3 className="text-sm font-sans font-medium text-cream leading-snug mt-0.5">
            {item.productName}
          </h3>
          <p className="text-base font-sans font-semibold text-cream mt-1">
            {formatPrice(item.price)}
          </p>
        </div>

        {/* Explanation chips — 1 visible + overflow count */}
        <div className="flex items-center gap-1.5 min-h-[24px]">
          {item.explanations[0] && (
            <ExplanationChip
              icon={item.explanations[0].icon}
              text={item.explanations[0].text}
              className="truncate max-w-[160px]"
            />
          )}
          {item.explanations.length > 1 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans bg-bg-elevated border border-border text-muted flex-shrink-0">
              +{item.explanations.length - 1}
            </span>
          )}
        </div>

        {/* Action buttons — stacked, clearly distinct roles */}
        <div className="space-y-2">
          <a
            href={item.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gold/10 border border-gold/25 text-gold text-sm font-sans font-medium hover:bg-gold/20 hover:border-gold/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ShoppingBag size={14} />
            Buy now
          </a>

          <button
            onClick={addToWardrobe}
            disabled={wardrobeState === "adding" || wardrobeState === "added"}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2 rounded-xl border text-xs font-sans font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              wardrobeState === "added"
                ? "bg-success/10 border-success/30 text-success cursor-default"
                : wardrobeState === "error"
                ? "bg-red-500/10 border-red-500/25 text-red-400"
                : "bg-bg-elevated border-border text-muted hover:border-gold/30 hover:text-cream"
            )}
          >
            {wardrobeState === "adding" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : wardrobeState === "added" ? (
              <Check size={13} />
            ) : (
              <Plus size={13} />
            )}
            {wardrobeState === "added"
              ? "In wardrobe"
              : wardrobeState === "error"
              ? "Failed — try again"
              : "Add to wardrobe"}
          </button>
        </div>
      </div>
    </article>
  );
}
