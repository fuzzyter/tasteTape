import type { MediaType } from "@prisma/client";
import { prisma } from "./prisma.js";

export type TasteStats = {
  byMedia: Array<{
    mediaType: MediaType;
    count: number;
    avgRating: number;
  }>;
  genreStars: Array<{
    genre: string;
    totalStars: number;
    count: number;
    avgRating: number;
  }>;
  topGenresByAvg: Array<{ genre: string; avgRating: number; count: number }>;
  bottomGenresByAvg: Array<{ genre: string; avgRating: number; count: number }>;
  ratingHistogram: Record<number, number>;
  yearHistogram: Array<{ year: number; count: number; avgRating: number }>;
};

export async function computeTasteStats(userId: string): Promise<TasteStats> {
  const rows = await prisma.userWorkRating.findMany({
    where: { userId },
    include: { workCache: true },
  });

  const byMediaMap = new Map<MediaType, { sum: number; n: number }>();
  const genreAgg = new Map<string, { sum: number; n: number }>();
  const hist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const yearMap = new Map<number, { sum: number; n: number }>();

  for (const r of rows) {
    const m = r.workCache.mediaType;
    const cur = byMediaMap.get(m) ?? { sum: 0, n: 0 };
    cur.sum += r.rating;
    cur.n += 1;
    byMediaMap.set(m, cur);

    hist[r.rating] = (hist[r.rating] ?? 0) + 1;

    for (const g of r.workCache.genres) {
      const gg = genreAgg.get(g) ?? { sum: 0, n: 0 };
      gg.sum += r.rating;
      gg.n += 1;
      genreAgg.set(g, gg);
    }

    const y = r.workCache.year;
    if (y != null) {
      const yy = yearMap.get(y) ?? { sum: 0, n: 0 };
      yy.sum += r.rating;
      yy.n += 1;
      yearMap.set(y, yy);
    }
  }

  const byMedia = [...byMediaMap.entries()].map(([mediaType, v]) => ({
    mediaType,
    count: v.n,
    avgRating: Math.round((v.sum / v.n) * 10) / 10,
  }));

  const genreStars = [...genreAgg.entries()].map(([genre, v]) => ({
    genre,
    totalStars: v.sum,
    count: v.n,
    avgRating: Math.round((v.sum / v.n) * 10) / 10,
  }));

  const genreAvgs = genreStars.filter((g) => g.count >= 1);
  const topGenresByAvg = [...genreAvgs]
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 8);
  const bottomGenresByAvg = [...genreAvgs]
    .sort((a, b) => a.avgRating - b.avgRating)
    .slice(0, 8);

  const yearHistogram = [...yearMap.entries()]
    .map(([year, v]) => ({
      year,
      count: v.n,
      avgRating: Math.round((v.sum / v.n) * 10) / 10,
    }))
    .sort((a, b) => a.year - b.year)
    .slice(-24);

  return {
    byMedia,
    genreStars: genreStars.sort((a, b) => b.totalStars - a.totalStars).slice(0, 20),
    topGenresByAvg,
    bottomGenresByAvg,
    ratingHistogram: hist,
    yearHistogram,
  };
}
