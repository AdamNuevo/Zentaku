import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApiError } from "@/components/ApiError";
import { MediaCard } from "@/components/MediaCard";
import { MediaDetailSkeleton } from "@/components/skeletons";
import {
  getTVDetails,
  getTVSeasonEpisodes,
  getSimilarTV,
  tmdbImg,
  TMDBError,
} from "@/lib/tmdb";
import type { TMDBEpisode } from "@/lib/tmdb";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const show = await getTVDetails(Number(id));
    return { title: `${show.name} — Zentaku` };
  } catch {
    return { title: "TV Series — Zentaku" };
  }
}

async function TVDetailContent({ id }: { id: number }) {
  let show;
  try {
    show = await getTVDetails(id);
  } catch (err) {
    if (err instanceof TMDBError && err.status === 404) notFound();
    const message = err instanceof TMDBError ? err.message : "Unable to load TV show details.";
    const status = err instanceof TMDBError ? err.status : undefined;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ApiError message={message} status={status} />
      </div>
    );
  }

  const poster = tmdbImg(show.poster_path);
  const rating = show.vote_average ? show.vote_average.toFixed(1) : null;

  // Fetch S1 episodes (non-critical)
  let s1Episodes: TMDBEpisode[] = [];
  const firstSeason = show.seasons?.find((s) => s.season_number >= 1);
  if (firstSeason) {
    try {
      const data = await getTVSeasonEpisodes(id, firstSeason.season_number);
      s1Episodes = data.episodes || [];
    } catch { /* ignore */ }
  }

  // Similar shows (non-critical)
  let similar: typeof show[] = [];
  try {
    const simPage = await getSimilarTV(id);
    similar = simPage.results.slice(0, 6);
  } catch { /* ignore */ }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/tv" className="hover:text-foreground">TV Series</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1 max-w-[240px]">{show.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 lg:gap-10">
        {/* Poster */}
        <div className="space-y-4 md:col-span-4 lg:col-span-3">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/[0.08] bg-surface-2 shadow-sm">
            {poster ? (
              <Image
                src={poster}
                alt={show.name}
                fill
                priority
                loading="eager"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                No Poster Artwork
              </div>
            )}
          </div>

          {/* Specs */}
          <div className="rounded-lg border border-white/[0.06] bg-surface p-3.5 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted">Seasons</span>
              <span className="font-medium text-foreground">{show.number_of_seasons || "TBA"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted">Episodes</span>
              <span className="font-medium text-foreground">{show.number_of_episodes || "TBA"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted">First Aired</span>
              <span className="font-medium text-foreground">{show.first_air_date || "TBA"}</span>
            </div>
            {rating && (
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-muted">Rating</span>
                <span className="font-medium text-foreground">⭐ {rating}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-muted">Status</span>
              <span className={`font-medium ${show.status === "Ended" || show.status === "Canceled" ? "text-muted" : "text-emerald-400"}`}>
                {show.status || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6 md:col-span-8 lg:col-span-9">
          {show.tagline && (
            <p className="text-xs font-medium text-muted/80">{show.tagline}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {show.name}
          </h1>

          {/* Genres */}
          {show.genres && show.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {show.genres.map((g) => (
                <span
                  key={g.id}
                  className="rounded bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted border border-white/[0.05]"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Watch Button */}
          <div className="flex items-center gap-3 pt-1">
            <Link
              href={`/tv/${id}/watch?s=1&ep=1`}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Watch S1 E1</span>
            </Link>
          </div>

          {/* Overview */}
          <div className="space-y-2 border-t border-white/[0.06] pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Overview</h2>
            <p className="text-sm leading-relaxed text-muted/90 max-w-3xl">
              {show.overview || "No overview available."}
            </p>
          </div>

          {/* Seasons List */}
          {show.seasons && show.seasons.length > 0 && (
            <div className="space-y-2 border-t border-white/[0.06] pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Seasons</h2>
              <div className="flex flex-wrap gap-2">
                {show.seasons
                  .filter((s) => s.season_number >= 1)
                  .map((s) => (
                    <Link
                      key={s.id}
                      href={`/tv/${id}/watch?s=${s.season_number}&ep=1`}
                      className="rounded-md border border-white/[0.08] bg-surface px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
                    >
                      Season {s.season_number}
                      <span className="ml-1.5 text-muted/60">({s.episode_count} ep)</span>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* S1 Episodes */}
      {s1Episodes.length > 0 && (
        <section className="mt-12 border-t border-white/[0.06] pt-8">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Season {firstSeason?.season_number} Episodes
            </h2>
            <span className="text-xs text-muted">({s1Episodes.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 custom-scrollbar max-h-[500px] overflow-y-auto pr-1">
            {s1Episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/tv/${id}/watch?s=${ep.season_number}&ep=${ep.episode_number}`}
                className="group flex items-center gap-3 rounded-md border border-white/[0.06] bg-surface p-2.5 transition-colors hover:border-white/[0.18] hover:bg-surface-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-2 font-mono text-xs font-semibold text-muted group-hover:text-foreground">
                  {ep.episode_number}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-medium text-foreground transition-colors group-hover:text-white">
                    {ep.name || `Episode ${ep.episode_number}`}
                  </p>
                  <span className="text-[10px] text-muted">
                    {ep.runtime ? `${ep.runtime} min` : ""}
                  </span>
                </div>
                <span className="text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100">
                  ▶
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Similar Shows */}
      {similar.length > 0 && (
        <section className="mt-12 border-t border-white/[0.06] pt-8">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Similar Shows</h2>
            <span className="text-xs text-muted">({similar.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {similar.map((s) => (
              <MediaCard
                key={s.id}
                href={`/tv/${s.id}`}
                image={tmdbImg(s.poster_path)}
                title={s.name}
                badge={s.first_air_date?.slice(0, 4) || "TV"}
                type="TV Series"
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default async function TVDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

  return (
    <Suspense fallback={<MediaDetailSkeleton />}>
      <TVDetailContent id={numId} />
    </Suspense>
  );
}
