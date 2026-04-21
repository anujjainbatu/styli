"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, X, ImageIcon, AlertCircle, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldButton from "@/components/ui/GoldButton";
import { trackEvent } from "@/lib/posthog";

const MAX_FILES = 5;
const MIN_FILES = 1;
const MAX_SIZE_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

type FileEntry = {
  file: File;
  preview: string;
};

export default function ScanUploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const valid: FileEntry[] = [];
    const errors: string[] = [];

    for (const f of arr) {
      if (!ACCEPTED.includes(f.type)) {
        errors.push(`${f.name}: unsupported format (JPG, PNG, WEBP only)`);
        continue;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        errors.push(`${f.name}: exceeds ${MAX_SIZE_MB} MB limit`);
        continue;
      }
      if (files.length + valid.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} photos allowed`);
        break;
      }
      valid.push({ file: f, preview: URL.createObjectURL(f) });
    }

    if (errors.length > 0) setError(errors[0]);
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES));
  }, [files.length]);

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
    setError(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleAnalyze = async () => {
    if (files.length < MIN_FILES || !consentGiven) return;
    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      files.forEach((entry) => form.append("images", entry.file));
      form.append("consentGivenAt", new Date().toISOString());

      const res = await fetch("/api/scan/upload", { method: "POST", body: form });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(msg ?? "Upload failed");
      }

      trackEvent("scan_upload_completed", { file_count: files.length });
      router.push("/scan/confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      trackEvent("intake_fallback", { reason: "upload_error", fallback_to: "upload" });
    } finally {
      setUploading(false);
    }
  };

  const canAnalyze = files.length >= MIN_FILES && consentGiven && !uploading;

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border sticky top-0 bg-bg-base/90 backdrop-blur-md z-10">
        <Link href="/intake" className="text-muted hover:text-cream text-sm font-sans transition-colors">
          ← Choose method
        </Link>
        <span className="font-display text-base font-medium text-cream">Upload photos</span>
        <div className="w-24" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Instructions */}
        <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-display text-xl font-medium text-cream">Photo guidelines</h2>
          <ul className="space-y-1.5 text-sm font-sans text-muted">
            <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✦</span> Upload 1–5 full-body or portrait photos</li>
            <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✦</span> Good lighting, neutral background if possible</li>
            <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✦</span> Fitted clothing gives the most accurate body analysis</li>
            <li className="flex items-start gap-2"><span className="text-gold mt-0.5">✦</span> JPG, PNG, or WEBP — max 10 MB each</li>
          </ul>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => files.length < MAX_FILES && inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer",
            dragging ? "border-gold bg-gold/5" : "border-border hover:border-gold/50 hover:bg-bg-elevated",
            files.length >= MAX_FILES && "pointer-events-none opacity-60"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center text-muted">
              <Upload size={20} />
            </div>
            <div>
              <p className="font-sans font-medium text-cream text-sm">
                {dragging ? "Drop photos here" : "Drop photos here or click to browse"}
              </p>
              <p className="font-sans text-xs text-muted mt-1">
                {files.length}/{MAX_FILES} photos selected
              </p>
            </div>
          </div>
        </div>

        {/* Previews */}
        {files.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {files.map((entry, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-bg-base/80 backdrop-blur-sm flex items-center justify-center text-muted hover:text-cream opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {files.length < MAX_FILES && (
              <button
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-gold/50 flex items-center justify-center text-muted hover:text-gold transition-colors"
              >
                <ImageIcon size={18} />
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* BIPA consent */}
        <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-gold mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-sans font-medium text-cream text-sm mb-1">Privacy & data use</p>
              <p className="text-xs font-sans text-muted leading-relaxed">
                Your photos are uploaded to analyse body proportions, face shape, and skin tone. Images are retained for up to 7 days for quality checks, then permanently deleted. Derived attributes (body shape, face shape, color season) are encrypted at rest and deletable at any time.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="w-4 h-4 accent-gold cursor-pointer"
            />
            <span className="text-sm font-sans text-muted">
              I consent to biometric analysis of my uploaded photos (BIPA-compliant)
            </span>
          </label>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pb-8">
          <GoldButton
            size="lg"
            className="w-full justify-center gap-2"
            disabled={!canAnalyze}
            loading={uploading}
            onClick={handleAnalyze}
          >
            <Check size={16} />
            {uploading ? "Analysing your photos…" : "Analyse photos"}
          </GoldButton>
          <p className="text-center text-xs font-sans text-muted/60">
            You'll review and confirm results on the next screen
          </p>
        </div>
      </div>
    </div>
  );
}
