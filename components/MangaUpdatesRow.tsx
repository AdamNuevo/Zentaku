"use client";

import Link from "next/link";
import { useRef } from "react";
import type { JikanMangaListEntry } from "@/lib/types";
import { pickAnimeImage } from "@/lib/image-url";
import { MediaCard } from "./MediaCard";

type Props = {
  items: JikanMangaListEntry[];
};

export function MangaUpdatesRow({ items }: Props) {
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
            Recent Manga Updates
          </h2>
          <span className="text-xs text-muted font-normal">({items.length})</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/browse?type=manga"
            className="text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Explore manga →
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
        {items.map((manga) => {
          const src = pickAnimeImage(manga.images as JikanMangaListEntry["images"]);
          const title = manga.title_english || manga.title;
          const badge = manga.chapters != null ? `${manga.chapters} CH` : "MANGA";

          return (
            <div key={manga.mal_id} className="w-[140px] shrink-0 sm:w-[160px] md:w-[170px]">
              <MediaCard
                href={`/manga/${manga.mal_id}`}
                image={src}
                title={title}
                badge={badge}
                type="Manga"
                subtitle={manga.genres?.[0]?.name}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
