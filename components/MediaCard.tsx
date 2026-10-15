"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { streamingPosterUnoptimized, malImageShouldSkipOptimization } from "@/lib/image-url";

export type MediaCardProps = {
  href: string;
  image?: string | null;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  type?: string | null;
  status?: string | null;
  priority?: boolean;
  loading?: "eager" | "lazy";
};

export function MediaCard({
  href,
  image,
  title,
  subtitle,
  badge,
  type,
  status,
  priority = false,
  loading,
}: MediaCardProps) {
  const initialSrc = image?.trim() || "";
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(!initialSrc);

  const handleError = () => {
    // If original source failed, try dynamic fallback via anime-image route
    if (currentSrc && !currentSrc.startsWith("/api/anime-image")) {
      setCurrentSrc(`/api/anime-image?title=${encodeURIComponent(title)}`);
    } else {
      setHasError(true);
    }
  };

  const isMal = currentSrc.includes("myanimelist") || currentSrc.includes("mangadex");
  const skipOptimization = isMal
    ? malImageShouldSkipOptimization(currentSrc)
    : streamingPosterUnoptimized(currentSrc);

  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="block overflow-hidden rounded-lg border border-white/[0.07] bg-surface transition-colors duration-200 hover:border-white/[0.18]">
        {/* 2:3 Aspect ratio container */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-2">
          {!hasError && currentSrc ? (
            <Image
              key={currentSrc}
              src={currentSrc}
              alt={title}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              priority={priority}
              loading={loading ?? (priority ? "eager" : undefined)}
              unoptimized={skipOptimization}
              onError={handleError}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-surface-2 to-surface p-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-muted mb-2">
                <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-foreground/80 line-clamp-2 px-1">
                {title}
              </span>
            </div>
          )}

          {/* Natural subtle gradient vignette at bottom to ground text/badges */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0d0f12]/80 to-transparent" />

          {/* Top corner status/badge */}
          {badge && (
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium tracking-tight bg-surface/90 text-foreground border border-white/[0.08]">
                {badge}
              </span>
            </div>
          )}

          {/* Subtle play indicator on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/90 text-white shadow-md transition-transform duration-200 group-hover:scale-105">
              <svg className="h-4 w-4 fill-current translate-x-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
        </div>
      </Link>

      {/* Info beneath poster */}
      <div className="mt-2.5 flex flex-col gap-0.5">
        <Link href={href} className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors hover:text-white">
          {title}
        </Link>
        
        {(subtitle || type || status) && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            {type && <span>{type}</span>}
            {type && (status || subtitle) && <span className="opacity-40">·</span>}
            {status && <span className={status.toLowerCase() === "completed" ? "text-emerald-400" : ""}>{status}</span>}
            {!status && subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
