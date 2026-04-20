"use client";

import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: readonly string[];
  selected: string;
  onSelect: (cat: string) => void;
  className?: string;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
  className,
}: CategoryFilterProps) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto hide-scrollbar pb-1", className)}
      role="tablist"
    >
      {categories.map((cat) => (
        <button
          key={cat}
          role="tab"
          aria-selected={selected === cat}
          onClick={() => onSelect(cat)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-sans transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
            selected === cat
              ? "bg-gold text-bg-base font-medium"
              : "bg-bg-surface text-muted border border-border hover:border-gold/40 hover:text-cream"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
