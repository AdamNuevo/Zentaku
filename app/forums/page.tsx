import Link from "next/link";

export default function ForumsPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-white/[0.08] text-muted">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Community Discussions</h1>
      <p className="mt-2 text-xs leading-relaxed text-muted max-w-md mx-auto">
        Dedicated discussion threads and title forums are currently under development. In the meantime, explore our live streaming anime and manga catalog.
      </p>

      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/browse?type=anime"
          className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Explore Anime
        </Link>
        <Link
          href="/browse?type=manga"
          className="rounded-md border border-white/[0.1] px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground hover:border-white/[0.2]"
        >
          Explore Manga
        </Link>
      </div>
    </main>
  );
}
