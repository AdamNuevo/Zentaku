"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AnimeKaiListItem } from "@/lib/animekai";
import { animeDetailHref, animeWatchHref } from "@/lib/anime-path";
import { streamingPosterUnoptimized } from "@/lib/image-url";
import { toggleWatchlist, useWatchlist } from "@/lib/storage";
import { useRequireAuth } from "@/lib/require-auth";
import { useToast } from "@/lib/toast-context";

type HeroProps = {
  featuredList?: AnimeKaiListItem[] | null;
};

export function Hero({ featuredList }: HeroProps) {
  const pathname = usePathname();
  const requireAuth = useRequireAuth();
  const { showToast } = useToast();
  const [idx, setIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const watchlist = useWatchlist();

  const list = featuredList && featuredList.length > 0 ? featuredList : [];
  const featured = list[idx];
  const isSaved = featured ? watchlist.some((w) => w.id === featured.id) : false;

  useEffect(() => {
    setImgError(false);
  }, [idx]);

  useEffect(() => {
    if (list.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % list.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [list.length]);

  if (!featured) {
    return (
      <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-white/[0.08] bg-surface p-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">ZENTAKU</h1>
        <p className="mt-2 text-sm text-muted">A calm, modern anime discovery and manga platform.</p>
      </div>
    );
  }

  const posterImg = featured.image?.trim() ?? "";
  const bannerImg = featured.bannerImage?.trim();
  const title = featured.title;

  // Prefer high-res widescreen backdrop banner if available; fallback to poster
  const activeArtwork = imgError
    ? `/api/anime-image?title=${encodeURIComponent(title)}`
    : (bannerImg || posterImg);

  const hasBanner = Boolean(bannerImg && !imgError);

  const handleBookmark = () => {
    if (!requireAuth(pathname)) return;
    const nextState = toggleWatchlist({
      id: featured.id,
      type: "anime",
      title: featured.title,
      poster: posterImg,
      genre: "Anime",
    });

    showToast({
      title: nextState ? "Added to your watchlist." : "Removed from your watchlist.",
      description: nextState
        ? `"${featured.title}" has been saved to your library.`
        : `"${featured.title}" has been removed from your library.`,
    });
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-surface shadow-sm">
      {/* ── Mobile: full-bleed cinematic card ── */}
      <div className="relative md:hidden min-h-[460px] sm:min-h-[520px] flex flex-col justify-end">
        {/* Background artwork */}
        {activeArtwork && (
          <Image
            key={`mob-${activeArtwork}`}
            src={activeArtwork}
            alt={title}
            fill
            priority
            loading="eager"
            className="object-cover object-center"
            sizes="100vw"
            unoptimized={streamingPosterUnoptimized(activeArtwork)}
            onError={() => setImgError(true)}
          />
        )}
        {/* Dark scrim so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/60 to-transparent pointer-events-none" />

        {/* Content on top of scrim */}
        <div className="relative z-10 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/[0.12] px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted/80 backdrop-blur-sm">FEATURED</span>
            <span className="text-[10px] text-muted/60">·</span>
            <span className="text-[10px] font-medium text-muted/80">TV · Airing</span>
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight text-white drop-shadow">{title}</h1>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={animeWatchHref(featured.id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover shadow"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Watch Now
            </Link>
            <Link
              href={animeDetailHref(featured.id)}
              className="inline-flex items-center rounded-md border border-white/[0.2] bg-black/30 px-3.5 py-2 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white/[0.12]"
            >
              Details
            </Link>
            <button
              type="button"
              onClick={handleBookmark}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors backdrop-blur-sm ${
                isSaved
                  ? "border-accent/50 bg-accent/20 text-accent"
                  : "border-white/[0.2] bg-black/30 text-white/80 hover:bg-white/[0.12]"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>

          {/* Slide indicators */}
          {list.length > 1 && (
            <div className="flex items-center gap-1.5 pt-1">
              {list.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === idx ? "w-5 bg-white/90" : "w-1.5 bg-white/25 hover:bg-white/50"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop: two-column layout ── */}
      <div className="hidden md:grid md:grid-cols-12 min-h-[380px] lg:min-h-[420px]">
        
        {/* Left Column: Editorial Information */}
        <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 md:col-span-7 lg:col-span-6 bg-gradient-to-r from-surface via-surface/95 to-surface/40 md:to-transparent">
          <div className="space-y-4">
            {/* Header tags */}
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/[0.07] px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted">
                FEATURED
              </span>
              <span className="text-xs text-muted/60">·</span>
              <span className="text-xs font-medium text-muted">
                TV Series · Airing
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl drop-shadow-sm">
              {title}
            </h1>

            <p className="line-clamp-3 text-xs leading-relaxed text-muted sm:text-sm max-w-xl">
              Discover and follow the latest episodes in high definition with synchronized subtitles and multi-source streaming.
            </p>
          </div>

          {/* Action Row & Pagination Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <Link
                href={animeWatchHref(featured.id)}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover shadow-sm"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Now
              </Link>

              <Link
                href={animeDetailHref(featured.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] px-4 py-2 text-xs font-medium text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
              >
                Details
              </Link>

              <button
                type="button"
                onClick={handleBookmark}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  isSaved
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-white/[0.1] text-muted hover:bg-white/[0.04] hover:text-foreground"
                }`}
                title={isSaved ? "Remove from watchlist" : "Save to watchlist"}
              >
                <svg className="h-3.5 w-3.5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
            </div>

            {/* Slide indicators */}
            {list.length > 1 && (
              <div className="flex items-center gap-1.5">
                {list.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === idx ? "w-5 bg-white/80" : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Featured Artwork */}
        <div className="relative min-h-[260px] md:min-h-full md:col-span-5 lg:col-span-6 bg-surface-2 overflow-hidden flex items-center justify-center">
          {activeArtwork && (
            <>
              {/* If widescreen banner is present: full cover */}
              {hasBanner ? (
                <Image
                  key={activeArtwork}
                  src={activeArtwork}
                  alt={title}
                  fill
                  priority
                  loading="eager"
                  className="object-cover object-center transition-opacity duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={streamingPosterUnoptimized(activeArtwork)}
                  onError={() => setImgError(true)}
                />
              ) : (
                /* When vertical poster is used: ambient soft blurred backdrop + crisp centered foreground */
                <>
                  <Image
                    key={`bg-${activeArtwork}`}
                    src={activeArtwork}
                    alt=""
                    fill
                    aria-hidden
                    priority
                    className="object-cover object-center blur-2xl scale-125 opacity-40 pointer-events-none"
                    unoptimized={streamingPosterUnoptimized(activeArtwork)}
                  />
                  <div className="relative h-[85%] aspect-[2/3] max-w-[260px] overflow-hidden rounded-lg shadow-2xl border border-white/[0.1] z-10 transition-transform duration-300 hover:scale-[1.02]">
                    <Image
                      key={`fg-${activeArtwork}`}
                      src={activeArtwork}
                      alt={title}
                      fill
                      priority
                      loading="eager"
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 60vw, 260px"
                      unoptimized={streamingPosterUnoptimized(activeArtwork)}
                      onError={() => setImgError(true)}
                    />
                  </div>
                </>
              )}

              {/* Natural blending gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent md:hidden pointer-events-none z-10" />
              <div className="hidden md:block absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-surface to-transparent pointer-events-none z-10" />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            </>
          )}
        </div>

      </div>
    </section>
  );
}

