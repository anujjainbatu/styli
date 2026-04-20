import { cn } from "@/lib/utils";

interface ExplanationChipProps {
  icon: string;
  text: string;
  className?: string;
}

export default function ExplanationChip({ icon, text, className }: ExplanationChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans",
        "bg-gold/10 text-gold border border-gold/20",
        className
      )}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </span>
  );
}
