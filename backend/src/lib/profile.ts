import type { MediaType } from "@prisma/client";
import { prisma } from "./prisma.js";

export type TasteProfileJson = {
  summary: {
    totalRated: number;
    avgRating: number;
    byMedia: Record<string, number>;
    topGenres: Array<{ genre: string; weight: number }>;
    yearRange: { min: number | null; max: number | null };
    sampleTitles: string[];
  };
  items: Array<{
    title: string;
    mediaType: MediaType;
    rating: number;
    genres: string[];
    synopsis: string | null;
    originCountry: string | null;
    language: string | null;
    ageRating: string | null;
  }>;
};

export async function buildTasteProfile(userId: string): Promise<TasteProfileJson> {
  const ratings = await prisma.userWorkRating.findMany({
    where: { userId },
    include: { workCache: true },
    orderBy: { rating: "desc" },
  });

  const items = ratings.map((r) => ({
    title: r.workCache.title,
    mediaType: r.workCache.mediaType,
    rating: r.rating,
    genres: r.workCache.genres,
    synopsis: r.workCache.synopsis,
    originCountry: r.workCache.originCountry,
    language: r.workCache.language,
    ageRating: r.workCache.ageRating,
  }));

  const byMedia: Record<string, number> = {};
  const genreWeight = new Map<string, number>();
  let sum = 0;
  const years: number[] = [];
  const sampleTitles: string[] = [];

  for (const r of ratings) {
    sum += r.rating;
    const m = r.workCache.mediaType;
    byMedia[m] = (byMedia[m] ?? 0) + 1;
    for (const g of r.workCache.genres) {
      genreWeight.set(g, (genreWeight.get(g) ?? 0) + r.rating);
    }
    if (r.workCache.year != null) years.push(r.workCache.year);
    if (sampleTitles.length < 12) sampleTitles.push(r.workCache.title);
  }

  const topGenres = [...genreWeight.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([genre, weight]) => ({ genre, weight }));

  const n = ratings.length;
  return {
    summary: {
      totalRated: n,
      avgRating: n ? Math.round((sum / n) * 10) / 10 : 0,
      byMedia,
      topGenres,
      yearRange: {
        min: years.length ? Math.min(...years) : null,
        max: years.length ? Math.max(...years) : null,
      },
      sampleTitles,
    },
    items,
  };
}
