import Link from "next/link";
import { Suspense } from "react";
import { ApiError } from "@/components/ApiError";
import { Skeleton } from "@/components/skeletons";
import { MediaCard } from "@/components/MediaCard";
import { pickAnimeImage } from "@/lib/image-url";
import {
  getTopManga,
  searchManga,
  getTopManhwa,
  searchManhwa,
  getTopManhua,
  searchManhua,
  JikanError,
} from "@/lib/jikan";
import {
  AnimeKaiError,
  animeKaiPopular,
  animeKaiSearch,
  animeKaiTopAiring,
} from "@/lib/animekai";
import { animeDetailHref } from "@/lib/anime-path";
import { dedupeById, dedupeByMalId } from "@/lib/lists";
import type { AnimeKaiListItem } from "@/lib/animekai";
import type { JikanMangaListEntry } from "@/lib/types";

type SearchParams = Promise<{
  q?: string;
  type?: string;
  sort?: string;
}>;

export type BrowseCategory = "anime" | "manga" | "manhwa" | "manhua" | "both";

type BrowseData = {
  type: BrowseCategory;
  q: string;
  title: string;
  isPopularView: boolean;
  animeList: AnimeKaiListItem[] | null;
  mangaList: JikanMangaListEntry[] | null;
};

function apiError(err: unknown) {
  if (err instanceof AnimeKaiError || err instanceof JikanError) {
    return { message: err.message, status: err.status };
  }
  return { message: "Failed to load catalog data.", status: undefined as number | undefined };
}

async function loadBrowseData(sp: Awaited<SearchParams>): Promise<BrowseData> {
  const popular = sp.sort === "popular";
  let type: BrowseCategory = "anime";

  if (sp.type === "manga") type = "manga";
  else if (sp.type === "manhwa") type = "manhwa";
  else if (sp.type === "manhua") type = "manhua";
  else if (sp.type === "anime") type = "anime";
  else if (sp.type === "both" || popular || !sp.type) {
    type = "both";
  }

  const q = (sp.q ?? "").trim();

  let animeList: AnimeKaiListItem[] | null = null;
  let mangaList: JikanMangaListEntry[] | null = null;

  if (type === "anime" || type === "both") {
    if (q) {
      const page = await animeKaiSearch(q);
      animeList = page.results;
    } else if (popular) {
      animeList = await animeKaiPopular(1, 48);
    } else {
      animeList = await animeKaiTopAiring(1, 48);
    }
  }

  if (type === "manga" || type === "both") {
    if (q) mangaList = await searchManga(q, 24);
    else mangaList = await getTopManga(24);
  } else if (type === "manhwa") {
    if (q) mangaList = await searchManhwa(q, 24);
    else mangaList = await getTopManhwa(24);
  } else if (type === "manhua") {
    if (q) mangaList = await searchManhua(q, 24);
    else mangaList = await getTopManhua(24);
  }

  const title =
    q !== ""
      ? `Results for “${q}”`
      : popular
        ? "Popular Catalog"
        : type === "anime"
          ? "Airing Anime"
          : type === "manga"
            ? "Top Manga"
            : type === "manhwa"
              ? "Top Manhwa (Korean Webtoons)"
              : type === "manhua"
                ? "Top Manhua (Chinese Comics)"
                : "Browse Catalog";

  return { type, q, title, isPopularView: popular, animeList, mangaList };
}

async function BrowseResults({ sp }: { sp: Awaited<SearchParams> }) {
  let data: BrowseData;
  try {
    data = await loadBrowseData(sp);
  } catch (err) {
    const { message, status } = apiError(err);
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ApiError message={message} status={status} />
      </div>
    );
  }

  const { type, q, title, animeList, mangaList } = data;
  const animeDeduped = animeList ? dedupeById(animeList) : [];
  const mangaDeduped = mangaList ? dedupeByMalId(mangaList) : [];

  const totalResults =
    (type === "anime" || type === "both" ? animeDeduped.length : 0) +
    (type === "manga" || type === "manhwa" || type === "manhua" || type === "both" ? mangaDeduped.length : 0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      
      {/* Top Header & Search Control */}
      <div className="mb-6 flex flex-col gap-4 border-b border-white/[0.06] pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {totalResults > 0
              ? `Found ${totalResults} ${totalResults === 1 ? "entry" : "entries"}`
              : "Discover titles across streaming anime, manga, manhwa, and manhua"}
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Type Filter Tabs */}
          <div className="inline-flex flex-wrap rounded-lg border border-white/[0.08] bg-surface p-1 text-xs">
            <Link
              href={`/browse?type=both${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                type === "both"
                  ? "bg-white/[0.08] text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              All
            </Link>
            <Link
              href={`/browse?type=anime${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                type === "anime"
                  ? "bg-white/[0.08] text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Anime
            </Link>
            <Link
              href={`/browse?type=manga${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                type === "manga"
                  ? "bg-white/[0.08] text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Manga
            </Link>
            <Link
              href={`/browse?type=manhwa${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                type === "manhwa"
                  ? "bg-white/[0.08] text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Manhwa
            </Link>
            <Link
              href={`/browse?type=manhua${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                type === "manhua"
                  ? "bg-white/[0.08] text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Manhua
            </Link>
          </div>

          {/* Search Input */}
          <form action="/browse" className="relative">
            <input type="hidden" name="type" value={type} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search catalog..."
              className="w-full rounded-lg border border-white/[0.08] bg-surface py-1.5 pl-3 pr-8 text-xs text-foreground placeholder:text-muted/60 outline-none focus:border-white/[0.2] sm:w-60"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted/60 hover:text-foreground"
              aria-label="Search"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Empty State */}
      {totalResults === 0 && (
        <div className="mx-auto my-12 max-w-md rounded-xl border border-white/[0.08] bg-surface p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground">No matches found</h3>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            We couldn&apos;t find any titles matching &ldquo;{q}&rdquo;. Try checking the spelling, using fewer keywords, or browse popular releases.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/browse?type=anime&sort=popular"
              className="rounded-md bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.14]"
            >
              Popular Anime
            </Link>
            <Link
              href="/browse?type=manga"
              className="rounded-md border border-white/[0.1] px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
            >
              Top Manga
            </Link>
          </div>
        </div>
      )}

      {/* Anime Results Grid */}
      {(type === "anime" || type === "both") && animeDeduped.length > 0 && (
        <div className="mb-10 space-y-3">
          {type === "both" && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
                Anime Series
              </h2>
              <span className="text-xs text-muted/60">({animeDeduped.length})</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {animeDeduped.map((a, index) => (
              <MediaCard
                key={a.id}
                href={animeDetailHref(a.id)}
                image={a.image}
                title={a.title}
                badge="TV"
                type="Anime"
                priority={index < 6}
                loading={index < 6 ? "eager" : "lazy"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Manga / Manhwa / Manhua Results Grid */}
      {(type === "manga" || type === "manhwa" || type === "manhua" || type === "both") && mangaDeduped.length > 0 && (
        <div className="space-y-3">
          {type === "both" && (
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
                Manga & Webtoons
              </h2>
              <span className="text-xs text-muted/60">({mangaDeduped.length})</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {mangaDeduped.map((m, index) => {
              const src = pickAnimeImage(m.images);
              const name = m.title_english || m.title;
              const typeLabel =
                type === "manhwa" ? "Manhwa" : type === "manhua" ? "Manhua" : "Manga";
              const badge =
                type === "manhwa"
                  ? "MANHWA"
                  : type === "manhua"
                    ? "MANHUA"
                    : m.chapters != null
                      ? `${m.chapters} CH`
                      : "MANGA";
              const isAboveFold = type !== "both" && index < 6;
              return (
                <MediaCard
                  key={m.mal_id}
                  href={`/manga/${m.mal_id}`}
                  image={src}
                  title={name}
                  badge={badge}
                  type={typeLabel}
                  subtitle={m.genres?.[0]?.name}
                  priority={isAboveFold}
                  loading={isAboveFold ? "eager" : "lazy"}
                />
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

function BrowseFallback() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-60" />
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowseWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function BrowseWrapper({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return <BrowseResults sp={sp} />;
}
