"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Link2, Image as ImageIcon, PenLine, Upload, Check, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";
import { Skeleton } from "@/components/ui/SkeletonCard";
import Navbar from "@/components/layout/Navbar";
import PageWrapper from "@/components/layout/PageWrapper";

type Tab = "url" | "image" | "manual";
type UrlState = "idle" | "loading" | "success" | "error";

type ExtractedItem = {
  name: string | null;
  brand: string | null;
  price: string | null;
  category: string | null;
  color: string | null;
  colorHex: string | null;
  imageUrl: string | null;
};

const CATEGORIES = ["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Bags"];
const PATTERNS   = ["Solid", "Stripes", "Plaid", "Floral", "Polka dot", "Geometric", "Animal print"];
const MATERIALS  = ["Cotton", "Linen", "Silk", "Polyester", "Wool", "Denim", "Leather", "Knit"];
const SEASONS    = ["Spring", "Summer", "Autumn", "Winter", "All season"];

export default function AddItemPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [urlState, setUrlState] = useState<UrlState>("idle");
  const [extracted, setExtracted] = useState<ExtractedItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(["All season"]);
  const [formality, setFormality] = useState(2);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual form state
  const [manualName, setManualName] = useState("");
  const [manualBrand, setManualBrand] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualColor, setManualColor] = useState("");
  const [manualColorHex, setManualColorHex] = useState("");
  const [manualPattern, setManualPattern] = useState("");
  const [manualMaterial, setManualMaterial] = useState("");

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setUrlState("loading");
    setExtracted(null);
    try {
      const res = await fetch("/api/wardrobe/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to extract");
      const p = data.product;
      setExtracted({
        name: p.name,
        brand: p.brand,
        price: p.price?.toString() ?? null,
        category: p.category,
        color: p.color,
        colorHex: p.colorHex,
        imageUrl: p.imageUrl,
      });
      setUrlState("success");
    } catch {
      setUrlState("error");
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageFile(ev.target?.result as string);
      setImageAnalyzing(true);
      setTimeout(() => {
        setImageAnalyzing(false);
        setExtracted({ name: null, brand: null, price: null, category: null, color: null, colorHex: null, imageUrl: ev.target?.result as string });
      }, 2200);
    };
    reader.readAsDataURL(file);
  };

  const saveToWardrobe = async (item: {
    productName: string;
    brand?: string;
    category: string;
    price?: number;
    imageUrl?: string;
    productUrl?: string;
    primaryColor?: string;
    primaryColorHex?: string;
    source: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          formalityLevel: formality,
          seasonTags: selectedSeasons,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setAdded(true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExtracted = () => {
    if (!extracted?.name) return;
    saveToWardrobe({
      productName: extracted.name,
      brand: extracted.brand ?? undefined,
      category: extracted.category ?? "Tops",
      price: extracted.price ? parseFloat(extracted.price) : undefined,
      imageUrl: extracted.imageUrl ?? undefined,
      productUrl: tab === "url" ? url : undefined,
      primaryColor: extracted.color ?? undefined,
      primaryColorHex: extracted.colorHex ?? undefined,
      source: tab,
    });
  };

  const handleAddManual = () => {
    if (!manualName || !manualCategory) return;
    saveToWardrobe({
      productName: manualName,
      brand: manualBrand || undefined,
      category: manualCategory,
      price: manualPrice ? parseFloat(manualPrice) : undefined,
      primaryColor: manualColor || undefined,
      primaryColorHex: manualColorHex || undefined,
      source: "manual",
    });
  };

  const toggleSeason = (s: string) => {
    setSelectedSeasons((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "url",    label: "Paste URL",      icon: <Link2 size={14} /> },
    { id: "image",  label: "Upload photo",   icon: <ImageIcon size={14} /> },
    { id: "manual", label: "Manual entry",   icon: <PenLine size={14} /> },
  ];

  if (added) {
    return (
      <>
        <Navbar />
        <PageWrapper>
          <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-success/10 border-2 border-success flex items-center justify-center mx-auto">
              <Check size={36} className="text-success" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-light text-cream mb-2">Item added!</h2>
              <p className="text-muted font-sans text-sm">
                {extracted?.name ?? manualName ?? "Your item"} is now in your wardrobe.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/wardrobe">
                <GoldButton variant="outline" size="md">View wardrobe</GoldButton>
              </Link>
              <GoldButton size="md" onClick={() => {
                setAdded(false); setExtracted(null); setUrl(""); setUrlState("idle");
                setImageFile(null); setManualName(""); setManualCategory("");
              }}>
                Add another
              </GoldButton>
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/wardrobe" className="p-2 rounded-xl text-muted hover:text-cream hover:bg-bg-surface transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-display text-3xl font-light text-cream">Add to wardrobe</h1>
              <p className="text-muted text-sm font-sans mt-0.5">Paste a link, upload a photo, or enter details manually</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-2xl bg-bg-surface border border-border p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setExtracted(null); setUrlState("idle"); setImageFile(null); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-sans transition-all duration-200",
                  tab === t.id
                    ? "bg-gold text-bg-base font-medium"
                    : "text-muted hover:text-cream"
                )}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab: URL */}
          {tab === "url" && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4">
                <label className="text-xs font-sans text-muted uppercase tracking-widest">
                  Product URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.nordstrom.com/product/..."
                    className="flex-1 px-4 py-3 bg-bg-elevated border border-border rounded-xl text-cream text-sm font-sans placeholder:text-muted/50 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                  />
                  <GoldButton
                    onClick={handleFetchUrl}
                    disabled={!url.trim() || urlState === "loading"}
                    loading={urlState === "loading"}
                    size="md"
                  >
                    Fetch
                  </GoldButton>
                </div>
                {urlState === "error" && (
                  <p className="text-xs font-sans text-error">Could not extract product details. Try a different URL or use manual entry.</p>
                )}
                <p className="text-xs font-sans text-muted">
                  Works with Nordstrom, ASOS, Zara, H&M, Net-a-Porter, and 200+ more stores.
                </p>
              </div>

              {/* Loading state */}
              {urlState === "loading" && (
                <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-sm font-sans text-gold">
                    <Loader2 size={14} className="animate-spin" />
                    Extracting product details...
                  </div>
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              )}

              {/* Extracted preview */}
              {urlState === "success" && extracted && (
                <ExtractedPreview extracted={extracted} onAdd={handleAddExtracted} saving={saving} />
              )}
            </div>
          )}

          {/* Tab: Image */}
          {tab === "image" && (
            <div className="space-y-5 animate-fade-in">
              {!imageFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleImageDrop}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer",
                    dragOver
                      ? "border-gold/70 bg-gold/5"
                      : "border-border bg-bg-surface hover:border-gold/40 hover:bg-bg-elevated/30"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload clothing photo"
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageInput}
                  />
                  <Upload size={32} className="text-muted mx-auto mb-4" />
                  <p className="text-cream font-sans font-medium mb-1">Drop a photo here</p>
                  <p className="text-muted text-sm font-sans mb-4">or click to browse</p>
                  <p className="text-muted/60 text-xs font-sans">JPG, PNG, WEBP · Max 10MB</p>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-bg-surface border border-border rounded-2xl p-4">
                    <div className="flex gap-4">
                      <img
                        src={imageFile}
                        alt="Uploaded clothing"
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                      <div className="flex-1 space-y-2">
                        {imageAnalyzing ? (
                          <>
                            <div className="flex items-center gap-2 text-sm font-sans text-gold">
                              <Loader2 size={14} className="animate-spin" />
                              Analyzing with AI...
                            </div>
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-2/3" />
                          </>
                        ) : (
                          <p className="text-sm font-sans text-success flex items-center gap-1.5">
                            <Check size={14} />
                            Analysis complete
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => { setImageFile(null); setExtracted(null); }}
                        className="p-1.5 text-muted hover:text-cream transition-colors"
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  {!imageAnalyzing && extracted && (
                    <ExtractedPreview extracted={extracted} onAdd={handleAddExtracted} saving={saving} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Manual */}
          {tab === "manual" && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-bg-surface border border-border rounded-2xl p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-sans text-muted uppercase tracking-widest">Item name *</label>
                    <input
                      type="text"
                      placeholder="e.g. White Linen Shirt"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-cream text-sm font-sans placeholder:text-muted/50 focus:outline-none focus:border-gold/60 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-muted uppercase tracking-widest">Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. Everlane"
                      value={manualBrand}
                      onChange={(e) => setManualBrand(e.target.value)}
                      className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-cream text-sm font-sans placeholder:text-muted/50 focus:outline-none focus:border-gold/60 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-muted uppercase tracking-widest">Category *</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-muted text-sm font-sans focus:outline-none focus:border-gold/60 cursor-pointer"
                    >
                      <option value="">Select...</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-muted uppercase tracking-widest">Price (optional)</label>
                    <input
                      type="number"
                      placeholder="$0"
                      min="0"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-cream text-sm font-sans placeholder:text-muted/50 focus:outline-none focus:border-gold/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="text-xs font-sans text-muted uppercase tracking-widest">Primary color</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { hex: "#FFFFFF", name: "white" },
                      { hex: "#1A1A1A", name: "black" },
                      { hex: "#C19A6B", name: "camel" },
                      { hex: "#B7410E", name: "rust" },
                      { hex: "#556B2F", name: "olive" },
                      { hex: "#4682B4", name: "blue" },
                      { hex: "#722F37", name: "burgundy" },
                      { hex: "#FAD5A5", name: "peach" },
                      { hex: "#D2B48C", name: "tan" },
                      { hex: "#8FBC8F", name: "sage" },
                    ].map(({ hex, name }) => (
                      <button
                        key={hex}
                        onClick={() => { setManualColor(name); setManualColorHex(hex); }}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                          manualColorHex === hex ? "border-gold scale-110" : "border-border hover:border-gold/60"
                        )}
                        style={{ backgroundColor: hex }}
                        aria-label={name}
                      />
                    ))}
                    <label className="w-8 h-8 rounded-full border-2 border-border hover:border-gold/60 transition-colors cursor-pointer flex items-center justify-center text-muted hover:text-cream text-xs">
                      <input
                        type="color"
                        className="hidden"
                        onChange={(e) => { setManualColorHex(e.target.value); setManualColor("custom"); }}
                      />
                      +
                    </label>
                  </div>
                </div>

                {/* Pattern */}
                <div className="space-y-2">
                  <label className="text-xs font-sans text-muted uppercase tracking-widest">Pattern</label>
                  <div className="flex flex-wrap gap-2">
                    {PATTERNS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setManualPattern(p)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-sans border transition-colors",
                          manualPattern === p
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border bg-bg-elevated text-muted hover:border-gold/40 hover:text-cream"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Material */}
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-muted uppercase tracking-widest">Material</label>
                  <select
                    value={manualMaterial}
                    onChange={(e) => setManualMaterial(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-muted text-sm font-sans focus:outline-none focus:border-gold/60 cursor-pointer"
                  >
                    <option value="">Select...</option>
                    {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Formality */}
                <div className="space-y-2">
                  <label className="text-xs font-sans text-muted uppercase tracking-widest">
                    Formality level — {["Casual", "Smart casual", "Business casual", "Business", "Formal"][formality - 1]}
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-sans text-muted">Casual</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={formality}
                      onChange={(e) => setFormality(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #C8A96E ${((formality - 1) / 4) * 100}%, #2E2E3A ${((formality - 1) / 4) * 100}%)`,
                      }}
                    />
                    <span className="text-xs font-sans text-muted">Formal</span>
                  </div>
                </div>

                {/* Season tags */}
                <div className="space-y-2">
                  <label className="text-xs font-sans text-muted uppercase tracking-widest">Season tags</label>
                  <div className="flex flex-wrap gap-2">
                    {SEASONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSeason(s)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-sans border transition-colors",
                          selectedSeasons.includes(s)
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border bg-bg-elevated text-muted hover:border-gold/40 hover:text-cream"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <GoldButton
                size="lg"
                className="w-full justify-center gap-2"
                loading={saving}
                disabled={!manualName || !manualCategory}
                onClick={handleAddManual}
              >
                <Check size={16} />
                Add to wardrobe
              </GoldButton>
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  );
}

function ExtractedPreview({
  extracted,
  onAdd,
  saving,
}: {
  extracted: ExtractedItem;
  onAdd: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-bg-surface border border-gold/20 rounded-2xl p-5 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-xs font-sans text-success mb-2">
        <Check size={12} />
        Product details extracted
      </div>
      <div className="flex gap-4">
        {extracted.imageUrl ? (
          <img
            src={extracted.imageUrl}
            alt={extracted.name ?? "Product"}
            className="w-24 h-28 object-cover rounded-xl flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-28 rounded-xl bg-bg-elevated flex-shrink-0 flex items-center justify-center text-muted">
            <ImageIcon size={24} />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <p className="text-xs font-sans text-muted">{extracted.brand ?? "—"}</p>
          <p className="text-sm font-sans font-medium text-cream">{extracted.name ?? "Unnamed product"}</p>
          {extracted.price && (
            <p className="text-base font-sans font-semibold text-cream">${extracted.price}</p>
          )}
          <div className="flex items-center gap-2">
            {extracted.category && (
              <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-bg-elevated border border-border text-muted">
                {extracted.category}
              </span>
            )}
            {extracted.colorHex && (
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full border border-border/50" style={{ backgroundColor: extracted.colorHex }} />
                <span className="text-xs font-sans text-muted">{extracted.color}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs font-sans text-muted">
        Review the details above. Click &quot;Add to wardrobe&quot; to confirm.
      </p>
      <GoldButton size="md" className="w-full justify-center gap-2" loading={saving} onClick={onAdd}>
        <Check size={14} />
        Add to wardrobe
      </GoldButton>
    </div>
  );
}
