import type { JikanMangaListEntry } from "./types";

const MAL_API_BASE = "https://api.myanimelist.net/v2";

type MalNode = {
  id: number;
  title: string;
  main_picture?: {
    medium?: string;
    large?: string;
  };
};

type MalRankingItem = {
  node: MalNode;
};

type MalRankingResponse = {
  data: MalRankingItem[];
};

type MalMangaDetail = {
  id: number;
  title: string;
  main_picture?: {
    medium?: string;
    large?: string;
  };
  alternative_titles?: {
    en?: string;
    ja?: string;
  };
  synopsis?: string;
  mean?: number;
  num_chapters?: number;
  num_volumes?: number;
  genres?: { id: number; name: string }[];
};

function getClientId(): string | null {
  return process.env.MAL_CLIENT_ID || null;
}

async function malFetch<T>(endpoint: string): Promise<T | null> {
  const clientId = getClientId();
  if (!clientId) return null;

  try {
    const res = await fetch(`${MAL_API_BASE}${endpoint}`, {
      headers: {
        "X-MAL-CLIENT-ID": clientId,
        Accept: "application/json",
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4500),
    });

    if (!res.ok) {
      console.warn(`MAL API v2 returned status: ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn("MAL API v2 request failed:", err);
    return null;
  }
}

function mapNodeToEntry(node: MalNode): JikanMangaListEntry {
  const pic = node.main_picture?.large || node.main_picture?.medium || null;
  return {
    mal_id: node.id,
    title: node.title,
    title_english: node.title,
    images: {
      jpg: { image_url: pic, small_image_url: pic, large_image_url: pic },
      webp: { image_url: pic, small_image_url: pic, large_image_url: pic },
    },
    score: null,
    chapters: null,
  };
}

export async function malGetTopManga(limit = 10): Promise<JikanMangaListEntry[] | null> {
  const json = await malFetch<MalRankingResponse>(
    `/manga/ranking?ranking_type=all&limit=${limit}`,
  );
  if (!json?.data?.length) return null;
  return json.data.map((item) => mapNodeToEntry(item.node));
}

export async function malSearchManga(query: string, limit = 20): Promise<JikanMangaListEntry[] | null> {
  const q = encodeURIComponent(query.slice(0, 100));
  const json = await malFetch<MalRankingResponse>(`/manga?q=${q}&limit=${limit}`);
  if (!json?.data?.length) return null;
  return json.data.map((item) => mapNodeToEntry(item.node));
}

export async function malGetMangaById(id: number) {
  const fields =
    "id,title,main_picture,alternative_titles,synopsis,mean,rank,genres,num_volumes,num_chapters";
  const m = await malFetch<MalMangaDetail>(`/manga/${id}?fields=${fields}`);
  if (!m) return null;

  const pic = m.main_picture?.large || m.main_picture?.medium || null;
  return {
    mal_id: m.id,
    title: m.title,
    title_english: m.alternative_titles?.en || m.title,
    images: {
      jpg: { image_url: pic, small_image_url: pic, large_image_url: pic },
      webp: { image_url: pic, small_image_url: pic, large_image_url: pic },
    },
    score: m.mean ?? null,
    chapters: m.num_chapters ?? null,
    volumes: m.num_volumes ?? null,
    synopsis: m.synopsis || "No synopsis available.",
    genres: (m.genres || []).map((g) => ({ mal_id: g.id, name: g.name })),
  };
}
