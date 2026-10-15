import type { AnimeKaiListItem } from "./animekai";

export type KitsuMediaResult = {
  poster?: string;
  banner?: string;
};

// In-memory cache to avoid repeated API calls
const kitsuCache = new Map<string, KitsuMediaResult>();

/**
 * Checks if a given poster URL is known to be dead, broken, or unreachable.
 * `cdn.noitatnemucod.net` returns Cloudflare 521.
 * `anime.astronerdboy.com` is unreachable.
 */
export function isBrokenImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return true;
  if (trimmed.includes("cdn.noitatnemucod.net")) return true;
  if (trimmed.includes("astronerdboy.com")) return true;
  return false;
}

/**
 * Normalizes title for searching in Kitsu (removes (TV), (Dub), Season tags, etc.)
 */
function cleanSearchTitle(title: string): string {
  return title
    .replace(/\(TV\)/gi, "")
    .replace(/\(Dub\)/gi, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*-\s*Season\s*\d+/gi, "")
    .replace(/\s*Season\s*\d+/gi, "")
    .replace(/\s*Part\s*\d+/gi, "")
    .replace(/\s*Final\s*Season/gi, "")
    .trim();
}

/**
 * Query Kitsu API for poster and banner artwork.
 */
export async function resolveKitsuMedia(title: string): Promise<KitsuMediaResult> {
  const rawTitle = title.trim();
  if (!rawTitle) return {};

  const cacheKey = rawTitle.toLowerCase();
  if (kitsuCache.has(cacheKey)) {
    return kitsuCache.get(cacheKey)!;
  }

  const clean = cleanSearchTitle(rawTitle);
  const candidates = [rawTitle, clean].filter((c, i, a) => Boolean(c && a.indexOf(c) === i));

  for (const query of candidates) {
    try {
      const res = await fetch(
        `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=2`,
        {
          signal: AbortSignal.timeout(3500),
          next: { revalidate: 86400 },
        }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const items = data?.data || [];
      if (items.length === 0) continue;

      // Pick best match
      const match = items[0]?.attributes;
      if (!match) continue;

      const poster =
        match.posterImage?.large ||
        match.posterImage?.original ||
        match.posterImage?.medium ||
        match.posterImage?.small;

      const banner =
        match.coverImage?.large ||
        match.coverImage?.original ||
        match.coverImage?.small;

      if (poster || banner) {
        const result: KitsuMediaResult = {
          poster: poster || undefined,
          banner: banner || undefined,
        };
        kitsuCache.set(cacheKey, result);
        return result;
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Cache empty so we don't spam failed queries
  const empty: KitsuMediaResult = {};
  kitsuCache.set(cacheKey, empty);
  return empty;
}

/**
 * Enriches the top featured hero items with high-resolution widescreen banners and sharp posters.
 */
export async function enrichHeroItems(items: AnimeKaiListItem[]): Promise<AnimeKaiListItem[]> {
  if (!items || items.length === 0) return [];

  return Promise.all(
    items.map(async (item) => {
      try {
        const media = await resolveKitsuMedia(item.title);
        return {
          ...item,
          bannerImage: media.banner || item.bannerImage,
          image: media.poster || (isBrokenImageUrl(item.image) ? "" : item.image),
        };
      } catch {
        return item;
      }
    })
  );
}

/**
 * Checks an array of anime items and replaces any missing or broken poster URLs with Kitsu posters.
 */
export async function healAnimeList(items: AnimeKaiListItem[]): Promise<AnimeKaiListItem[]> {
  if (!items || items.length === 0) return [];

  // Identify broken items that need healing
  return Promise.all(
    items.map(async (item) => {
      if (!isBrokenImageUrl(item.image)) {
        return item;
      }

      try {
        const media = await resolveKitsuMedia(item.title);
        if (media.poster) {
          return {
            ...item,
            image: media.poster,
            bannerImage: media.banner || item.bannerImage,
          };
        }
      } catch {
        // Return original if healing fails
      }

      return item;
    })
  );
}
