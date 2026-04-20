"use client";

import { cn } from "@/lib/utils";

interface MonkSwatchProps {
  tone: number;
  hex: string;
  label: string;
  selected?: boolean;
  detected?: boolean;
  onSelect?: (tone: number) => void;
}

export default function MonkSwatch({
  tone,
  hex,
  label,
  selected = false,
  detected = false,
  onSelect,
}: MonkSwatchProps) {
  return (
    <button
      type="button"
      aria-label={`${label}${detected ? " (detected)" : ""}${selected ? " (selected)" : ""}`}
      aria-pressed={selected}
      onClick={() => onSelect?.(tone)}
      className={cn(
        "relative w-10 h-10 rounded-full transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
        selected
          ? "ring-2 ring-gold ring-offset-2 ring-offset-bg-base scale-110"
          : "hover:scale-105",
        detected && !selected && "ring-1 ring-cream/40 ring-offset-1 ring-offset-bg-base"
      )}
      style={{ backgroundColor: hex }}
    >
      {detected && !selected && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full border border-bg-surface"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
