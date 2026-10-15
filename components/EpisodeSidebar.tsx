"use client";

import Link from "next/link";
import { useState } from "react";
import type { AnimeKaiEpisode } from "@/lib/animekai";
import { animeWatchHref } from "@/lib/anime-path";

type Props = {
  animeId: string;
  episodes: AnimeKaiEpisode[];
  currentEp: number;
};

export function EpisodeSidebar({ animeId, episodes, currentEp }: Props) {
  const [filter, setFilter] = useState("");

  const filtered = episodes.filter((ep) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      String(ep.number).includes(q) ||
      (ep.title && ep.title.toLowerCase().includes(q))
    );
  });

  return (
    <aside className="rounded-xl border border-white/[0.08] bg-surface overflow-hidden">
      <div className="border-b border-white/[0.06] p-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Episodes
          </h3>
          <span className="text-[11px] text-muted/70">
            {episodes.length} total
          </span>
        </div>

        {episodes.length > 12 && (
          <div className="mt-2.5">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter episode..."
              className="w-full rounded-md border border-white/[0.08] bg-surface-2 px-2.5 py-1 text-xs text-foreground placeholder:text-muted/50 outline-none focus:border-white/[0.2]"
            />
          </div>
        )}
      </div>

      <ol className="custom-scrollbar max-h-[280px] sm:max-h-[400px] lg:max-h-[560px] space-y-1 overflow-y-auto p-2">
        {filtered.map((ep) => {
          const num = ep.number;
          const active = num === currentEp;
          return (
            <li key={`${animeId}-ep-${ep.id}`}>
              <Link
                href={animeWatchHref(animeId, num)}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors ${
                  active
                    ? "bg-accent font-semibold text-white"
                    : "text-muted hover:bg-white/[0.04] hover:text-foreground"
                }`}
              >
                <span className={`w-6 font-mono text-[11px] tabular-nums ${active ? "text-white" : "text-muted/60"}`}>
                  {String(num).padStart(2, "0")}
                </span>
                <span className="line-clamp-1 flex-1">
                  {ep.title && ep.title !== `Episode ${num}` ? ep.title : `Episode ${num}`}
                </span>
                {active && (
                  <span className="text-[10px] uppercase tracking-wider text-white/80">
                    Playing
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="py-4 text-center text-xs text-muted">
            No episode matches &ldquo;{filter}&rdquo;
          </li>
        )}
      </ol>
    </aside>
  );
}
