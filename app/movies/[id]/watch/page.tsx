import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApiError } from "@/components/ApiError";
import { ZoryvaPlayer } from "@/components/ZoryvaPlayer";
import { getMovieDetails, TMDBError } from "@/lib/tmdb";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const movie = await getMovieDetails(Number(id));
    return { title: `Watch ${movie.title} — Zentaku` };
  } catch {
    return { title: "Watch Movie — Zentaku" };
  }
}

async function MovieWatchContent({ id }: { id: number }) {
  let movie;
  try {
    movie = await getMovieDetails(id);
  } catch (err) {
    if (err instanceof TMDBError && err.status === 404) notFound();
    const message = err instanceof TMDBError ? err.message : "Unable to load movie.";
    const status = err instanceof TMDBError ? err.status : undefined;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ApiError message={message} status={status} />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/movies" className="hover:text-foreground">Movies</Link>
        <span>/</span>
        <Link href={`/movies/${id}`} className="hover:text-foreground line-clamp-1 max-w-[180px]">
          {movie.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">Watch</span>
      </nav>

      <div className="space-y-4">
        {/* Video Player */}
        <ZoryvaPlayer type="movie" id={id} />

        {/* Movie Info */}
        <div className="rounded-lg border border-white/[0.06] bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {movie.title}
            </h1>
            <Link
              href={`/movies/${id}`}
              className="text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              View details →
            </Link>
          </div>
          {movie.overview && (
            <p className="text-xs leading-relaxed text-muted line-clamp-3">
              {movie.overview}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default async function MovieWatchPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) notFound();

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
      <MovieWatchContent id={numId} />
    </Suspense>
  );
}
