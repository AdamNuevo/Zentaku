import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/components/ApiError";
import {
  getChapterPageUrls,
  getAdjacentChapterIds,
  MangaDexError,
} from "@/lib/mangadex";

type Props = {
  params: Promise<{ chapterId: string }>;
  searchParams: Promise<{ md?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { chapterId } = await params;
  return { title: `Reader · Chapter ${chapterId.slice(0, 8)} — Zentaku` };
}

export default async function MangaReaderPage({ params, searchParams }: Props) {
  const { chapterId } = await params;
  const sp = await searchParams;
  const mdMangaId = sp.md ?? "";

  if (!chapterId || chapterId.length < 10) notFound();

  let pages;
  try {
    pages = await getChapterPageUrls(chapterId);
  } catch (err) {
    if (err instanceof MangaDexError && err.status === 404) notFound();
    const message = err instanceof MangaDexError ? err.message : "Unable to load chapter pages.";
    const status = err instanceof MangaDexError ? err.status : undefined;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ApiError message={message} status={status} />
      </div>
    );
  }

  let prev: string | null = null;
  let next: string | null = null;
  if (mdMangaId && mdMangaId.length >= 10) {
    try {
      const adj = await getAdjacentChapterIds(mdMangaId, chapterId);
      prev = adj.prev;
      next = adj.next;
    } catch {
      // ignore adjacent navigation errors
    }
  }

  const q = mdMangaId ? `?md=${encodeURIComponent(mdMangaId)}` : "";

  return (
    <div className="min-h-screen bg-[#090a0c]">
      
      {/* Sticky Minimal Reader Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0d0f12]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-2.5">
          <Link
            href={mdMangaId ? `/browse?type=manga` : "/browse?type=manga"}
            className="text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            ← Back
          </Link>

          <div className="text-center min-w-0">
            <h1 className="line-clamp-1 text-xs font-semibold text-foreground sm:text-sm">
              {pages.chapterTitle ?? "Manga Reader"}
            </h1>
            <span className="text-[10px] text-muted">
              {pages.urls.length} pages loaded
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {prev ? (
              <Link
                href={`/read/${prev}${q}`}
                className="rounded border border-white/[0.1] bg-surface-2 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-white/[0.2]"
              >
                Prev
              </Link>
            ) : (
              <span className="rounded border border-white/[0.04] px-2.5 py-1 text-xs text-muted/40 cursor-not-allowed">
                Prev
              </span>
            )}

            {next ? (
              <Link
                href={`/read/${next}${q}`}
                className="rounded bg-accent px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Next
              </Link>
            ) : (
              <span className="rounded border border-white/[0.04] px-2.5 py-1 text-xs text-muted/40 cursor-not-allowed">
                Next
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Reader Canvas */}
      <main className="mx-auto max-w-3xl px-2 py-4 sm:px-4">
        <div className="flex flex-col items-center bg-[#07080a] shadow-xl">
          {pages.urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={`Page ${i + 1}`}
              className="block w-full h-auto"
              loading={i < 3 ? "eager" : "lazy"}
            />
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="my-8 flex flex-col items-center justify-center gap-3 border-t border-white/[0.08] pt-6 pb-20">
          <div className="flex items-center gap-3">
            {prev && (
              <Link
                href={`/read/${prev}${q}`}
                className="rounded-md border border-white/[0.12] bg-surface px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-white/[0.2]"
              >
                ← Previous Chapter
              </Link>
            )}
            {next && (
              <Link
                href={`/read/${next}${q}`}
                className="rounded-md bg-accent px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Next Chapter →
              </Link>
            )}
          </div>
          <Link
            href="/browse?type=manga"
            className="text-xs text-muted hover:text-foreground mt-2"
          >
            Return to Manga Catalog
          </Link>
        </div>
      </main>

    </div>
  );
}
