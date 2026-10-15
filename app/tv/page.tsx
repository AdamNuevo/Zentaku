import Link from "next/link";
import { Suspense } from "react";
import { ApiError } from "@/components/ApiError";
import { Skeleton } from "@/components/skeletons";
import { MediaCard } from "@/components/MediaCard";
import {
  getTrendingTV,
  getPopularTV,
  searchTV,
  tmdbImg,
  TV_GENRES,
  TMDBError,
} from "@/lib/tmdb";
import type { TMDBTVShow } from "@/lib/tmdb";

export const metadata = { title: "TV Series — Zentaku" };

type SearchParams = Promise<{ q?: string; sort?: string }>;

function genreLabel(ids?: number[]): string | undefined {
  if (!ids || ids.length === 0) return undefined;
  return TV_GENRES[ids[0]];
}

async function TVResults({ sp }: { sp: Awaited<SearchParams> }) {
  const q = (sp.q ?? "").trim();
  const isSearch = q.length > 0;
  const sort = sp.sort ?? "trending";

  let shows: TMDBTVShow[] = [];
  let title = "Trending TV Shows";

  try {
    if (isSearch) {
      const page = await searchTV(q);
      shows = page.results;
      title = `Results for "${q}"`;
    } else if (sort === "popular") {
      const page = await getPopularTV();
      shows = page.results;
      title = "Popular TV Shows";
    } else {
      const page = await getTrendingTV();
      shows = page.results;
    }
  } catch (err) {
    const message = err instanceof TMDBError ? err.message : "Failed to load TV shows.";
    const status = err instanceof TMDBError ? err.status : undefined;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ApiError message={message} status={status} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 border-b border-white/[0.06] pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {shows.length > 0
              ? `Found ${shows.length} TV shows`
              : "Discover the latest TV series"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Sort Tabs */}
          <div className="inline-flex flex-wrap rounded-lg border border-white/[0.08] bg-surface p-1 text-xs">
            <Link
              href="/tv"
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                sort === "trending" && !isSearch
                  ? "bg-white/[0.08] text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Trending
            </Link>
            <Link
              href="/tv?sort=popular"
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                sort === "popular" && !isSearch
                  ? "bg-white/[0.08] text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Popular
            </Link>
          </div>

          {/* Search */}
          <form action="/tv" className="relative">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search TV shows..."
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

      {/* Empty state */}
      {shows.length === 0 && (
        <div className="mx-auto my-12 max-w-md rounded-xl border border-white/[0.08] bg-surface p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground">No TV shows found</h3>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Try a different search term or browse trending shows.
          </p>
        </div>
      )}

      {/* Grid */}
      {shows.length > 0 && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shows.map((s, index) => (
            <MediaCard
              key={s.id}
              href={`/tv/${s.id}`}
              image={tmdbImg(s.poster_path)}
              title={s.name}
              badge={s.first_air_date?.slice(0, 4) || "TV"}
              type="TV Series"
              subtitle={genreLabel(s.genre_ids)}
              priority={index < 6}
              loading={index < 6 ? "eager" : "lazy"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TVFallback() {
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

export default function TVPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<TVFallback />}>
      <TVWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function TVWrapper({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return <TVResults sp={sp} />;
}
