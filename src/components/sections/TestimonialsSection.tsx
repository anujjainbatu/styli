const TESTIMONIALS = [
  {
    quote:
      "I've spent years buying clothes that looked great on the hanger but wrong on me. Styli explained exactly why — and what to look for instead.",
    name: "Aisha M.",
    style: "Warm Autumn · Pear",
    initials: "AM",
    color: "#8B4513",
  },
  {
    quote:
      "The wardrobe gap analysis is the feature I didn't know I needed. It showed me I have 12 tops but only 2 bottoms — obvious in hindsight.",
    name: "Sophie L.",
    style: "Cool Summer · Rectangle",
    initials: "SL",
    color: "#4682B4",
  },
  {
    quote:
      "Finally a styling app that works for deeper skin tones. The Monk scale confirmation means I actually trust the color recommendations.",
    name: "Priya K.",
    style: "Deep Autumn · Hourglass",
    initials: "PK",
    color: "#6B3A2A",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-sans tracking-widest uppercase mb-3">
            Real users
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-light text-cream">
            What people are saying
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-6 bg-bg-surface border border-border rounded-2xl flex flex-col gap-4"
            >
              <div className="text-gold text-4xl font-display leading-none">&ldquo;</div>
              <p className="text-cream/80 font-sans text-sm leading-relaxed flex-1">
                {t.quote}
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-sans font-bold text-cream flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-sans font-medium text-cream">{t.name}</div>
                  <div className="text-xs font-sans text-muted">{t.style}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
