import { cn } from "@/lib/utils";

interface DarkCardProps {
  children: React.ReactNode;
  className?: string;
  goldAccent?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

export default function DarkCard({
  children,
  className,
  goldAccent = false,
  hoverable = false,
  onClick,
}: DarkCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-bg-surface border border-border rounded-2xl overflow-hidden",
        goldAccent && "border-t-2 border-t-gold",
        hoverable && "cursor-pointer transition-all duration-200 hover:border-gold/30 hover:shadow-card-hover hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
