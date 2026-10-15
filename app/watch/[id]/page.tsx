import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/components/ApiError";
import { ZoryvaPlayer } from "@/components/ZoryvaPlayer";
import { HlsVideoPlayer } from "@/components/HlsVideoPlayer";
import { OfficialStreams } from "@/components/OfficialStreams";
import { EpisodeSidebar } from "@/components/EpisodeSidebar";
import { MobileEpisodeToggle } from "@/components/MobileEpisodeToggle";
import { CommentsSection } from "@/components/CommentsSection";
import { RecordWatchProgress } from "@/components/RecordWatchProgress";
import { animeIdFromParam, animeDetailHref, animeWatchHref } from "@/lib/anime-path";
import { animeKaiInfo, AnimeKaiError } from "@/lib/animekai";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string; server?: string; alId?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const slug = animeIdFromParam(id);
  if (!slug) return { title: "Watch — Zentaku" };
  try {
    const anime = await animeKaiInfo(slug);
    const epNum = sp.ep ? ` · Ep ${sp.ep}` : "";
    return { title: `Watch ${anime.title}${epNum} — Zentaku` };
  } catch {
    return { title: "Watch Anime — Zentaku" };
  }
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const slug = animeIdFromParam(id);
  if (!slug) notFound();

  let anime;
  try {
    anime = await animeKaiInfo(slug);
  } catch (err) {
    if (err instanceof AnimeKaiError && err.status === 404) notFound();
    const message = err instanceof AnimeKaiError ? err.message : "Unable to load stream details.";
    const status = err instanceof AnimeKaiError ? err.status : undefined;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ApiError message={message} status={status} />
      </div>
    );
  }

  const episodes = [...(anime.episodes ?? [])].sort((a, b) => a.number - b.number);
  const epParam = Number(sp.ep);
  const currentEp =
    Number.isFinite(epParam) && epParam > 0 ? epParam : episodes[0]?.number ?? 1;
  const currentEpisode = episodes.find((e) => e.number === currentEp) ?? episodes[0];
  const poster = anime.image?.trim() ?? "";
  const title = anime.title;
  const episodeLabel =
    currentEpisode?.title != null && currentEpisode.title !== `Episode ${currentEp}`
      ? `Episode ${currentEp} · ${currentEpisode.title}`
      : `Episode ${currentEp}`;

  const synopsis =
    anime.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";

  const prevEpisode = episodes.find((e) => e.number === currentEp - 1);
  const nextEpisode = episodes.find((e) => e.number === currentEp + 1);

  // Server selection: default to "native" (working AnimeKai stream), option for "zoryva"
  const currentServer = sp.server === "zoryva" ? "zoryva" : "native";

  // Use AniList ID for Zoryva embed if available
  const explicitAlId = sp.alId ? Number(sp.alId) : undefined;
  const activeAlId = explicitAlId && explicitAlId > 0 ? explicitAlId : anime.alID;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
      {/* Auto-record continue watching */}
      <RecordWatchProgress
        animeId={anime.id}
        title={title}
        poster={poster}
        episodeNumber={currentEp}
        totalEpisodes={episodes.length}
      />

      {/* Breadcrumb path */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href={animeDetailHref(anime.id)} className="hover:text-foreground line-clamp-1 max-w-[180px]">
          {title}
        </Link>
        <span>/</span>
        <span className="text-foreground">Episode {currentEp}</span>
      </nav>

      {/* Main Theater View */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        
        {/* Left dominant column: Video Player + Episode Controls + Media Details */}
        <div className="space-y-4 lg:col-span-8 xl:col-span-9">
          
          {/* Server Selector Bar */}
          <div className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-surface px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted font-medium">Server:</span>
              <Link
                href={`/watch/${encodeURIComponent(anime.id)}?ep=${currentEp}&server=native`}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  currentServer === "native"
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-muted hover:text-white border border-white/[0.08]"
                }`}
              >
                Server 1 (Native HLS)
              </Link>
              <Link
                href={`/watch/${encodeURIComponent(anime.id)}?ep=${currentEp}&server=zoryva`}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  currentServer === "zoryva"
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-muted hover:text-white border border-white/[0.08]"
                }`}
              >
                Server 2 (Zoryva Player)
              </Link>
            </div>
            <Link
              href="/"
              className="hidden text-xs text-muted hover:text-foreground transition-colors sm:inline"
            >
              ← Back to Zentaku
            </Link>
          </div>

          {/* Video Player */}
          {currentServer === "zoryva" ? (
            <ZoryvaPlayer
              type="anime"
              id={activeAlId || anime.id}
              season={1}
              episode={currentEp}
            />
          ) : (
            <HlsVideoPlayer
              episodeId={currentEpisode?.id ?? `${anime.id}-ep-${currentEp}`}
              poster={poster}
            />
          )}

          {/* Episode Quick-Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-surface p-3 text-xs">
            <div className="min-w-0">
              <span className="font-semibold text-foreground">{episodeLabel}</span>
              {anime.type && <span className="ml-2 text-muted">({anime.type})</span>}
            </div>

            <div className="flex items-center gap-2">
              {prevEpisode ? (
                <Link
                  href={`${animeWatchHref(anime.id, prevEpisode.number)}${currentServer === "zoryva" ? "&server=zoryva" : ""}`}
                  className="rounded border border-white/[0.1] bg-surface-2 px-3 py-1.5 font-medium text-foreground transition-colors hover:border-white/[0.2]"
                >
                  ← Prev
                </Link>
              ) : (
                <span className="rounded border border-white/[0.04] bg-surface-2/40 px-3 py-1.5 text-muted/40 cursor-not-allowed">
                  ← Prev
                </span>
              )}

              {nextEpisode ? (
                <Link
                  href={`${animeWatchHref(anime.id, nextEpisode.number)}${currentServer === "zoryva" ? "&server=zoryva" : ""}`}
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

          {/* Anime Information Preview */}
          <div className="rounded-lg border border-white/[0.06] bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
              <Link
                href={animeDetailHref(anime.id)}
                className="text-xs font-medium text-muted transition-colors hover:text-foreground"
              >
                View full overview →
              </Link>
            </div>
            {synopsis && (
              <p className="text-xs leading-relaxed text-muted line-clamp-3">
                {synopsis}
              </p>
            )}
          </div>

          {/* Official Licensed Streams if Anilist ID is linked */}
          {anime.alID && <OfficialStreams alId={anime.alID} />}

          {/* Discussion */}
          <CommentsSection
            animeId={anime.id}
            episodeNumber={currentEp}
            animeTitle={title}
          />

          {/* Mobile episode list toggle */}
          <MobileEpisodeToggle animeId={anime.id} episodes={episodes} currentEp={currentEp} />
        </div>

        {/* Right sidebar column: Episodes Drawer – desktop only */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
          <EpisodeSidebar animeId={anime.id} episodes={episodes} currentEp={currentEp} />
        </div>

      </div>
    </main>
  );
}
