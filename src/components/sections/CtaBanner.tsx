import Link from "next/link";
import GoldButton from "@/components/ui/GoldButton";
import { Camera } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gold-dark/20 via-bg-elevated to-bg-surface" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,169,110,0.1),transparent_70%)]" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-cream mb-6 leading-tight">
          Ready to dress like
          <br />
          <em className="text-gradient-gold not-italic">yourself?</em>
        </h2>
        <p className="text-muted font-sans text-lg mb-10 leading-relaxed">
          Your style analysis is free. No subscription required to start.
          <br className="hidden sm:block" />
          Add your wardrobe, get real recommendations in minutes.
        </p>

        <Link href="/scan">
          <GoldButton size="lg" className="mx-auto gap-3 text-base">
            <Camera size={18} />
            Start your style analysis
          </GoldButton>
        </Link>

        <p className="text-muted/60 text-xs font-sans mt-6">
          No photos stored · BIPA compliant · Delete your data anytime
        </p>
      </div>
    </section>
  );
}
