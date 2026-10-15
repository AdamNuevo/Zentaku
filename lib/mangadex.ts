const BASE = "https://api.mangadex.org";

const init: RequestInit & { next?: { revalidate: number } } = {
  next: { revalidate: 120 },
  headers: { Accept: "application/json", "User-Agent": "Zentaku/1.0" },
};

export class MangaDexError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MangaDexError";
    this.status = status;
  }
}

async function mdJson<T>(path: string, retries = 2, delay = 800): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (res.status === 429 && retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return mdJson<T>(path, retries - 1, delay * 2);
  }
  if (!res.ok) {
    throw new MangaDexError(`MangaDex request failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}

export type MangaDexChapterSummary = {
  id: string;
  attributes: {
    chapter: string | null;
    title: string | null;
    pages: number;
  };
};

function mangaDexTitle(attr: {
  title: Record<string, string> | string | null;
  altTitles?: Record<string, string>[];
}): string {
  const t = attr.title;
  if (typeof t === "string") return t;
  if (t) {
    const direct = t.en ?? t["ja-ro"] ?? Object.values(t)[0];
    if (direct) return direct;
  }
  if (Array.isArray(attr.altTitles)) {
    for (const alt of attr.altTitles) {
      if (alt.en) return alt.en;
    }
  }
  return "Manga Title";
}

export async function searchMangaByTitle(title: string) {
  const q = encodeURIComponent(title.slice(0, 120));
  try {
    const json = await mdJson<{
      data: { id: string; attributes: { title: Record<string, string>; altTitles?: Record<string, string>[] } }[];
    }>(`/manga?title=${q}&limit=5&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`);
    return json.data.map((d) => ({
      id: d.id,
      title: mangaDexTitle(d.attributes),
    }));
  } catch {
    return [];
  }
}

// Fallback provider via @consumet/extensions (MangaPill) to fetch complete 1000+ chapter archives
async function getMangaPillChapters(title: string): Promise<MangaDexChapterSummary[]> {
  try {
    const { MANGA } = await import("@consumet/extensions");
    const mp = new MANGA.MangaPill();
    const searchRes = await mp.search(title);
    if (!searchRes?.results?.length) return [];

    // Find best match
    const targetTitle = title.toLowerCase().trim();
    const match =
      searchRes.results.find((r) => {
        const raw = typeof r.title === "string" ? r.title : String(r.title ?? "");
        return raw.toLowerCase().trim() === targetTitle;
      }) || searchRes.results[0];

    const info = await mp.fetchMangaInfo(match.id);
    if (!info?.chapters?.length) return [];

    return info.chapters.map((c) => {
      const chNum = c.chapter != null ? String(c.chapter) : null;
      const chTitle = c.title != null ? String(c.title) : `Chapter ${chNum ?? ""}`;
      return {
        id: `mp__${encodeURIComponent(c.id)}`,
        attributes: {
          chapter: chNum,
          title: chTitle,
          pages: 0,
        },
      };
    });
  } catch {
    return [];
  }
}

export async function getMangaChapters(
  mangaDexMangaId?: string | null,
  limit = 500,
  mangaTitle?: string,
): Promise<MangaDexChapterSummary[]> {
  let mdChapters: MangaDexChapterSummary[] = [];

  if (mangaDexMangaId) {
    try {
      const json = await mdJson<{
        data: MangaDexChapterSummary[];
      }>(
        `/manga/${mangaDexMangaId}/feed?limit=${limit}&translatedLanguage[]=en&order[chapter]=asc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&includeExternalUrl=0`,
      );
      mdChapters = json.data || [];
    } catch {
      mdChapters = [];
    }
  }

  // Deduplicate MangaDex chapters that have the exact same chapter number
  const seenChapters = new Set<string>();
  const deduped: MangaDexChapterSummary[] = [];
  for (const c of mdChapters) {
    const key = c.attributes.chapter ? `ch-${c.attributes.chapter}` : c.id;
    if (seenChapters.has(key)) continue;
    seenChapters.add(key);
    deduped.push(c);
  }

  // If MangaDex has fewer than 25 chapters (common for licensed manga where publishers DMCA chapters 4-1000)
  // or if MangaDex ID was null, fetch complete scanlation chapters from MangaPill!
  if (mangaTitle && (deduped.length < 25 || !mangaDexMangaId)) {
    const pillChapters = await getMangaPillChapters(mangaTitle);
    if (pillChapters.length > deduped.length) {
      return pillChapters;
    }
  }

  return deduped;
}

export async function getAdjacentChapterIds(
  mangaDexMangaId?: string | null,
  currentChapterId?: string,
  mangaTitle?: string,
) {
  if (!currentChapterId) return { prev: null as string | null, next: null as string | null };
  const chapters = await getMangaChapters(mangaDexMangaId, 500, mangaTitle);
  const idx = chapters.findIndex((c) => c.id === currentChapterId);
  if (idx === -1) return { prev: null as string | null, next: null as string | null };
  return {
    prev: chapters[idx - 1]?.id ?? null,
    next: chapters[idx + 1]?.id ?? null,
  };
}

export type ChapterPageUrls = {
  urls: string[];
  chapterTitle: string | null;
};

export async function getChapterPageUrls(chapterId: string): Promise<ChapterPageUrls> {
  // Check if it's a MangaPill provider chapter
  if (chapterId.startsWith("mp__")) {
    const realId = decodeURIComponent(chapterId.replace("mp__", ""));
    const { MANGA } = await import("@consumet/extensions");
    const mp = new MANGA.MangaPill();
    const pages = await mp.fetchChapterPages(realId);
    return {
      urls: pages.map((p) => p.img),
      chapterTitle: `Chapter ${realId.split("chapter-")[1] || ""}`,
    };
  }

  // Standard MangaDex chapter lookup
  const [chapterRes, serverRes] = await Promise.all([
    fetch(`${BASE}/chapter/${chapterId}?includes[]=scanlation_group`, {
      ...init,
      next: { revalidate: 60 },
    }),
    fetch(`${BASE}/at-home/server/${chapterId}`, {
      ...init,
      next: { revalidate: 60 },
    }),
  ]);

  if (!chapterRes.ok) {
    throw new MangaDexError("Chapter not found", chapterRes.status);
  }
  if (!serverRes.ok) {
    throw new MangaDexError("Chapter images unavailable", serverRes.status);
  }

  const chapterJson = (await chapterRes.json()) as {
    data: {
      attributes: { title: string | null; chapter: string | null };
    };
  };
  const serverJson = (await serverRes.json()) as {
    baseUrl: string;
    chapter: { hash: string; data: string[] };
  };

  const { baseUrl, chapter } = serverJson;
  const urls = chapter.data.map(
    (filename) => `${baseUrl}/data/${chapter.hash}/${filename}`,
  );

  return {
    urls,
    chapterTitle:
      chapterJson.data.attributes.title ??
      (chapterJson.data.attributes.chapter
        ? `Chapter ${chapterJson.data.attributes.chapter}`
        : null),
  };
}
