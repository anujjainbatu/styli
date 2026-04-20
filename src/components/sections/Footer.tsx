import Link from "next/link";
import { Sparkles } from "lucide-react";

const LINKS = {
  Product: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Recommendations", href: "/recommendations" },
    { label: "Wardrobe", href: "/wardrobe" },
    { label: "Pricing", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "BIPA Notice", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Sparkles size={16} className="text-gold" />
              <span className="font-display text-lg font-medium text-cream">Styli</span>
            </Link>
            <p className="text-muted text-sm font-sans leading-relaxed">
              AI-powered personal styling. Recommendations backed by research,
              not guesswork.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-cream text-xs font-sans font-semibold uppercase tracking-widest mb-4">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted text-sm font-sans hover:text-cream transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted text-xs font-sans">
            © 2026 Styli. No raw biometric data stored. BIPA / GDPR / CCPA compliant.
          </p>
          <p className="text-muted/50 text-xs font-sans">
            Styled by AI · Confirmed by you
          </p>
        </div>
      </div>
    </footer>
  );
}
