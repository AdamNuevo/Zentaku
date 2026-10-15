// MobileEpisodeToggle.tsx
// Client wrapper that shows a collapsible episode list drawer on mobile.
// On lg+ screens it renders nothing (the regular sidebar grid column handles it).

"use client";

import { useState } from "react";
import { EpisodeSidebar } from "./EpisodeSidebar";
import type { AnimeKaiEpisode } from "@/lib/animekai";

type Props = {
  animeId: string;
  episodes: AnimeKaiEpisode[];
  currentEp: number;
};

export function MobileEpisodeToggle({ animeId, episodes, currentEp }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-surface px-4 py-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
      >
        <span className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Episodes ({episodes.length})
        </span>
        <svg
          className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Drawer */}
      {open && (
        <div className="mt-2">
          <EpisodeSidebar animeId={animeId} episodes={episodes} currentEp={currentEp} />
        </div>
      )}
    </div>
  );
}
