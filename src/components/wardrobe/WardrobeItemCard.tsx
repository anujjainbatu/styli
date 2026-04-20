"use client";

import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { WardrobeItem } from "@/lib/mock-data";

interface WardrobeItemCardProps {
  item: WardrobeItem;
  view: "grid" | "list";
}

export default function WardrobeItemCard({ item, view }: WardrobeItemCardProps) {
  const [favorited, setFavorited] = useState(item.isFavorite);

  if (view === "list") {
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-bg-surface border-b border-border last:border-b-0 hover:bg-bg-elevated/50 transition-colors group">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg bg-bg-elevated overflow-hidden flex-shrink-0">
          <img src={item.imageUrl ?? undefined} alt={item.productName} className="w-full h-full object-cover" />
        </div>
        {/* Name + brand */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-sans font-medium text-cream truncate">{item.productName}</p>
          <p className="text-xs font-sans text-muted">{item.brand}</p>
        </div>
        {/* Category */}
        <div className="hidden sm:block w-24 text-xs font-sans text-muted">{item.category}</div>
        {/* Color */}
        <div className="hidden md:flex items-center gap-2 w-20">
          <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: item.primaryColorHex ?? undefined }} />
          <span className="text-xs font-sans text-muted capitalize">{item.primaryColor}</span>
        </div>
        {/* Wear count */}
        <div className="hidden sm:block w-16 text-xs font-sans text-muted text-right">
          {item.wearCount}× worn
        </div>
        {/* Last worn */}
        <div className="hidden lg:block w-24 text-xs font-sans text-muted text-right">
          {item.lastWornAt ? formatDate(item.lastWornAt) : "Never"}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            aria-label={favorited ? "Unfavorite" : "Favorite"}
            onClick={() => setFavorited(!favorited)}
            className="p-1.5 rounded-lg hover:bg-bg-base transition-colors"
          >
            <Heart
              size={14}
              className={cn(favorited ? "text-error fill-error" : "text-muted hover:text-cream")}
            />
          </button>
          <button
            aria-label="Delete item"
            className="p-1.5 rounded-lg hover:bg-bg-base transition-colors text-muted hover:text-error"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="bg-bg-surface border border-border rounded-2xl overflow-hidden group hover:border-gold/20 hover:-translate-y-0.5 transition-all duration-200">
      <div className="relative aspect-square bg-bg-elevated overflow-hidden">
        <img
          src={item.imageUrl ?? undefined}
          alt={item.productName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Favorite button */}
        <button
          aria-label={favorited ? "Unfavorite" : "Favorite"}
          aria-pressed={favorited}
          onClick={() => setFavorited(!favorited)}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <Heart
            size={12}
            className={cn(favorited ? "text-error fill-error" : "text-cream/70")}
          />
        </button>
        {/* Wear count badge */}
        {item.wearCount > 0 && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full glass text-xs font-sans text-cream/80">
            {item.wearCount}×
          </div>
        )}
        {/* Source badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full glass text-xs font-sans text-muted capitalize opacity-0 group-hover:opacity-100 transition-opacity">
          {item.source}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-xs font-sans text-muted">{item.brand}</p>
        <p className="text-sm font-sans font-medium text-cream leading-snug">{item.productName}</p>
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.primaryColorHex ?? undefined }} />
            <span className="text-xs font-sans text-muted capitalize">{item.primaryColor}</span>
          </div>
          {item.lastWornAt && (
            <span className="text-xs font-sans text-muted/60">{formatDate(item.lastWornAt)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
