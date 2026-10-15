import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApiError } from "@/components/ApiError";
import { ZoryvaPlayer } from "@/components/ZoryvaPlayer";
import {
  getTVDetails,
  getTVSeasonEpisodes,
  tmdbImg,
  TMDBError,
} from "@/lib/tmdb";
import type { TMDBEpisode } from "@/lib/tmdb";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string; ep?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  try {
    const show = await getTVDetails(Number(id));
    const label = sp.s && sp.ep ? ` S${sp.s} E${sp.ep}` : "";
    return { title: `Watch ${show.name}${label} — Zentaku` };
  } catch {
    return { title: "Watch TV — Zentaku" };
  }
}

async function TVWatchContent({ id, season, episode }: { id: number; season: number; episode: number }) {
  let show;
  try {
    show = await getTVDetails(id);
  } catch (err) {
    if (err instanceof TMDBError && err.status === 404) notFound();
    const message = err instanceof TMDBError ? err.message : "Unable to load TV show.";
    const status = err instanceof TMDBError ? err.status : undefined;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ApiError message={message} status={status} />
      </div>
    );
  }

  // Fetch episode list for current season
  let episodes: TMDBEpisode[] = [];
  try {
    const data = await getTVSeasonEpisodes(id, season);
    episodes = data.episodes || [];
  } catch { /* ignore */ }

  const currentEp = episodes.find((e) => e.episode_number === episode);
  const prevEp = episodes.find((e) => e.episode_number === episode - 1);
  const nextEp = episodes.find((e) => e.episode_number === episode + 1);

  // Available seasons for selector
  const seasons = (show.seasons || []).filter((s) => s.season_number >= 1);

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/tv" className="hover:text-foreground">TV Series</Link>
        <span>/</span>
        <Link href={`/tv/${id}`} className="hover:text-foreground line-clamp-1 max-w-[180px]">
          {show.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">S{season} E{episode}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Main player column */}
        <div className="space-y-4 lg:col-span-8 xl:col-span-9">
          <ZoryvaPlayer type="tv" id={id} season={season} episode={episode} />

          {/* Episode Nav Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-surface p-3 text-xs">
            <div className="min-w-0">
              <span className="font-semibold text-foreground">
                S{season} E{episode}
                {currentEp?.name && currentEp.name !== `Episode ${episode}` ? ` · ${currentEp.name}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {prevEp ? (
                <Link
                  href={`/tv/${id}/watch?s=${season}&ep=${prevEp.episode_number}`}
                  className="rounded border border-white/[0.1] bg-surface-2 px-3 py-1.5 font-medium text-foreground transition-colors hover:border-white/[0.2]"
                >
                  ← Prev
                </Link>
              ) : (
                <span className="rounded border border-white/[0.04] bg-surface-2/40 px-3 py-1.5 text-muted/40 cursor-not-allowed">
                  ← Prev
                </span>
              )}
              {nextEp ? (
                <Link
                  href={`/tv/${id}/watch?s=${season}&ep=${nextEp.episode_number}`}
                  className="rounded bg-accent px-3 py-1.5 font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Next →
                </Link>
              ) : (
                <span className="rounded border border-white/[0.04] bg-surface-2/40 px-3 py-1.5 text-muted/40 cursor-not-allowed">
                  Next →
                </span>
              )}
            </div>
          </div>

          {/* Show Info */}
          <div className="rounded-lg border border-white/[0.06] bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {show.name}
              </h1>
              <Link
                href={`/tv/${id}`}
                className="text-xs font-medium text-muted transition-colors hover:text-foreground"
              >
                View full overview →
              </Link>
            </div>
            {currentEp?.overview && (
              <p className="text-xs leading-relaxed text-muted line-clamp-3">
                {currentEp.overview}
              </p>
            )}
          </div>
        </div>

        {/* Episode sidebar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="rounded-xl border border-white/[0.08] bg-surface">
            {/* Season selector */}
            <div className="border-b border-white/[0.06] p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted font-medium">Season:</span>
                <div className="flex flex-wrap gap-1">
                  {seasons.map((s) => (
                    <Link
                      key={s.id}
                      href={`/tv/${id}/watch?s=${s.season_number}&ep=1`}
                      className={`rounded px-2 py-1 font-medium transition-colors ${
                        s.season_number === season
                          ? "bg-accent text-white"
                          : "bg-surface-2 text-muted hover:text-foreground"
                      }`}
                    >
                      {s.season_number}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Episode list */}
            <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-2">
              <div className="space-y-1">
                {episodes.map((ep) => {
                  const isActive = ep.episode_number === episode;
                  return (
                    <Link
                      key={ep.id}
                      href={`/tv/${id}/watch?s=${season}&ep=${ep.episode_number}`}
                      className={`group flex items-center gap-2.5 rounded-md p-2 text-xs transition-colors ${
                        isActive
                          ? "bg-accent/10 border border-accent/30 text-foreground"
                          : "hover:bg-surface-2 text-muted hover:text-foreground"
                      }`}
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded font-mono text-xs font-semibold ${
                        isActive ? "bg-accent text-white" : "bg-surface-2 text-muted"
                      }`}>
                        {ep.episode_number}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-medium">
                          {ep.name || `Episode ${ep.episode_number}`}
                        </p>
                        {ep.runtime && (
                          <span className="text-[10px] text-muted">{ep.runtime} min</span>
                        )}
                      </div>
                      {isActive && (
                        <span className="text-accent text-[10px] font-semibold">NOW</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default async function TVWatchPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

  const season = Math.max(1, Number(sp.s) || 1);
  const episode = Math.max(1, Number(sp.ep) || 1);

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 rounded bg-white/[0.05]" />
            <div className="aspect-video w-full rounded-lg bg-white/[0.05]" />
            <div className="h-20 w-full rounded-lg bg-white/[0.05]" />
          </div>
        </div>
      }
    >
      <TVWatchContent id={numId} season={season} episode={episode} />
    </Suspense>
  );
}
