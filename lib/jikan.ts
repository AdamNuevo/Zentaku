import type { JikanMangaListEntry, JikanPagination } from "./types";
import { malGetTopManga, malSearchManga, malGetMangaById } from "./mal";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const MANGADEX_BASE = "https://api.mangadex.org";

export class JikanError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "JikanError";
    this.status = status;
  }
}

// Built-in resilient catalog in case Jikan (MyAnimeList) and third-party APIs return 504 Gateway Timeout
export const FALLBACK_MANGA: JikanMangaListEntry[] = [
  {
    mal_id: 13,
    title: "One Piece",
    title_english: "One Piece",
    images: {
      jpg: {
        image_url: "https://cdn.myanimelist.net/images/manga/2/253146l.jpg",
        small_image_url: "https://cdn.myanimelist.net/images/manga/2/253146.jpg",
        large_image_url: "https://cdn.myanimelist.net/images/manga/2/253146l.jpg",
      },
      webp: {
        image_url: "https://cdn.myanimelist.net/images/manga/2/253146l.webp",
        small_image_url: "https://cdn.myanimelist.net/images/manga/2/253146.webp",
        large_image_url: "https://cdn.myanimelist.net/images/manga/2/253146l.webp",
      },
    },
    score: 9.22,
    chapters: 1100,
    genres: [{ mal_id: 1, name: "Action" }, { mal_id: 2, name: "Adventure" }],
  },
  {
    mal_id: 2,
    title: "Berserk",
    title_english: "Berserk",
    images: {
      jpg: {
        image_url: "https://cdn.myanimelist.net/images/manga/1/157897l.jpg",
        small_image_url: "https://cdn.myanimelist.net/images/manga/1/157897.jpg",
        large_image_url: "https://cdn.myanimelist.net/images/manga/1/157897l.jpg",
      },
      webp: {
        image_url: "https://cdn.myanimelist.net/images/manga/1/157897l.webp",
        small_image_url: "https://cdn.myanimelist.net/images/manga/1/157897.webp",
        large_image_url: "https://cdn.myanimelist.net/images/manga/1/157897l.webp",
      },
    },
    score: 9.47,
    chapters: 375,
    genres: [{ mal_id: 1, name: "Action" }, { mal_id: 10, name: "Dark Fantasy" }],
  },
  {
    mal_id: 116778,
    title: "Chainsaw Man",
    title_english: "Chainsaw Man",
    images: {
      jpg: {
        image_url: "https://cdn.myanimelist.net/images/manga/3/216464l.jpg",
        small_image_url: "https://cdn.myanimelist.net/images/manga/3/216464.jpg",
        large_image_url: "https://cdn.myanimelist.net/images/manga/3/216464l.jpg",
      },
      webp: {
        image_url: "https://cdn.myanimelist.net/images/manga/3/216464l.webp",
        small_image_url: "https://cdn.myanimelist.net/images/manga/3/216464.webp",
        large_image_url: "https://cdn.myanimelist.net/images/manga/3/216464l.webp",
      },
    },
    score: 8.71,
    chapters: 160,
    genres: [{ mal_id: 1, name: "Action" }, { mal_id: 14, name: "Supernatural" }],
  },
  {
    mal_id: 113138,
    title: "Jujutsu Kaisen",
    title_english: "Jujutsu Kaisen",
    images: {
      jpg: {
        image_url: "https://cdn.myanimelist.net/images/manga/3/242205l.jpg",
        small_image_url: "https://cdn.myanimelist.net/images/manga/3/242205.jpg",
        large_image_url: "https://cdn.myanimelist.net/images/manga/3/242205l.jpg",
      },
      webp: {
        image_url: "https://cdn.myanimelist.net/images/manga/3/242205l.webp",
        small_image_url: "https://cdn.myanimelist.net/images/manga/3/242205.webp",
        large_image_url: "https://cdn.myanimelist.net/images/manga/3/242205l.webp",
      },
    },
    score: 8.48,
    chapters: 271,
    genres: [{ mal_id: 1, name: "Action" }, { mal_id: 37, name: "Supernatural" }],
  },
  {
    mal_id: 119161,
    title: "Spy x Family",
    title_english: "Spy x Family",
    images: {
      jpg: {
        image_url: "https://cdn.myanimelist.net/images/manga/3/219741l.jpg",
        small_image_url: "https://cdn.myanimelist.net/images/manga/3/219741.jpg",
        large_image_url: "https://cdn.myanimelist.net/images/manga/3/219741l.jpg",
      },
      webp: {
        image_url: "https://cdn.myanimelist.net/images/manga/3/219741l.webp",
        small_image_url: "https://cdn.myanimelist.net/images/manga/3/219741.webp",
        large_image_url: "https://cdn.myanimelist.net/images/manga/3/219741l.webp",
      },
    },
    score: 8.56,
    chapters: 95,
    genres: [{ mal_id: 4, name: "Comedy" }, { mal_id: 1, name: "Action" }],
  },
  {
    mal_id: 135496,
    title: "Dandadan",
    title_english: "Dandadan",
    images: {
      jpg: {
        image_url: "https://cdn.myanimelist.net/images/manga/2/248747l.jpg",
        small_image_url: "https://cdn.myanimelist.net/images/manga/2/248747.jpg",
        large_image_url: "https://cdn.myanimelist.net/images/manga/2/248747l.jpg",
      },
      webp: {
        image_url: "https://cdn.myanimelist.net/images/manga/2/248747l.webp",
        small_image_url: "https://cdn.myanimelist.net/images/manga/2/248747.webp",
        large_image_url: "https://cdn.myanimelist.net/images/manga/2/248747l.webp",
      },
    },
    score: 8.42,
    chapters: 155,
    genres: [{ mal_id: 1, name: "Action" }, { mal_id: 24, name: "Sci-Fi" }],
  },
  {
    mal_id: 121496,
    title: "Solo Leveling",
    title_english: "Solo Leveling",
    images: {
      jpg: {
        image_url: "https://cdn.myanimelist.net/images/manga/3/222295l.jpg",
        small_image_url: "https://cdn.myanimelist.net/images/manga/3/222295.jpg",
        large_image_url: "https://cdn.myanimelist.net/images/manga/3/222295l.jpg",
      },
      webp: {
        image_url: "https://cdn.myanimelist.net/images/manga/3/222295l.webp",
        small_image_url: "https://cdn.myanimelist.net/images/manga/3/222295.webp",
        large_image_url: "https://cdn.myanimelist.net/images/manga/3/222295l.webp",
      },
    },
    score: 8.68,
    chapters: 200,
    genres: [{ mal_id: 1, name: "Action" }, { mal_id: 10, name: "Fantasy" }],
  },
  {
    mal_id: 114792,
    title: "Blue Lock",
    title_english: "Blue Lock",
    images: {
      jpg: {
        image_url: "https://cdn.myanimelist.net/images/manga/1/220790l.jpg",
        small_image_url: "https://cdn.myanimelist.net/images/manga/1/220790.jpg",
        large_image_url: "https://cdn.myanimelist.net/images/manga/1/220790l.jpg",
      },
      webp: {
        image_url: "https://cdn.myanimelist.net/images/manga/1/220790l.webp",
        small_image_url: "https://cdn.myanimelist.net/images/manga/1/220790.webp",
        large_image_url: "https://cdn.myanimelist.net/images/manga/1/220790l.webp",
      },
    },
    score: 8.35,
    chapters: 260,
    genres: [{ mal_id: 30, name: "Sports" }],
  },
];

async function jikanFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${JIKAN_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000), // Max 3s wait, don't hang on 504s
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type MangaDexRelationship = {
  id?: string;
  type?: string;
  attributes?: {
    fileName?: string;
  };
};

type MangaDexTag = {
  attributes?: {
    group?: string;
    name?: Record<string, string>;
  };
};

type MangaDexItem = {
  id: string;
  attributes?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    tags?: MangaDexTag[];
  };
  relationships?: MangaDexRelationship[];
};

type MangaDexListResponse = {
  data?: MangaDexItem[];
};

type MangaDexSingleResponse = {
  data?: MangaDexItem;
};

// Open-source MangaDex API integration
async function fetchMangaDexList(queryPath: string): Promise<JikanMangaListEntry[]> {
  try {
    const res = await fetch(`${MANGADEX_BASE}${queryPath}`, {
      headers: { Accept: "application/json", "User-Agent": "Zentaku/1.0" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as MangaDexListResponse;
    const list: JikanMangaListEntry[] = (json.data || []).map((m) => {
      const coverRel = (m.relationships || []).find((r) => r.type === "cover_art");
      const coverFile = coverRel?.attributes?.fileName;
      const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}` : null;
      const title =
        m.attributes?.title?.en ||
        m.attributes?.title?.["ja-ro"] ||
        m.attributes?.title?.["ko-ro"] ||
        m.attributes?.title?.["zh-ro"] ||
        (m.attributes?.title ? Object.values(m.attributes.title)[0] : null) ||
        "Manga Title";

      return {
        mal_id: m.id,
        title,
        title_english: title,
        images: {
          jpg: { image_url: coverUrl, small_image_url: coverUrl, large_image_url: coverUrl },
          webp: { image_url: coverUrl, small_image_url: coverUrl, large_image_url: coverUrl },
        },
        score: null,
        chapters: null,
        genres: (m.attributes?.tags || [])
          .filter((t) => t.attributes?.group === "genre")
          .map((t) => ({ mal_id: 1, name: t.attributes?.name?.en || "Manga" })),
      };
    });
    return list;
  } catch {
    return [];
  }
}

export async function getTopManga(limit = 10): Promise<JikanMangaListEntry[]> {
  // 1. Direct Official MyAnimeList API v2 (if MAL_CLIENT_ID configured)
  const mal = await malGetTopManga(limit);
  if (mal?.length) {
    return mal;
  }

  // 2. Jikan API
  const jikan = await jikanFetch<JikanPagination<JikanMangaListEntry[]>>(`/top/manga?limit=${limit}`);
  if (jikan?.data?.length) {
    return jikan.data;
  }

  // 3. Fallback to MangaDex open-source API
  const md = await fetchMangaDexList(
    `/manga?limit=${limit}&order[followedCount]=desc&contentRating[]=safe&includes[]=cover_art`,
  );
  if (md.length) {
    return md;
  }

  // 4. Offline Curated Fallback
  return FALLBACK_MANGA.slice(0, limit);
}

export async function getRecentMangaUpdates(limit = 12): Promise<JikanMangaListEntry[]> {
  // 1. Direct Official MyAnimeList API v2 (if configured)
  const mal = await malGetTopManga(limit);
  if (mal?.length) {
    return mal;
  }

  // 2. Jikan API
  const jikan = await jikanFetch<JikanPagination<JikanMangaListEntry[]>>(
    `/manga?status=publishing&order_by=members&sort=desc&limit=${limit}`,
  );
  if (jikan?.data?.length) {
    return jikan.data;
  }

  // 3. Fallback to MangaDex
  const md = await fetchMangaDexList(
    `/manga?limit=${limit}&order[latestUploadedChapter]=desc&contentRating[]=safe&includes[]=cover_art`,
  );
  if (md.length) {
    return md;
  }

  return FALLBACK_MANGA.slice(0, limit);
}

export async function searchManga(query: string, limit = 20): Promise<JikanMangaListEntry[]> {
  const q = query.trim();
  if (!q) return getTopManga(limit);

  // 1. Direct Official MyAnimeList API v2 (if configured)
  const mal = await malSearchManga(q, limit);
  if (mal?.length) {
    return mal;
  }

  // 2. Jikan API
  const encoded = encodeURIComponent(q);
  const jikan = await jikanFetch<JikanPagination<JikanMangaListEntry[]>>(
    `/manga?q=${encoded}&limit=${limit}`,
  );
  if (jikan?.data?.length) {
    return jikan.data;
  }

  // 3. Fallback to MangaDex search
  const md = await fetchMangaDexList(
    `/manga?title=${encoded}&limit=${limit}&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art`,
  );
  if (md.length) {
    return md;
  }

  return FALLBACK_MANGA.filter((m) =>
    m.title.toLowerCase().includes(q.toLowerCase()),
  );
}

export async function getMangaById(id: number | string) {
  const strId = String(id);
  const isNumeric = /^\d+$/.test(strId);

  if (isNumeric) {
    const numId = Number(strId);

    // 1. Direct Official MyAnimeList API v2 (if configured)
    const mal = await malGetMangaById(numId);
    if (mal) {
      return mal;
    }

    // 2. Jikan API
    const jikan = await jikanFetch<{
      data: JikanMangaListEntry & {
        synopsis: string | null;
        genres: { mal_id: number; name: string }[];
        chapters: number | null;
        volumes: number | null;
      };
    }>(`/manga/${numId}/full`);
    if (jikan?.data) {
      return jikan.data;
    }

    const matched = FALLBACK_MANGA.find((m) => String(m.mal_id) === strId);
    if (matched) {
      return {
        ...matched,
        synopsis: "An acclaimed manga series following unforgettable journeys and captivating battles.",
        volumes: null,
      };
    }
  }

  // 3. Direct MangaDex UUID lookup
  try {
    const res = await fetch(`${MANGADEX_BASE}/manga/${strId}?includes[]=cover_art`, {
      headers: { Accept: "application/json", "User-Agent": "Zentaku/1.0" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4500),
    });
    if (res.ok) {
      const json = (await res.json()) as MangaDexSingleResponse;
      const m = json.data;
      if (m) {
        const coverRel = (m.relationships || []).find((r) => r.type === "cover_art");
        const coverFile = coverRel?.attributes?.fileName;
        const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}` : null;
        const title =
          m.attributes?.title?.en ||
          m.attributes?.title?.["ja-ro"] ||
          m.attributes?.title?.["ko-ro"] ||
          m.attributes?.title?.["zh-ro"] ||
          (m.attributes?.title ? Object.values(m.attributes.title)[0] : null) ||
          "Manga Title";

        return {
          mal_id: m.id,
          title,
          title_english: title,
          images: {
            jpg: { image_url: coverUrl, small_image_url: coverUrl, large_image_url: coverUrl },
            webp: { image_url: coverUrl, small_image_url: coverUrl, large_image_url: coverUrl },
          },
          score: null,
          chapters: null,
          volumes: null,
          synopsis: m.attributes?.description?.en || "No synopsis available for this title.",
          genres: (m.attributes?.tags || [])
            .filter((t) => t.attributes?.group === "genre")
            .map((t) => ({ mal_id: 1, name: t.attributes?.name?.en || "Manga" })),
        };
      }
    }
  } catch {
    // ignore
  }

  const fallbackFirst = FALLBACK_MANGA[0];
  return {
    ...fallbackFirst,
    synopsis: "An acclaimed manga series following unforgettable journeys and captivating battles.",
    volumes: null,
  };
}

export async function getTopManhwa(limit = 24): Promise<JikanMangaListEntry[]> {
  const md = await fetchMangaDexList(
    `/manga?limit=${limit}&originalLanguage[]=ko&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art`,
  );
  if (md.length) return md;
  return FALLBACK_MANGA.slice(0, limit);
}

export async function searchManhwa(q: string, limit = 24): Promise<JikanMangaListEntry[]> {
  const query = encodeURIComponent(q.trim());
  const md = await fetchMangaDexList(
    `/manga?title=${query}&limit=${limit}&originalLanguage[]=ko&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art`,
  );
  if (md.length) return md;
  return searchManga(q, limit);
}

export async function getTopManhua(limit = 24): Promise<JikanMangaListEntry[]> {
  const md = await fetchMangaDexList(
    `/manga?limit=${limit}&originalLanguage[]=zh&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art`,
  );
  if (md.length) return md;
  return FALLBACK_MANGA.slice(0, limit);
}

export async function searchManhua(q: string, limit = 24): Promise<JikanMangaListEntry[]> {
  const query = encodeURIComponent(q.trim());
  const md = await fetchMangaDexList(
    `/manga?title=${query}&limit=${limit}&originalLanguage[]=zh&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art`,
  );
  if (md.length) return md;
  return searchManga(q, limit);
}


