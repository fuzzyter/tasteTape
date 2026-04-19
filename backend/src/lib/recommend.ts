import { tmdbDiscoverMovies } from "../adapters/tmdb.js";
import { openLibrarySearch } from "../adapters/openlibrary.js";
import type { NormalizedWork } from "../types/normalized-work.js";
import type { TasteProfileJson } from "./profile.js";

export async function gatherRecommendationCandidates(
  profile: TasteProfileJson
): Promise<NormalizedWork[]> {
  const out: NormalizedWork[] = [];
  const m1 = await tmdbDiscoverMovies({ page: 1 });
  const m2 = await tmdbDiscoverMovies({ page: 2 });
  out.push(...m1, ...m2);
  const keyword =
    profile.summary.topGenres[0]?.genre ??
    profile.summary.sampleTitles[0] ??
    "fiction";
  try {
    const books = await openLibrarySearch(keyword);
    out.push(...books.slice(0, 20));
  } catch {
    /* ignore book API errors */
  }
  return out;
}
