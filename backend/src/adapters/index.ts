import type { MediaType, NormalizedWork } from "../types/normalized-work.js";
import {
  openLibrarySearch,
  openLibraryWorkDetail,
} from "./openlibrary.js";
import {
  tmdbMovieDetail,
  tmdbSearchMovie,
  tmdbSearchTv,
  tmdbTvDetail,
} from "./tmdb.js";

export async function searchWorks(
  query: string,
  mediaType: MediaType
): Promise<NormalizedWork[]> {
  const q = query.trim();
  if (!q) return [];
  if (mediaType === "book") return openLibrarySearch(q);
  if (mediaType === "movie") return tmdbSearchMovie(q);
  return tmdbSearchTv(q);
}

export async function fetchWorkDetail(
  mediaType: MediaType,
  provider: string,
  externalId: string
): Promise<NormalizedWork> {
  if (mediaType === "book") {
    if (provider !== "openlibrary") {
      throw new Error(`Unsupported book provider: ${provider}`);
    }
    return openLibraryWorkDetail(externalId);
  }
  if (provider !== "tmdb") {
    throw new Error(`Unsupported ${mediaType} provider: ${provider}`);
  }
  if (mediaType === "movie") return tmdbMovieDetail(externalId);
  return tmdbTvDetail(externalId);
}

export { tmdbDiscoverMovies } from "./tmdb.js";
