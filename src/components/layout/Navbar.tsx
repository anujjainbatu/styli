"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/recommendations", label: "Discover" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/wishlist", label: "Wishlist" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLanding = pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isLanding
          ? "bg-transparent"
          : "bg-bg-base/90 backdrop-blur-md border-b border-border"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles
              size={18}
              className="text-gold group-hover:text-gold-light transition-colors"
            />
            <span className="font-display text-xl font-medium tracking-wide text-cream group-hover:text-gold transition-colors">
              Styli
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-sans tracking-wide transition-colors relative pb-0.5",
                  "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gold after:scale-x-0 after:transition-transform after:duration-200 after:origin-left",
                  "hover:text-cream hover:after:scale-x-100",
                  pathname === link.href
                    ? "text-cream after:scale-x-100"
                    : "text-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA + avatar */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/scan"
              className="text-sm font-sans text-gold hover:text-gold-light transition-colors"
            >
              Re-scan
            </Link>
            <Link
              href="/auth"
              className="px-4 py-2 text-sm font-sans font-medium rounded-lg bg-gold text-bg-base hover:bg-gold-light transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted hover:text-cream transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-bg-surface border-t border-border">
          <nav className="px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block text-sm font-sans py-2 transition-colors",
                  pathname === link.href ? "text-gold" : "text-muted hover:text-cream"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border flex gap-3">
              <Link
                href="/scan"
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-2 text-sm font-sans text-center text-gold border border-gold/30 rounded-lg hover:border-gold/60 transition-colors"
              >
                Re-scan
              </Link>
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-2 text-sm font-sans text-center font-medium bg-gold text-bg-base rounded-lg hover:bg-gold-light transition-colors"
              >
                Sign in
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
