import type { NormalizedWork } from "../types/normalized-work.js";

const BASE = "https://api.themoviedb.org/3";

function getKey(): string {
  const k = process.env.TMDB_API_KEY;
  if (!k) throw new Error("TMDB_API_KEY is not set");
  return k;
}

type TmdbGenre = { id: number; name: string };

async function getJson<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", getKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w342${path}`;
}

export async function tmdbSearchMovie(query: string): Promise<NormalizedWork[]> {
  const data = await getJson<{
    results: Array<{
      id: number;
      title: string;
      release_date?: string;
      poster_path?: string | null;
      overview?: string;
    }>;
  }>("/search/movie", { query });
  return (data.results ?? []).slice(0, 15).map((r) => ({
    mediaType: "movie" as const,
    title: r.title,
    year: r.release_date ? parseInt(r.release_date.slice(0, 4), 10) : null,
    genres: [],
    synopsis: r.overview?.trim() || null,
    originCountry: null,
    language: null,
    ageRating: null,
    externalRef: { provider: "tmdb", id: String(r.id) },
    posterOrCoverUrl: posterUrl(r.poster_path ?? null),
  }));
}

export async function tmdbSearchTv(query: string): Promise<NormalizedWork[]> {
  const data = await getJson<{
    results: Array<{
      id: number;
      name: string;
      first_air_date?: string;
      poster_path?: string | null;
      overview?: string;
    }>;
  }>("/search/tv", { query });
  return (data.results ?? []).slice(0, 15).map((r) => ({
    mediaType: "tv" as const,
    title: r.name,
    year: r.first_air_date ? parseInt(r.first_air_date.slice(0, 4), 10) : null,
    genres: [],
    synopsis: r.overview?.trim() || null,
    originCountry: null,
    language: null,
    ageRating: null,
    externalRef: { provider: "tmdb", id: String(r.id) },
    posterOrCoverUrl: posterUrl(r.poster_path ?? null),
  }));
}

export async function tmdbMovieDetail(id: string): Promise<NormalizedWork> {
  const m = await getJson<{
    id: number;
    title: string;
    release_date?: string;
    genres: TmdbGenre[];
    overview?: string;
    poster_path?: string | null;
    origin_country?: string[];
    spoken_languages?: Array<{ iso_639_1: string; name: string }>;
  }>(`/movie/${id}`);

  return {
    mediaType: "movie",
    title: m.title,
    year: m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : null,
    genres: (m.genres ?? []).map((g) => g.name),
    synopsis: m.overview?.trim() || null,
    originCountry: m.origin_country?.[0] ?? null,
    language: m.spoken_languages?.[0]?.name ?? null,
    ageRating: null,
    externalRef: { provider: "tmdb", id: String(m.id) },
    posterOrCoverUrl: posterUrl(m.poster_path ?? null),
  };
}

export async function tmdbTvDetail(id: string): Promise<NormalizedWork> {
  const m = await getJson<{
    id: number;
    name: string;
    first_air_date?: string;
    genres: TmdbGenre[];
    overview?: string;
    poster_path?: string | null;
    origin_country?: string[];
    spoken_languages?: Array<{ iso_639_1: string; name: string }>;
  }>(`/tv/${id}`);

  return {
    mediaType: "tv",
    title: m.name,
    year: m.first_air_date ? parseInt(m.first_air_date.slice(0, 4), 10) : null,
    genres: (m.genres ?? []).map((g) => g.name),
    synopsis: m.overview?.trim() || null,
    originCountry: m.origin_country?.[0] ?? null,
    language: m.spoken_languages?.[0]?.name ?? null,
    ageRating: null,
    externalRef: { provider: "tmdb", id: String(m.id) },
    posterOrCoverUrl: posterUrl(m.poster_path ?? null),
  };
}

function yearToDateRange(yearMin?: number, yearMax?: number): { gte?: string; lte?: string } {
  if (yearMin == null && yearMax == null) return {};
  return {
    gte: yearMin != null ? `${yearMin}-01-01` : undefined,
    lte: yearMax != null ? `${yearMax}-12-31` : undefined,
  };
}

/** Discover popular movies as recommendation candidates */
export async function tmdbDiscoverMovies(opts: {
  withGenres?: string;
  page?: number;
  yearMin?: number;
  yearMax?: number;
}): Promise<NormalizedWork[]> {
  const params: Record<string, string> = {
    sort_by: "popularity.desc",
    page: String(opts.page ?? 1),
    include_adult: "false",
  };
  if (opts.withGenres) params.with_genres = opts.withGenres;
  const dr = yearToDateRange(opts.yearMin, opts.yearMax);
  if (dr.gte) params["primary_release_date.gte"] = dr.gte;
  if (dr.lte) params["primary_release_date.lte"] = dr.lte;
  const data = await getJson<{
    results: Array<{
      id: number;
      title: string;
      release_date?: string;
      genre_ids: number[];
      overview?: string;
      poster_path?: string | null;
    }>;
  }>("/discover/movie", params);
  return (data.results ?? []).map((r) => ({
    mediaType: "movie" as const,
    title: r.title,
    year: r.release_date ? parseInt(r.release_date.slice(0, 4), 10) : null,
    genres: [],
    synopsis: r.overview?.trim() || null,
    originCountry: null,
    language: null,
    ageRating: null,
    externalRef: { provider: "tmdb", id: String(r.id) },
    posterOrCoverUrl: posterUrl(r.poster_path ?? null),
  }));
}

export async function tmdbDiscoverTv(opts: {
  page?: number;
  yearMin?: number;
  yearMax?: number;
}): Promise<NormalizedWork[]> {
  const params: Record<string, string> = {
    sort_by: "popularity.desc",
    page: String(opts.page ?? 1),
    include_adult: "false",
  };
  const dr = yearToDateRange(opts.yearMin, opts.yearMax);
  if (dr.gte) params["first_air_date.gte"] = dr.gte;
  if (dr.lte) params["first_air_date.lte"] = dr.lte;
  const data = await getJson<{
    results: Array<{
      id: number;
      name: string;
      first_air_date?: string;
      overview?: string;
      poster_path?: string | null;
    }>;
  }>("/discover/tv", params);
  return (data.results ?? []).map((r) => ({
    mediaType: "tv" as const,
    title: r.name,
    year: r.first_air_date ? parseInt(r.first_air_date.slice(0, 4), 10) : null,
    genres: [],
    synopsis: r.overview?.trim() || null,
    originCountry: null,
    language: null,
    ageRating: null,
    externalRef: { provider: "tmdb", id: String(r.id) },
    posterOrCoverUrl: posterUrl(r.poster_path ?? null),
  }));
}
