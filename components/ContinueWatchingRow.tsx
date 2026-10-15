"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWatchHistory, removeWatchHistory } from "@/lib/storage";
import { animeWatchHref, animeDetailHref } from "@/lib/anime-path";
import { streamingPosterUnoptimized } from "@/lib/image-url";

export function ContinueWatchingRow() {
  const history = useWatchHistory();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.75), behavior: "smooth" });
  };

  if (history.length === 0) return null;

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <h2 className="text-base font-semibold text-foreground tracking-tight sm:text-lg">
            Continue Watching
          </h2>
          <span className="text-xs text-muted font-normal">({history.length})</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/watchlist" className="text-xs font-medium text-muted transition-colors hover:text-foreground">
            See all →
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.1] bg-surface-2/60 text-xs text-muted transition-colors hover:border-white/[0.2] hover:text-foreground active:scale-95"
              aria-label="Previous items"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.1] bg-surface-2/60 text-xs text-muted transition-colors hover:border-white/[0.2] hover:text-foreground active:scale-95"
              aria-label="Next items"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Horizontally-scrollable card strip */}
      <div ref={scrollRef} className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-0 sm:px-0">
        {history.map((item) => {
          const watchHref = animeWatchHref(item.animeId, item.episodeNumber);
          const prevEp = item.episodeNumber > 1 ? item.episodeNumber - 1 : null;
          const nextEp =
            item.totalEpisodes && item.episodeNumber < item.totalEpisodes
              ? item.episodeNumber + 1
              : null;

          return (
            <div
              key={item.animeId}
              className="group relative flex w-[200px] shrink-0 flex-col rounded-xl border border-white/[0.07] bg-surface overflow-hidden transition-colors duration-200 hover:border-white/[0.16] sm:w-[220px]"
            >
              {/* Thumbnail */}
              <div className="relative aspect-[16/9] w-full bg-surface-2">
                {item.poster ? (
                  <Image
                    src={item.poster}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="220px"
                    unoptimized={streamingPosterUnoptimized(item.poster)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg className="h-8 w-8 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}

                {/* Dark bottom gradient */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Progress bar */}
                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.15]">
                  <div
                    className="h-full bg-accent"
                    style={{
                      width: item.totalEpisodes
                        ? `${Math.min(100, (item.episodeNumber / item.totalEpisodes) * 100)}%`
                        : "35%",
                    }}
                  />
                </div>

                {/* Episode label */}
                <span className="absolute bottom-2 left-2.5 text-[11px] font-semibold text-white drop-shadow">
                  Ep. {item.episodeNumber}
                </span>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    removeWatchHistory(item.animeId);
                  }}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/60 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                  aria-label="Remove from history"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Card body */}
              <div className="flex flex-col gap-2 p-2.5">
                {/* Title */}
                <Link
                  href={animeDetailHref(item.animeId)}
                  className="line-clamp-1 text-xs font-semibold text-foreground hover:text-white leading-snug"
                >
                  {item.title}
                </Link>

                {/* Action row: Prev / Resume / Next */}
                <div className="flex items-center gap-1.5">
                  {/* ← Prev episode */}
                  {prevEp && (
                    <Link
                      href={animeWatchHref(item.animeId, prevEp)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-surface-2 text-muted transition-colors hover:border-white/[0.2] hover:text-foreground active:scale-95"
                      title={`Episode ${prevEp}`}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Link>
                  )}

                  {/* Resume button */}
                  <Link
                    href={watchHref}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md bg-accent py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover active:scale-95"
                  >
                    <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Resume
                  </Link>

                  {/* Next episode → */}
                  {nextEp && (
                    <Link
                      href={animeWatchHref(item.animeId, nextEp)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.1] bg-surface-2 text-muted transition-colors hover:border-white/[0.2] hover:text-foreground active:scale-95"
                      title={`Episode ${nextEp}`}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
