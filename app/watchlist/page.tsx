"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useWatchlist,
  useWatchHistory,
  toggleWatchlist,
  removeWatchHistory,
} from "@/lib/storage";
import { animeDetailHref, animeWatchHref } from "@/lib/anime-path";
import { MediaCard } from "@/components/MediaCard";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

export default function WatchlistPage() {
  const [tab, setTab] = useState<"watchlist" | "history">("watchlist");
  const { user } = useAuth();
  const { showToast } = useToast();
  const watchlist = useWatchlist();
  const history = useWatchHistory();

  const handleRemove = (item: { id: string; type: "anime" | "manga"; title: string; poster: string }) => {
    toggleWatchlist({ id: item.id, type: item.type, title: item.title, poster: item.poster });
    showToast({
      title: "Removed from your watchlist.",
      description: `"${item.title}" has been removed from your library.`,
    });
  };

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            My Library
          </h1>
          <p className="mt-1 text-xs text-muted">
            Manage your saved titles and viewing history
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg border border-white/[0.08] bg-surface p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("watchlist")}
            className={`rounded-md px-3.5 py-1.5 font-medium transition-colors ${
              tab === "watchlist"
                ? "bg-white/[0.08] text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Watchlist ({watchlist.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`rounded-md px-3.5 py-1.5 font-medium transition-colors ${
              tab === "history"
                ? "bg-white/[0.08] text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            History ({history.length})
          </button>
        </div>
      </div>

      {/* Guest Notice if not logged in */}
      {!user && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-surface-2/60 p-4 text-xs">
          <div>
            <p className="font-semibold text-foreground">Sign in to save and sync</p>
            <p className="mt-0.5 text-muted">
              Create an account or log in to sync your watchlist across all your devices.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login?returnTo=/watchlist"
              className="rounded-md bg-accent px-3 py-1.5 font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup?returnTo=/watchlist"
              className="rounded-md border border-white/[0.1] px-3 py-1.5 font-medium text-foreground hover:bg-white/[0.04] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      {/* Tab: Watchlist */}
      {tab === "watchlist" && (
        <div>
          {watchlist.length === 0 ? (
            <div className="mx-auto my-16 max-w-md rounded-xl border border-white/[0.08] bg-surface p-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-muted">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">Your watchlist is empty</h3>
              <p className="mt-1.5 text-xs text-muted">
                Save anime series or manga titles to keep track of what you want to watch or read next.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link
                  href="/browse?type=anime"
                  className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover transition-colors"
                >
                  Explore Anime
                </Link>
                <Link
                  href="/browse?type=manga"
                  className="rounded-md border border-white/[0.1] px-4 py-2 text-xs font-medium text-muted hover:text-foreground hover:border-white/[0.2] transition-colors"
                >
                  Explore Manga
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {watchlist.map((item) => {
                const href =
                  item.type === "anime" ? animeDetailHref(item.id) : `/manga/${item.id}`;
                return (
                  <div key={item.id} className="relative group">
                    <MediaCard
                      href={href}
                      image={item.poster}
                      title={item.title}
                      badge={item.type === "anime" ? "ANIME" : "MANGA"}
                      subtitle={item.genre}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="absolute top-2 right-2 rounded bg-black/80 px-2 py-1 text-[10px] text-muted/80 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {tab === "history" && (
        <div>
          {history.length === 0 ? (
            <div className="mx-auto my-16 max-w-md rounded-xl border border-white/[0.08] bg-surface p-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-muted">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">No watch history recorded</h3>
              <p className="mt-1.5 text-xs text-muted">
                Episodes you stream will automatically appear here so you can easily resume anytime.
              </p>
              <div className="mt-5 flex justify-center">
                <Link
                  href="/browse?type=anime"
                  className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover transition-colors"
                >
                  Start Watching
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.08] bg-surface overflow-hidden">
                {history.map((item) => (
                  <div
                    key={item.animeId}
                    className="flex items-center justify-between gap-4 p-3.5 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={animeWatchHref(item.animeId, item.episodeNumber)}
                        className="text-xs font-medium text-foreground hover:text-white"
                      >
                        {item.title}
                      </Link>
                      <p className="text-[11px] text-muted mt-0.5">
                        Watched Episode {item.episodeNumber}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={animeWatchHref(item.animeId, item.episodeNumber)}
                        className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover transition-colors"
                      >
                        Resume
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeWatchHistory(item.animeId)}
                        className="rounded p-1.5 text-muted hover:text-foreground transition-colors"
                        title="Remove from history"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
