import { healAnimeList, isBrokenImageUrl, resolveKitsuMedia } from "./kitsu";

export class AnimeKaiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AnimeKaiError";
    this.status = status;
  }
}

export type AnimeKaiListItem = {
  id: string;
  title: string;
  url: string;
  image: string;
  bannerImage?: string;
  releaseDate?: string;
  subOrDub?: string;
};

export type AnimeKaiSearchPage = {
  currentPage: number;
  hasNextPage: boolean;
  results: AnimeKaiListItem[];
};

export type AnimeKaiEpisode = {
  id: string;
  number: number;
  title: string;
  url: string;
};

export type AnimeKaiInfo = {
  id: string;
  alID?: number;
  malID?: number;
  title: string;
  url: string;
  image: string;
  bannerImage?: string;
  description: string;
  genres: string[];
  subOrDub: string;
  type: string;
  status: string;
  otherName?: string;
  totalEpisodes: number;
  episodes: AnimeKaiEpisode[];
};

export type AnimeKaiWatchSource = {
  url: string;
  quality: string;
  isM3U8: boolean;
  isIframe?: boolean;
};

export type AnimeKaiWatchResult = {
  headers?: Record<string, string>;
  sources: AnimeKaiWatchSource[];
  download?: string;
};

type AniDataItem = {
  finder?: string;
  Name?: string;
  ImagePath?: string;
  Image?: string;
};

const ANIPUB_API = "https://anipub.xyz";

function fixImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${ANIPUB_API}/${url}`;
}

export async function animeKaiSearch(query: string, page = 1): Promise<AnimeKaiSearchPage> {
  const q = query.trim() || "a";
  try {
    const res = await fetch(`${ANIPUB_API}/api/searchall/${encodeURIComponent(q)}?page=${page}`);
    if (!res.ok) return { currentPage: page, hasNextPage: false, results: [] };
    const data = await res.json();
    const results = ((data.AniData as AniDataItem[]) || []).map((a) => ({
      id: a.finder || "",
      title: a.Name || "Untitled",
      url: "",
      image: fixImageUrl(a.ImagePath || a.Image),
      subOrDub: "sub",
    }));
    const healed = await healAnimeList(results);
    return {
      currentPage: data.currentPage || page,
      hasNextPage: healed.length > 0,
      results: healed,
    };
  } catch {
    return { currentPage: page, hasNextPage: false, results: [] };
  }
}

const anilistIdCache = new Map<string, number | null>();

export async function resolveAniListId(
  title: string,
  synonyms?: string,
  slug?: string
): Promise<number | undefined> {
  const cacheKey = (title || slug || "").toLowerCase().trim();
  if (!cacheKey) return undefined;
  if (anilistIdCache.has(cacheKey)) {
    const val = anilistIdCache.get(cacheKey);
    return val ?? undefined;
  }

  const cleanTitle = title
    .replace(/\(TV\)/gi, "")
    .replace(/\(Dub\)/gi, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*-\s*Season\s*\d+/gi, "")
    .trim();

  const candidates = [
    title.trim(),
    cleanTitle,
    synonyms?.trim(),
    slug ? slug.replace(/-/g, " ").trim() : "",
  ].filter((c): c is string => Boolean(c && c.length > 1));

  const unique = [...new Set(candidates)];

  for (const query of unique) {
    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: `
            query ($search: String) {
              Media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
                id
              }
            }
          `,
          variables: { search: query },
        }),
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const json = await res.json();
        const alId = json?.data?.Media?.id;
        if (typeof alId === "number" && alId > 0) {
          anilistIdCache.set(cacheKey, alId);
          return alId;
        }
      }
    } catch {
      // Continue to next candidate
    }

    // Fallback to Kitsu mappings if AniList is down or rate-limited
    try {
      const kitsuRes = await fetch(
        `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=1`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (kitsuRes.ok) {
        const kitsuData = await kitsuRes.json();
        const kitsuId = kitsuData?.data?.[0]?.id;
        if (kitsuId) {
          const mapRes = await fetch(`https://kitsu.io/api/edge/anime/${kitsuId}/mappings`, {
            signal: AbortSignal.timeout(3000),
          });
          if (mapRes.ok) {
            const mapJson = await mapRes.json();
            const anilistMap = (mapJson?.data || []).find(
              (m: { attributes?: { externalSite?: string; externalId?: string } }) =>
                m.attributes?.externalSite === "anilist/anime"
            );
            const rawId = anilistMap?.attributes?.externalId;
            const alId = rawId ? parseInt(rawId, 10) : undefined;
            if (typeof alId === "number" && alId > 0) {
              anilistIdCache.set(cacheKey, alId);
              return alId;
            }
          }
        }
      }
    } catch {
      // Continue
    }
  }

  anilistIdCache.set(cacheKey, null);
  return undefined;
}

export async function animeKaiInfo(id: string): Promise<AnimeKaiInfo> {
  const res = await fetch(`${ANIPUB_API}/api/info/${id}`);
  if (!res.ok) {
    throw new AnimeKaiError("Anime not found", res.status);
  }
  const data = await res.json();

  const epCount = data.epCount || 0;
  const episodes: AnimeKaiEpisode[] = [];
  for (let i = 1; i <= epCount; i++) {
    episodes.push({
      id: `${data._id}-ep-${i}`,
      number: i,
      title: `Episode ${i}`,
      url: "",
    });
  }

  let alID: number | undefined = undefined;
  if (typeof data.alID === "number" && data.alID > 0) {
    alID = data.alID;
  } else if (typeof data.anilistId === "number" && data.anilistId > 0) {
    alID = data.anilistId;
  } else {
    alID = await resolveAniListId(data.Name || "", data.Synonyms, data.finder || id);
  }

  let resolvedImage = fixImageUrl(data.ImagePath);
  let bannerImage: string | undefined = undefined;
  if (isBrokenImageUrl(resolvedImage)) {
    const kitsu = await resolveKitsuMedia(data.Name || "");
    if (kitsu.poster) resolvedImage = kitsu.poster;
    if (kitsu.banner) bannerImage = kitsu.banner;
  }

  return {
    id: data.finder || id,
    alID,
    malID: data.malID ? Number(data.malID) : undefined,
    title: data.Name,
    url: "",
    image: resolvedImage,
    bannerImage,
    description: data.DescripTion || "",
    genres: data.Genres || [],
    subOrDub: "sub",
    type: "TV",
    status: data.Status || "Ongoing",
    totalEpisodes: epCount,
    episodes,
  };
}

export async function animeKaiWatch(
  episodeId: string,
  server = "vidstreaming",
  category = "sub",
): Promise<AnimeKaiWatchResult> {
  const parts = episodeId.split("-ep-");
  const _id = parts[0];
  const epNum = parseInt(parts[1] || "1", 10);

  const res = await fetch(`${ANIPUB_API}/v1/api/details/${_id}`);
  if (!res.ok) {
    throw new AnimeKaiError("Failed to fetch streaming details", res.status);
  }
  const data = await res.json();

  let iframeSrc = "";
  if (data.local) {
    if (epNum === 1) {
      iframeSrc = data.local.link;
    } else if (data.local.ep && data.local.ep[epNum - 2]) {
      iframeSrc = data.local.ep[epNum - 2].link;
    }
  }

  if (iframeSrc.startsWith("src=")) {
    iframeSrc = iframeSrc.replace("src=", "");
  }

  if (!iframeSrc) {
    throw new AnimeKaiError("Episode link not found", 404);
  }

  if (iframeSrc.endsWith("/sub") || iframeSrc.endsWith("/dub")) {
    iframeSrc = iframeSrc.replace(/\/(sub|dub)$/, `/${category}`);
  }

  return {
    sources: [
      {
        url: iframeSrc,
        quality: "default",
        isM3U8: false,
        isIframe: true,
      },
    ],
  };
}

export async function animeKaiPopular(page = 1, limitSlice = 36): Promise<AnimeKaiListItem[]> {
  try {
    const pagesToFetch = limitSlice > 10 ? [page, page + 1, page + 2, page + 3] : [page];
    const responses = await Promise.allSettled(
      pagesToFetch.map((p) =>
        fetch(`${ANIPUB_API}/api/findbyrating?page=${p}`).then((r) => (r.ok ? r.json() : null))
      )
    );
    const allItems: AniDataItem[] = [];
    for (const r of responses) {
      if (r.status === "fulfilled" && r.value?.AniData) {
        allItems.push(...r.value.AniData);
      }
    }
    const seen = new Set<string>();
    const deduped: AniDataItem[] = [];
    for (const item of allItems) {
      const key = item.finder || item.Name || "";
      if (key && !seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }
    const mapped = deduped.slice(0, limitSlice).map((a) => ({
      id: a.finder || "",
      title: a.Name || "Untitled",
      url: "",
      image: fixImageUrl(a.ImagePath || a.Image),
    }));
    return await healAnimeList(mapped);
  } catch {
    return [];
  }
}

export async function animeKaiRecent(page = 1, limitSlice = 36): Promise<AnimeKaiListItem[]> {
  return animeKaiPopular(page, limitSlice);
}

export async function animeKaiTopAiring(page = 1, limitSlice = 36): Promise<AnimeKaiListItem[]> {
  return animeKaiPopular(page, limitSlice);
}

