import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-shimmer rounded-lg", className)} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function WardrobeItemSkeleton() {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
