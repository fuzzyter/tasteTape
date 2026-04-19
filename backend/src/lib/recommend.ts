import { tmdbDiscoverMovies, tmdbDiscoverTv } from "../adapters/tmdb.js";
import { openLibrarySearch } from "../adapters/openlibrary.js";
import type { NormalizedWork } from "../types/normalized-work.js";
import type { TasteProfileJson } from "./profile.js";

export type RecFilters = {
  yearMin?: number;
  yearMax?: number;
  /** 비어 있으면 세 타입 모두 */
  mediaTypes?: Array<"book" | "movie" | "tv">;
};

function inYearRange(y: number | null, min?: number, max?: number): boolean {
  if (y == null) return true;
  if (min != null && y < min) return false;
  if (max != null && y > max) return false;
  return true;
}

export async function gatherRecommendationCandidates(
  profile: TasteProfileJson,
  filters: RecFilters = {}
): Promise<NormalizedWork[]> {
  const types =
    filters.mediaTypes && filters.mediaTypes.length > 0
      ? filters.mediaTypes
      : (["movie", "tv", "book"] as const);
  const out: NormalizedWork[] = [];
  const yMin = filters.yearMin;
  const yMax = filters.yearMax;

  if (types.includes("movie")) {
    const m1 = await tmdbDiscoverMovies({ page: 1, yearMin: yMin, yearMax: yMax });
    const m2 = await tmdbDiscoverMovies({ page: 2, yearMin: yMin, yearMax: yMax });
    out.push(...m1, ...m2);
  }
  if (types.includes("tv")) {
    const t1 = await tmdbDiscoverTv({ page: 1, yearMin: yMin, yearMax: yMax });
    const t2 = await tmdbDiscoverTv({ page: 2, yearMin: yMin, yearMax: yMax });
    out.push(...t1, ...t2);
  }
  if (types.includes("book")) {
    const keyword =
      profile.summary.topGenres[0]?.genre ??
      profile.summary.sampleTitles[0] ??
      "fiction";
    try {
      const books = await openLibrarySearch(keyword);
      const filtered = books.filter((b) => inYearRange(b.year, yMin, yMax));
      out.push(...filtered.slice(0, 30));
    } catch {
      /* ignore */
    }
  }

  const seen = new Set<string>();
  const dedup: NormalizedWork[] = [];
  for (const w of out) {
    const k = `${w.externalRef.provider}:${w.externalRef.id}:${w.mediaType}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(w);
  }
  return dedup;
}
