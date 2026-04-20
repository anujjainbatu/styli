import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  withNav?: boolean;
}

export default function PageWrapper({
  children,
  className,
  withNav = true,
}: PageWrapperProps) {
  return (
    <main
      className={cn(
        "min-h-screen",
        withNav && "pt-16",
        className
      )}
    >
      {children}
    </main>
  );
}
