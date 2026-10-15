import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/components/ApiError";
import { WatchlistButton } from "@/components/WatchlistButton";
import { OfficialStreams } from "@/components/OfficialStreams";
import { animeIdFromParam, animeWatchHref } from "@/lib/anime-path";
import { streamingPosterUnoptimized } from "@/lib/image-url";
import { animeKaiInfo, AnimeKaiError } from "@/lib/animekai";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const slug = animeIdFromParam(id);
  if (!slug) return { title: "Anime" };
  try {
    const anime = await animeKaiInfo(slug);
    return { title: `${anime.title} — Zentaku` };
  } catch {
    return { title: "Anime — Zentaku" };
  }
}

export default async function AnimeDetailPage({ params }: Props) {
  const { id } = await params;
  const slug = animeIdFromParam(id);
  if (!slug) notFound();

  let anime;
  try {
    anime = await animeKaiInfo(slug);
  } catch (err) {
    if (err instanceof AnimeKaiError && err.status === 404) notFound();
    const message = err instanceof AnimeKaiError ? err.message : "Unable to load anime details.";
    const status = err instanceof AnimeKaiError ? err.status : undefined;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ApiError message={message} status={status} />
      </div>
    );
  }

  if (!anime.title && !anime.episodes?.length) notFound();

  const poster = anime.image?.trim() ?? "";
  const title = anime.title;
  const synopsis =
    anime.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";

  const episodes = anime.episodes || [];

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/browse?type=anime" className="hover:text-foreground">Anime</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1 max-w-[240px]">{title}</span>
      </nav>

      {/* Main Two-Column Media Database Header */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 lg:gap-10">
        
        {/* Left Column: Poster & Quick Specs */}
        <div className="space-y-4 md:col-span-4 lg:col-span-3">
          <div className="relative aspect-[2/3] w-full max-w-[220px] mx-auto md:max-w-none overflow-hidden rounded-lg border border-white/[0.08] bg-surface-2 shadow-sm">
            {poster ? (
              <Image
                src={poster}
                alt={title}
                fill
                priority
                loading="eager"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
                unoptimized={streamingPosterUnoptimized(poster)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                No Poster Artwork
              </div>
            )}
          </div>

          {/* Quick specs box */}
          <div className="rounded-lg border border-white/[0.06] bg-surface p-3.5 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted">Format</span>
              <span className="font-medium text-foreground">{anime.type || "TV Series"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted">Status</span>
              <span className={`font-medium ${anime.status?.toLowerCase() === "completed" ? "text-emerald-400" : "text-foreground"}`}>
                {anime.status || "Airing"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted">Episodes</span>
              <span className="font-medium text-foreground">{anime.totalEpisodes || episodes.length || "TBA"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Audio</span>
              <span className="font-medium text-foreground uppercase">{anime.subOrDub || "Subbed"}</span>
            </div>
          </div>

          <div className="w-full">
            <WatchlistButton
              id={anime.id}
              type="anime"
              title={title}
              poster={poster}
              genre={anime.genres?.[0]}
            />
          </div>
        </div>

        {/* Right Column: Title, Metadata, Synopsis, Primary Action */}
        <div className="space-y-6 md:col-span-8 lg:col-span-9">
          <div>
            {anime.otherName && (
              <p className="text-xs font-medium text-muted/80 mb-1">{anime.otherName}</p>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {title}
            </h1>
          </div>

          {/* Genre Tags */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {anime.genres
                .filter((g) => g.length < 30 && !g.includes(":"))
                .map((g) => (
                  <span
                    key={g}
                    className="rounded bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted border border-white/[0.05]"
                  >
                    {g}
                  </span>
                ))}
            </div>
          )}

          {/* Watch Now Button */}
          <div className="flex items-center gap-3 pt-1">
            <Link
              href={animeWatchHref(anime.id)}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Watch Episode 1</span>
            </Link>
          </div>

          {/* Synopsis */}
          <div className="space-y-2 border-t border-white/[0.06] pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Synopsis</h2>
            <p className="text-sm leading-relaxed text-muted/90 max-w-3xl">
              {synopsis || "No detailed synopsis available for this title."}
            </p>
          </div>

          {/* Official Streams if available */}
          {anime.alID && <OfficialStreams alId={anime.alID} />}
        </div>

      </div>

      {/* Episodes Section */}
      {episodes.length > 0 && (
        <section className="mt-12 border-t border-white/[0.06] pt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Episodes
              </h2>
              <span className="text-xs text-muted">({episodes.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 custom-scrollbar max-h-[500px] overflow-y-auto pr-1">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={animeWatchHref(anime.id, ep.number)}
                className="group flex items-center gap-3 rounded-md border border-white/[0.06] bg-surface p-2.5 transition-colors hover:border-white/[0.18] hover:bg-surface-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-2 font-mono text-xs font-semibold text-muted group-hover:text-foreground">
                  {ep.number}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-medium text-foreground transition-colors group-hover:text-white">
                    {ep.title && ep.title !== `Episode ${ep.number}` ? ep.title : `Episode ${ep.number}`}
                  </p>
                  <span className="text-[10px] text-muted">Subbed</span>
                </div>
                <span className="text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100">
                  ▶
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
