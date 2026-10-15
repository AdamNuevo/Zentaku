"use client";

type ZoryvaPlayerProps = {
  /** "movie" | "tv" | "anime" */
  type: "movie" | "tv" | "anime";
  /** TMDB ID for movie/tv, AniList ID for anime */
  id: string | number;
  /** Season number (tv & anime only) */
  season?: number;
  /** Episode number (tv & anime only) */
  episode?: number;
  /** Accent color hex without # */
  color?: string;
};

export function ZoryvaPlayer({
  type,
  id,
  season,
  episode,
  color = "dc2626",
}: ZoryvaPlayerProps) {
  let src = `https://zoryva.me/embed/${type}/${id}`;

  if ((type === "tv" || type === "anime") && season != null && episode != null) {
    src += `/${season}/${episode}`;
  }

  src += `?color=${encodeURIComponent(color)}`;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-white/[0.08] bg-black">
      <div className="relative aspect-video w-full">
        <iframe
          src={src}
          className="absolute inset-0 h-full w-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-fullscreen"
          referrerPolicy="origin"
          title="Video Player"
        />
      </div>
    </div>
  );
}
