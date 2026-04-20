import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  total: number;
  current: number;
  className?: string;
}

export default function StepIndicator({ total, current, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            step === current
              ? "bg-gold w-8"
              : step < current
              ? "bg-gold/60 w-3"
              : "bg-border w-3"
          )}
        />
      ))}
      <span className="ml-2 text-xs text-muted font-sans">
        {current} of {total}
      </span>
    </div>
  );
}
