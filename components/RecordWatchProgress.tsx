"use client";

import { useEffect } from "react";
import { recordWatchProgress } from "@/lib/storage";

type Props = {
  animeId: string;
  title: string;
  poster: string;
  episodeNumber: number;
  totalEpisodes?: number;
};

export function RecordWatchProgress({
  animeId,
  title,
  poster,
  episodeNumber,
  totalEpisodes,
}: Props) {
  useEffect(() => {
    if (!animeId || !episodeNumber) return;
    recordWatchProgress({
      animeId,
      title,
      poster,
      episodeNumber,
      totalEpisodes,
    });
  }, [animeId, title, poster, episodeNumber, totalEpisodes]);

  return null;
}
