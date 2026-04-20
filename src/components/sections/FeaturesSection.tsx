import { Scan, Palette, Shirt, Layers, ShieldCheck, Star } from "lucide-react";

const FEATURES = [
  {
    icon: Scan,
    title: "AI Body Analysis",
    description: "Body proportions from 33 MediaPipe landmarks. FFIT classification — the same system used in academic apparel research.",
  },
  {
    icon: Palette,
    title: "Color Season Matching",
    description: "Monk 10-tone scale skin tone detection mapped to a 12-season color system. What actually works with your complexion.",
  },
  {
    icon: Shirt,
    title: "Digital Wardrobe",
    description: "Add items via URL paste, photo, or manual entry. Track wear counts, build outfits, identify what's missing.",
  },
  {
    icon: Layers,
    title: "Outfit Pairing",
    description: "Recommendations show how many items in your wardrobe each piece pairs with. Practical, not aspirational.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-First",
    description: "Raw camera frames never stored. Biometric data encrypted per-user. BIPA, GDPR, and CCPA compliant from day one.",
  },
  {
    icon: Star,
    title: "Transparent Scoring",
    description: "Every recommendation explains why — color harmony, body fit, outfit compatibility. No black box styling.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-bg-elevated/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-sans tracking-widest uppercase mb-3">
            What you get
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-light text-cream">
            Styling backed by science
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="p-6 bg-bg-surface border border-border rounded-2xl hover:border-gold/30 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <Icon size={20} className="text-gold" />
                </div>
                <h3 className="font-sans font-semibold text-cream mb-2">{feature.title}</h3>
                <p className="font-sans text-sm text-muted leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
