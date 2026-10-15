"use client";

import Link from "next/link";
import { useRef } from "react";
import type { AnimeKaiListItem } from "@/lib/animekai";
import { animeDetailHref } from "@/lib/anime-path";
import { MediaCard } from "./MediaCard";

type Props = {
  items: AnimeKaiListItem[];
  title?: string;
  viewAllHref?: string;
};

export function FeaturedCarousel({
  items,
  title = "Trending Releases",
  viewAllHref = "/browse?type=anime",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.75), behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {title}
          </h2>
          <span className="text-xs text-muted font-normal">({items.length})</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Browse all →
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

      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-2 sm:-mx-0 sm:px-0"
      >
        {items.map((anime, idx) => (
          <div key={anime.id} className="w-[140px] shrink-0 sm:w-[160px] md:w-[170px]">
            <MediaCard
              href={animeDetailHref(anime.id)}
              image={anime.image}
              title={anime.title}
              badge="TV"
              type="Anime"
              priority={idx < 4}
              loading={idx < 4 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
