"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && !agreed) {
      setError("Please agree to the terms to continue.");
      return;
    }
    setLoading(true);

    const supabase = getSupabaseBrowser();
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw new Error(signUpError.message);

        if (data.user) {
          await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        }
        router.push("/onboarding");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw new Error(signInError.message);

        const onbRes = await fetch("/api/onboarding");
        const onbData = await onbRes.json();
        router.push(onbData?.preferences ? "/recommendations" : "/onboarding");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/recommendations` },
    });
  };

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Left panel — editorial image (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-bg-elevated overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-dark/30 via-bg-elevated to-bg-base" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6 max-w-sm">
            <Sparkles size={32} className="text-gold mx-auto" />
            <h2 className="font-display text-4xl font-light text-cream leading-tight">
              Your style, <em className="text-gradient-gold not-italic">scientifically</em> matched.
            </h2>
            <p className="text-muted font-sans text-sm leading-relaxed">
              One scan. A style profile built from body proportions, face shape,
              and color season analysis.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {["Hourglass", "Oval face", "Warm Autumn"].map((tag) => (
                <div
                  key={tag}
                  className="px-3 py-2 rounded-xl bg-gold/10 border border-gold/20 text-gold text-xs font-sans text-center"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Sparkles size={18} className="text-gold" />
            <span className="font-display text-xl font-medium text-cream">Styli</span>
          </Link>

          {/* Mode toggle */}
          <div>
            <div className="flex rounded-xl bg-bg-surface border border-border p-1 mb-6">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); }}
                  className={cn(
                    "flex-1 py-2 text-sm font-sans rounded-lg transition-all duration-200",
                    mode === m
                      ? "bg-gold text-bg-base font-medium"
                      : "text-muted hover:text-cream"
                  )}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <h1 className="font-display text-3xl font-light text-cream mb-2">
              {mode === "signin" ? "Welcome back" : "Start your style journey"}
            </h1>
            <p className="text-muted text-sm font-sans">
              {mode === "signin"
                ? "Sign in to access your style profile and wardrobe."
                : "Create your account to get personalized styling."}
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-gray-800 rounded-xl font-sans text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted text-xs font-sans">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-sans text-muted uppercase tracking-wide">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-surface border border-border rounded-xl text-cream text-sm font-sans placeholder:text-muted/50 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-sans text-muted uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-bg-surface border border-border rounded-xl text-cream text-sm font-sans placeholder:text-muted/50 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-sans text-muted uppercase tracking-wide">
                  Password
                </label>
                {mode === "signin" && (
                  <button type="button" className="text-xs font-sans text-gold hover:text-gold-light transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  placeholder="••••••••"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-bg-surface border border-border rounded-xl text-cream text-sm font-sans placeholder:text-muted/50 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-gold cursor-pointer"
                  />
                  <span className="text-xs font-sans text-muted leading-relaxed">
                    I agree to the{" "}
                    <Link href="#" className="text-gold hover:text-gold-light underline underline-offset-2">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="text-gold hover:text-gold-light underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    , including the processing of biometric data (facial geometry and body proportions) for style analysis.
                  </span>
                </label>

                <div className="p-3 rounded-xl bg-gold/5 border border-gold/15">
                  <p className="text-xs font-sans text-muted/80 leading-relaxed">
                    <span className="text-gold font-medium">BIPA Notice:</span> Styli collects facial geometry and body proportion data for style recommendations. No raw camera images are stored. You can delete your biometric data at any time.
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-sans">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <GoldButton
              type="submit"
              size="lg"
              loading={loading}
              className="w-full justify-center"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight size={16} />}
            </GoldButton>
          </form>

          <p className="text-center text-muted text-xs font-sans">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
              className="text-gold hover:text-gold-light transition-colors"
            >
              {mode === "signin" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
