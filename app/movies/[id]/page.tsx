import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApiError } from "@/components/ApiError";
import { MediaCard } from "@/components/MediaCard";
import { MediaDetailSkeleton } from "@/components/skeletons";
import {
  getMovieDetails,
  getSimilarMovies,
  tmdbImg,
  TMDBError,
} from "@/lib/tmdb";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const movie = await getMovieDetails(Number(id));
    return { title: `${movie.title} — Zentaku` };
  } catch {
    return { title: "Movie — Zentaku" };
  }
}

async function MovieDetailContent({ id }: { id: number }) {
  let movie;
  try {
    movie = await getMovieDetails(id);
  } catch (err) {
    if (err instanceof TMDBError && err.status === 404) notFound();
    const message = err instanceof TMDBError ? err.message : "Unable to load movie details.";
    const status = err instanceof TMDBError ? err.status : undefined;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ApiError message={message} status={status} />
      </div>
    );
  }

  const poster = tmdbImg(movie.poster_path);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

  // Fetch similar movies (non-critical)
  let similar: typeof movie[] = [];
  try {
    const simPage = await getSimilarMovies(id);
    similar = simPage.results.slice(0, 6);
  } catch { /* ignore */ }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/movies" className="hover:text-foreground">Movies</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1 max-w-[240px]">{movie.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 lg:gap-10">
        {/* Poster */}
        <div className="space-y-4 md:col-span-4 lg:col-span-3">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/[0.08] bg-surface-2 shadow-sm">
            {poster ? (
              <Image
                src={poster}
                alt={movie.title}
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
            {movie.runtime && (
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-muted">Runtime</span>
                <span className="font-medium text-foreground">{movie.runtime} min</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted">Release</span>
              <span className="font-medium text-foreground">{movie.release_date || "TBA"}</span>
            </div>
            {rating && (
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-muted">Rating</span>
                <span className="font-medium text-foreground">⭐ {rating}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-muted">Status</span>
              <span className={`font-medium ${movie.status === "Released" ? "text-emerald-400" : "text-foreground"}`}>
                {movie.status || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6 md:col-span-8 lg:col-span-9">
          {movie.tagline && (
            <p className="text-xs font-medium text-muted/80">{movie.tagline}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {movie.title}
          </h1>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {movie.genres.map((g) => (
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
              href={`/movies/${id}/watch`}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Watch Now</span>
            </Link>
          </div>

          {/* Overview */}
          <div className="space-y-2 border-t border-white/[0.06] pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Overview</h2>
            <p className="text-sm leading-relaxed text-muted/90 max-w-3xl">
              {movie.overview || "No overview available for this movie."}
            </p>
          </div>
        </div>
      </div>

      {/* Similar Movies */}
      {similar.length > 0 && (
        <section className="mt-12 border-t border-white/[0.06] pt-8">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Similar Movies</h2>
            <span className="text-xs text-muted">({similar.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {similar.map((s) => (
              <MediaCard
                key={s.id}
                href={`/movies/${s.id}`}
                image={tmdbImg(s.poster_path)}
                title={s.title}
                badge={s.release_date?.slice(0, 4) || "Movie"}
                type="Movie"
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

  return (
    <Suspense fallback={<MediaDetailSkeleton />}>
      <MovieDetailContent id={numId} />
    </Suspense>
  );
}
