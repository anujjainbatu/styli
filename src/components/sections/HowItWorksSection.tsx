import { Camera, Palette, ShoppingBag } from "lucide-react";

const STEPS = [
  {
    icon: Camera,
    step: "01",
    title: "One camera scan",
    description:
      "Stand in front of your device. Our AI maps 33 body landmarks and 468 facial points in seconds. No photos stored — ever.",
  },
  {
    icon: Palette,
    step: "02",
    title: "Your style profile",
    description:
      "Body shape, face shape, and color season — derived from science, confirmed by you. A style profile that's uniquely yours.",
  },
  {
    icon: ShoppingBag,
    step: "03",
    title: "Recommendations that fit",
    description:
      "Clothing scored on color harmony, body fit, and your existing wardrobe. Every suggestion explained.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-bg-base" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-sans tracking-widest uppercase mb-3">
            The process
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-light text-cream">
            How Styli works
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative text-center group">
                {/* Step number + icon */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-24 h-24 rounded-full bg-bg-surface border border-border flex items-center justify-center mb-3 group-hover:border-gold/40 transition-colors">
                    <Icon size={28} className="text-gold" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold text-bg-base text-xs font-sans font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-2xl font-medium text-cream mb-3">
                  {step.title}
                </h3>
                <p className="text-muted font-sans leading-relaxed text-sm max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
