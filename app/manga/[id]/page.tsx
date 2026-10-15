import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchlistButton } from "@/components/WatchlistButton";
import { malImageShouldSkipOptimization, pickJpgLarge } from "@/lib/image-url";
import { getMangaById } from "@/lib/jikan";
import { searchMangaByTitle, getMangaChapters } from "@/lib/mangadex";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const isUuid = id.includes("-") && id.length >= 30;
    const malId = Number(id);
    const manga = await getMangaById(isUuid ? id : malId);
    return { title: `${manga.title_english || manga.title} — Zentaku` };
  } catch {
    return { title: "Manga — Zentaku" };
  }
}

export default async function MangaDetailPage({ params }: Props) {
  const { id } = await params;
  const isUuid = id.includes("-") && id.length >= 30;
  const malId = Number(id);
  if (!isUuid && !Number.isFinite(malId)) notFound();

  let manga;
  try {
    manga = await getMangaById(isUuid ? id : malId);
  } catch {
    notFound();
  }

  const title = manga.title_english || manga.title;
  const poster = pickJpgLarge(manga.images.jpg);

  let mdId: string | null = isUuid ? id : null;
  let chapters: { id: string; label: string; chapterNum?: string }[] = [];
  try {
    if (!mdId) {
      const found = await searchMangaByTitle(title);
      mdId = found[0]?.id ?? null;
    }
    const raw = await getMangaChapters(mdId, 500, title);
    chapters = raw.map((c) => ({
      id: c.id,
      label:
        c.attributes.title?.trim() ||
        (c.attributes.chapter != null ? `Chapter ${c.attributes.chapter}` : "Chapter"),
      chapterNum: c.attributes.chapter || undefined,
    }));
  } catch {
    // Optional chapters lookup fallback
  }

  const firstChapter = chapters[0];

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/browse?type=manga" className="hover:text-foreground">Manga</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1 max-w-[240px]">{title}</span>
      </nav>

      {/* Main Two-Column Media Database Header */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 lg:gap-10">
        
        {/* Left Column: Poster & Quick Specs */}
        <div className="space-y-4 md:col-span-4 lg:col-span-3">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/[0.08] bg-surface-2 shadow-sm">
            {poster ? (
              <Image
                src={poster}
                alt={title}
                fill
                priority
                loading="eager"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
                unoptimized={malImageShouldSkipOptimization(poster)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                No Artwork
              </div>
            )}
          </div>

          {/* Quick specs card */}
          <div className="rounded-lg border border-white/[0.06] bg-surface p-3.5 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted">Type</span>
              <span className="font-medium text-foreground">Manga</span>
            </div>
            {manga.score != null && (
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-muted">Rating</span>
                <span className="font-medium text-amber-400">★ {manga.score}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-muted">Chapters</span>
              <span className="font-medium text-foreground">{manga.chapters ?? "Ongoing"}</span>
            </div>
            {manga.volumes != null && (
              <div className="flex justify-between py-1">
                <span className="text-muted">Volumes</span>
                <span className="font-medium text-foreground">{manga.volumes}</span>
              </div>
            )}
          </div>

          <div className="w-full">
            <WatchlistButton
              id={String(manga.mal_id)}
              type="manga"
              title={title}
              poster={poster}
              genre={manga.genres?.[0]?.name}
            />
          </div>
        </div>

        {/* Right Column: Title, Metadata, Synopsis, Read Button */}
        <div className="space-y-6 md:col-span-8 lg:col-span-9">
          <div>
            {manga.title && manga.title !== title && (
              <p className="text-xs font-medium text-muted/80 mb-1">{manga.title}</p>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {title}
            </h1>
          </div>

          {/* Genre Tags */}
          {manga.genres && manga.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {manga.genres.map((g) => (
                <span
                  key={g.mal_id}
                  className="rounded bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted border border-white/[0.05]"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Read First Chapter Action */}
          {firstChapter && mdId && (
            <div className="flex items-center gap-3 pt-1">
              <Link
                href={`/read/${firstChapter.id}?md=${mdId}`}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Read First Chapter</span>
              </Link>
            </div>
          )}

          {/* Synopsis */}
          <div className="space-y-2 border-t border-white/[0.06] pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Synopsis</h2>
            <p className="text-sm leading-relaxed text-muted/90 max-w-3xl">
              {manga.synopsis?.replace(/\r?\n\[Written by MAL Rewrite\]/i, "").trim() ||
                "No synopsis provided for this title."}
            </p>
          </div>
        </div>

      </div>

      {/* Chapters Section */}
      <section className="mt-12 border-t border-white/[0.06] pt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Available Chapters
            </h2>
            {chapters.length > 0 && <span className="text-xs text-muted">({chapters.length})</span>}
          </div>
        </div>

        {!mdId && (
          <div className="rounded-lg border border-white/[0.06] bg-surface p-8 text-center">
            <p className="text-xs text-muted">
              No digital reader entries are currently linked to MangaDex for this series.
            </p>
          </div>
        )}

        {mdId && chapters.length === 0 && (
          <div className="rounded-lg border border-white/[0.06] bg-surface p-8 text-center">
            <p className="text-xs text-muted">No English chapter translations found yet.</p>
          </div>
        )}

        {mdId && chapters.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 custom-scrollbar max-h-[500px] overflow-y-auto pr-1">
            {chapters.map((c) => (
              <Link
                key={c.id}
                href={`/read/${c.id}?md=${mdId}`}
                className="group flex items-center justify-between rounded-md border border-white/[0.06] bg-surface p-2.5 text-xs transition-colors hover:border-white/[0.18] hover:bg-surface-2"
              >
                <span className="line-clamp-1 font-medium text-foreground transition-colors group-hover:text-white">
                  {c.label}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-muted transition-colors group-hover:text-accent">
                  Read →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
