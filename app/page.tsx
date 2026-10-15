import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { TrendingPanels } from "@/components/TrendingPanels";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { TMDBCarousel } from "@/components/TMDBCarousel";
import { MangaUpdatesRow } from "@/components/MangaUpdatesRow";
import { ContinueWatchingRow } from "@/components/ContinueWatchingRow";
import {
  HeroSkeleton,
  TrendingPanelSkeleton,
  CardRowSkeleton,
  MangaCardSkeleton,
} from "@/components/skeletons";
import { getTopManga, getRecentMangaUpdates } from "@/lib/jikan";
import {
  animeKaiRecent,
  animeKaiTopAiring,
} from "@/lib/animekai";
import { enrichHeroItems } from "@/lib/kitsu";
import { getTrendingMovies, getTrendingTV, tmdbImg, MOVIE_GENRES, TV_GENRES } from "@/lib/tmdb";
import { dedupeById, dedupeByMalId } from "@/lib/lists";
import type { AnimeKaiListItem } from "@/lib/animekai";
import type { JikanMangaListEntry } from "@/lib/types";

async function HomeData() {
  let topAiring: AnimeKaiListItem[] = [];
  let topManga: JikanMangaListEntry[] = [];
  let mangaRow: JikanMangaListEntry[] = [];
  let recentAnime: AnimeKaiListItem[] = [];
  let trendingMovieItems: { id: number; title: string; poster: string; year?: string; genre?: string }[] = [];
  let trendingTVItems: { id: number; title: string; poster: string; year?: string; genre?: string }[] = [];

  const results = await Promise.allSettled([
    animeKaiTopAiring(1, 14),
    getTopManga(8),
    getRecentMangaUpdates(16),
    animeKaiRecent(1, 14),
    getTrendingMovies(),
    getTrendingTV(),
  ]);

  if (results[0].status === "fulfilled") topAiring = results[0].value;
  if (results[1].status === "fulfilled") topManga = results[1].value;
  if (results[2].status === "fulfilled") mangaRow = results[2].value;
  if (results[3].status === "fulfilled") recentAnime = results[3].value;
  if (results[4].status === "fulfilled") {
    trendingMovieItems = results[4].value.results.slice(0, 14).map((m) => ({
      id: m.id,
      title: m.title,
      poster: tmdbImg(m.poster_path),
      year: m.release_date?.slice(0, 4),
      genre: m.genre_ids?.[0] ? MOVIE_GENRES[m.genre_ids[0]] : undefined,
    }));
  }
  if (results[5].status === "fulfilled") {
    trendingTVItems = results[5].value.results.slice(0, 14).map((s) => ({
      id: s.id,
      title: s.name,
      poster: tmdbImg(s.poster_path),
      year: s.first_air_date?.slice(0, 4),
      genre: s.genre_ids?.[0] ? TV_GENRES[s.genre_ids[0]] : undefined,
    }));
  }

  const topAiringU = dedupeById(topAiring);
  const topMangaU = dedupeByMalId(topManga);
  const mangaRowU = dedupeByMalId(mangaRow);
  const recentAnimeU = dedupeById(recentAnime);

  const heroFeaturedList = await enrichHeroItems(
    (topAiringU.length ? topAiringU : recentAnimeU).slice(0, 5)
  );
  const featuredCarousel = recentAnimeU.length ? recentAnimeU : topAiringU;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        
        {/* Main Editorial Content Column */}
        <div className="flex flex-col gap-10 lg:col-span-8 xl:col-span-9">
          <Hero featuredList={heroFeaturedList} />
          <ContinueWatchingRow />
          <FeaturedCarousel items={featuredCarousel} title="Trending Anime" viewAllHref="/browse?type=anime&sort=popular" />
          {trendingMovieItems.length > 0 && (
            <TMDBCarousel items={trendingMovieItems} title="Trending Movies" viewAllHref="/movies" type="movie" />
          )}
          {trendingTVItems.length > 0 && (
            <TMDBCarousel items={trendingTVItems} title="Trending TV Shows" viewAllHref="/tv" type="tv" />
          )}
          <MangaUpdatesRow items={mangaRowU} />

          {/* Rankings visible on mobile (after carousels) */}
          <div className="lg:hidden">
            <TrendingPanels anime={topAiringU} manga={topMangaU} />
          </div>
        </div>

        {/* Right Rankings Sidebar – desktop only */}
        <div className="hidden lg:flex flex-col gap-6 lg:col-span-4 xl:col-span-3">
          <TrendingPanels anime={topAiringU} manga={topMangaU} />
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <div className="flex flex-col gap-10 lg:col-span-8 xl:col-span-9">
              <HeroSkeleton />
              <CardRowSkeleton />
              <CardRowSkeleton />
              <CardRowSkeleton />
              <MangaCardSkeleton />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-4 xl:col-span-3">
              <TrendingPanelSkeleton />
              <TrendingPanelSkeleton />
            </div>
          </div>
        </div>
      }
    >
      <HomeData />
    </Suspense>
  );
}
