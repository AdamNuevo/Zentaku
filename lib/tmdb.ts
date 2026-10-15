export class TMDBError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "TMDBError";
    this.status = status;
  }
}

/* ── Types ──────────────────────────────────────────────── */

export type TMDBMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  status?: string;
  tagline?: string;
};

export type TMDBTVShow = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
  seasons?: TMDBSeason[];
};

export type TMDBSeason = {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  episode_count: number;
  air_date: string | null;
};

export type TMDBEpisode = {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  vote_average: number;
  runtime: number | null;
};

export type TMDBPage<T> = {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
};

/* ── Constants ──────────────────────────────────────────── */

const BASE = "https://api.themoviedb.org/3";

function apiKey(): string {
  const key = process.env.TMDB_API_KEY ?? "";
  if (!key) throw new TMDBError("TMDB_API_KEY is not configured", 500);
  return key;
}

/* ── Image helpers ──────────────────────────────────────── */

export function tmdbImg(path: string | null | undefined, size = "w500"): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function tmdbBackdrop(path: string | null | undefined): string {
  return tmdbImg(path, "w1280");
}

/* ── Generic fetcher ────────────────────────────────────── */

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set("api_key", apiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new TMDBError(`TMDB API error: ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

/* ── Movies ─────────────────────────────────────────────── */

export async function getTrendingMovies(page = 1): Promise<TMDBPage<TMDBMovie>> {
  return tmdbFetch<TMDBPage<TMDBMovie>>("/trending/movie/week", { page: String(page) });
}

export async function getPopularMovies(page = 1): Promise<TMDBPage<TMDBMovie>> {
  return tmdbFetch<TMDBPage<TMDBMovie>>("/movie/popular", { page: String(page) });
}

export async function getTopRatedMovies(page = 1): Promise<TMDBPage<TMDBMovie>> {
  return tmdbFetch<TMDBPage<TMDBMovie>>("/movie/top_rated", { page: String(page) });
}

export async function searchMovies(query: string, page = 1): Promise<TMDBPage<TMDBMovie>> {
  return tmdbFetch<TMDBPage<TMDBMovie>>("/search/movie", { query, page: String(page) });
}

export async function getMovieDetails(id: number): Promise<TMDBMovie> {
  return tmdbFetch<TMDBMovie>(`/movie/${id}`);
}

export async function getSimilarMovies(id: number): Promise<TMDBPage<TMDBMovie>> {
  return tmdbFetch<TMDBPage<TMDBMovie>>(`/movie/${id}/similar`);
}

/* ── TV Shows ───────────────────────────────────────────── */

export async function getTrendingTV(page = 1): Promise<TMDBPage<TMDBTVShow>> {
  return tmdbFetch<TMDBPage<TMDBTVShow>>("/trending/tv/week", { page: String(page) });
}

export async function getPopularTV(page = 1): Promise<TMDBPage<TMDBTVShow>> {
  return tmdbFetch<TMDBPage<TMDBTVShow>>("/tv/popular", { page: String(page) });
}

export async function getTopRatedTV(page = 1): Promise<TMDBPage<TMDBTVShow>> {
  return tmdbFetch<TMDBPage<TMDBTVShow>>("/tv/top_rated", { page: String(page) });
}

export async function searchTV(query: string, page = 1): Promise<TMDBPage<TMDBTVShow>> {
  return tmdbFetch<TMDBPage<TMDBTVShow>>("/search/tv", { query, page: String(page) });
}

export async function getTVDetails(id: number): Promise<TMDBTVShow> {
  return tmdbFetch<TMDBTVShow>(`/tv/${id}`);
}

export async function getTVSeasonEpisodes(tvId: number, season: number): Promise<{ episodes: TMDBEpisode[] }> {
  return tmdbFetch<{ episodes: TMDBEpisode[] }>(`/tv/${tvId}/season/${season}`);
}

export async function getSimilarTV(id: number): Promise<TMDBPage<TMDBTVShow>> {
  return tmdbFetch<TMDBPage<TMDBTVShow>>(`/tv/${id}/similar`);
}

/* ── Genre maps (static, avoids extra API call) ─────────── */

export const MOVIE_GENRES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western",
};

export const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  10762: "Kids", 9648: "Mystery", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk",
  10768: "War & Politics", 37: "Western",
};
