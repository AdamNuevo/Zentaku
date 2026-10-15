"use client";

import { useState, useEffect } from "react";
import {
  AVATAR_PRESETS,
  getDicebearPixelUrl,
  type AvatarCategory,
  type AvatarPreset,
} from "@/lib/avatar";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onSave: (avatarUrl: string | null) => Promise<void> | void;
  userName?: string;
};

const CATEGORIES: { id: AvatarCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "anime", label: "Anime" },
  { id: "cyber", label: "Cyber" },
  { id: "retro", label: "Retro" },
  { id: "creatures", label: "Creatures" },
];

export function AvatarSelectorModal({
  isOpen,
  onClose,
  currentAvatar,
  onSave,
  userName = "User",
}: Props) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentAvatar);
  const [category, setCategory] = useState<AvatarCategory>("all");
  const [customSeed, setCustomSeed] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedUrl(currentAvatar);
    setCustomSeed("");
  }, [currentAvatar, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredPresets =
    category === "all"
      ? AVATAR_PRESETS
      : AVATAR_PRESETS.filter((p) => p.category === category);

  const handleSelectPreset = (preset: AvatarPreset) => {
    setSelectedUrl(getDicebearPixelUrl(preset.seed));
    setCustomSeed("");
  };

  const handleCustomSeedChange = (val: string) => {
    setCustomSeed(val);
    if (val.trim()) {
      setSelectedUrl(getDicebearPixelUrl(val.trim()));
    } else {
      setSelectedUrl(currentAvatar);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedUrl);
      onClose();
    } catch (err) {
      console.error("Failed to save avatar", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setSaving(true);
    try {
      await onSave(null);
      onClose();
    } catch (err) {
      console.error("Failed to remove avatar", err);
    } finally {
      setSaving(false);
    }
  };

  const initialLetter = (userName || "U")[0].toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div className="relative flex max-h-[88vh] w-full max-w-xl flex-col rounded-xl border border-white/[0.1] bg-[#111418] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-surface/60">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Select Avatar</h2>
            <p className="text-xs text-muted">Choose a pixel avatar for your profile</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-white/[0.06] hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active Preview */}
          <div className="flex items-center gap-4 rounded-lg border border-white/[0.07] bg-surface-2/50 p-3.5">
            <div className="relative flex-shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.15] bg-[#0d0f12] overflow-hidden">
                {selectedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedUrl}
                    alt="Preview"
                    className="h-full w-full object-cover [image-rendering:pixelated]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent text-lg font-bold text-white">
                    {initialLetter}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">Preview</p>
              <p className="text-[11px] text-muted truncate">
                {selectedUrl ? "Pixel avatar selected" : "Default initial avatar"}
              </p>
            </div>
            {selectedUrl && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUrl(null);
                  setCustomSeed("");
                }}
                className="text-xs text-muted hover:text-rose-400 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  category === cat.id
                    ? "bg-white/[0.12] text-white"
                    : "text-muted hover:bg-white/[0.04] hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid of Avatars */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {filteredPresets.map((preset) => {
              const url = getDicebearPixelUrl(preset.seed);
              const isSelected = selectedUrl === url;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-all ${
                    isSelected
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-white/[0.06] bg-surface hover:border-white/[0.15] hover:bg-surface-2"
                  }`}
                >
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-[#0a0c0e]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={preset.name}
                      loading="lazy"
                      className="h-full w-full object-cover [image-rendering:pixelated] transition-transform duration-150 group-hover:scale-105"
                    />
                  </div>
                  <span className="line-clamp-1 text-[10px] text-muted group-hover:text-foreground">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Seed Input */}
          <div className="border-t border-white/[0.06] pt-4">
            <label className="block text-xs font-medium text-muted mb-1.5">
              Or generate by keyword:
            </label>
            <input
              type="text"
              placeholder="e.g. your username or favorite character"
              value={customSeed}
              onChange={(e) => handleCustomSeedChange(e.target.value)}
              className="w-full rounded-md border border-white/[0.08] bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:border-white/[0.2] focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-3 bg-surface/40">
          <button
            type="button"
            onClick={handleRemoveAvatar}
            disabled={saving || !currentAvatar}
            className="text-xs text-muted hover:text-rose-400 disabled:opacity-40 transition-colors"
          >
            Remove avatar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-white/[0.1] px-3.5 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
