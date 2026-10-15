"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isInWatchlist, toggleWatchlist } from "@/lib/storage";
import { useRequireAuth } from "@/lib/require-auth";
import { useToast } from "@/lib/toast-context";

type Props = {
  id: string;
  type: "anime" | "manga";
  title: string;
  poster: string;
  genre?: string;
};

export function WatchlistButton({ id, type, title, poster, genre }: Props) {
  const pathname = usePathname();
  const requireAuth = useRequireAuth();
  const { showToast } = useToast();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInWatchlist(id));
  }, [id]);

  const handleToggle = () => {
    if (!requireAuth(pathname)) return;

    const nextState = toggleWatchlist({
      id,
      type,
      title,
      poster,
      genre,
    });
    setSaved(nextState);

    showToast({
      title: nextState ? "Added to your watchlist." : "Removed from your watchlist.",
      description: nextState
        ? `"${title}" has been saved to your library.`
        : `"${title}" has been removed from your library.`,
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold transition-colors ${saved
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-white/[0.12] bg-surface text-foreground hover:bg-white/[0.05]"
        }`}
    >
      <svg
        className="h-4 w-4"
        fill={saved ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span>{saved ? "In Watchlist" : "Add to Watchlist"}</span>
    </button>
  );
}
