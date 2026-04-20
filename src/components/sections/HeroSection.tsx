"use client";

import Link from "next/link";
import { ArrowRight, Camera, Sparkles } from "lucide-react";
import GoldButton from "@/components/ui/GoldButton";

const FLOATING_ITEMS = [
  {
    name: "Rust Wrap Midi Dress",
    brand: "& Other Stories",
    price: "$135",
    match: "94%",
    color: "bg-amber-800",
    top: "10%",
    left: "60%",
    delay: "0s",
  },
  {
    name: "Forest Green Blazer",
    brand: "Massimo Dutti",
    price: "$220",
    match: "91%",
    color: "bg-green-800",
    top: "40%",
    left: "72%",
    delay: "0.3s",
  },
  {
    name: "Camel Trousers",
    brand: "Arket",
    price: "$89",
    match: "89%",
    color: "bg-yellow-700",
    top: "68%",
    left: "58%",
    delay: "0.6s",
  },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-bg-base">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-base via-bg-base to-bg-elevated" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,169,110,0.08),transparent_60%)]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#FAF8F2 1px, transparent 1px), linear-gradient(90deg, #FAF8F2 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-sans">
              <Sparkles size={12} />
              AI-powered personal styling
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.05] tracking-tight text-cream">
              Dress for the body
              <br />
              you have,{" "}
              <em className="text-gradient-gold not-italic font-medium">
                right now.
              </em>
            </h1>

            <p className="text-muted text-lg font-sans leading-relaxed max-w-md">
              One camera scan. Your body proportions, face shape, and color
              season — analyzed in seconds. Real recommendations for real
              clothes that actually suit you.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/scan">
                <GoldButton size="lg" className="gap-3">
                  <Camera size={18} />
                  Start your analysis — free
                </GoldButton>
              </Link>
              <Link
                href="/recommendations"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-sans text-muted hover:text-cream transition-colors"
              >
                See recommendations
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex items-center gap-6 pt-2">
              <div className="text-center">
                <div className="text-cream font-display text-2xl font-medium">90%</div>
                <div className="text-muted text-xs font-sans">body shape accuracy</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-cream font-display text-2xl font-medium">0</div>
                <div className="text-muted text-xs font-sans">photos stored</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-cream font-display text-2xl font-medium">5k+</div>
                <div className="text-muted text-xs font-sans">curated pieces</div>
              </div>
            </div>
          </div>

          {/* Right: floating product mockup */}
          <div className="relative hidden lg:block h-[520px]">
            {/* Central scan frame */}
            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-56 h-72 rounded-3xl border-2 border-gold/40 bg-bg-surface overflow-hidden shadow-gold-lg">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-base/80" />
              {/* Silhouette */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 80 160" className="w-28 h-auto opacity-30">
                  <ellipse cx="40" cy="18" rx="12" ry="12" fill="#C8A96E" />
                  <path d="M25 35 Q40 30 55 35 L58 90 Q50 88 40 89 Q30 88 22 90 Z" fill="#C8A96E" />
                  <path d="M22 90 L18 140 L30 140 L40 105 L50 140 L62 140 L58 90 Z" fill="#C8A96E" />
                  <path d="M25 35 L10 80" stroke="#C8A96E" strokeWidth="4" strokeLinecap="round" />
                  <path d="M55 35 L70 80" stroke="#C8A96E" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
              {/* Scan line */}
              <div className="absolute left-0 right-0 h-0.5 bg-gold/60 animate-scan-line" />
              <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-sans text-gold/80">
                Analyzing...
              </div>
            </div>

            {/* Floating product cards */}
            {FLOATING_ITEMS.map((item, i) => (
              <div
                key={i}
                className="absolute glass rounded-xl p-3 w-48 shadow-card animate-fade-in"
                style={{
                  top: item.top,
                  left: item.left,
                  animationDelay: item.delay,
                }}
              >
                <div className={`${item.color} w-full h-20 rounded-lg mb-2`} />
                <div className="space-y-0.5">
                  <div className="text-xs text-muted font-sans">{item.brand}</div>
                  <div className="text-sm text-cream font-sans truncate">{item.name}</div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-cream text-sm font-sans font-medium">{item.price}</span>
                    <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-sans">
                      {item.match} match
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
