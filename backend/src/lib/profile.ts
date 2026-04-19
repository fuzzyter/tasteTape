import type { MediaType, WorkCache } from "@prisma/client";
import { prisma } from "./prisma.js";


type UserWorkRatingWithWorkCache = {
  rating: number;
  reviewText: string | null;
  preferenceNote: string | null;
  workCache: WorkCache;
};

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
    preferenceNote: string | null;
    reviewText: string | null;
  }>;
};

export async function buildTasteProfile(userId: string): Promise<TasteProfileJson> {
  const ratings = (await prisma.userWorkRating.findMany({
    where: { userId },
    include: { workCache: true },
    orderBy: { rating: "desc" },
  })) as unknown as UserWorkRatingWithWorkCache[];

  const items = ratings.map((r) => ({
    title: r.workCache.title,
    mediaType: r.workCache.mediaType,
    rating: r.rating,
    genres: r.workCache.genres,
    synopsis: r.workCache.synopsis,
    originCountry: r.workCache.originCountry,
    language: r.workCache.language,
    ageRating: r.workCache.ageRating,
    preferenceNote: r.preferenceNote,
    reviewText: r.reviewText,
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

export async function buildRatedWorksRefs(userId: string, minRating = 3) {
  const rows = (await prisma.userWorkRating.findMany({
    where: { userId, rating: { gte: minRating } },
    include: { workCache: true },
    orderBy: { rating: "desc" },
  })) as unknown as UserWorkRatingWithWorkCache[];
  return rows.map((r) => ({
    rating: r.rating,
    preferenceNote: r.preferenceNote,
    reviewText: r.reviewText,
    work: {
      title: r.workCache.title,
      mediaType: r.workCache.mediaType,
      provider: r.workCache.provider,
      externalId: r.workCache.externalId,
      year: r.workCache.year,
      genres: r.workCache.genres,
      posterOrCoverUrl: r.workCache.posterOrCoverUrl,
    },
  }));
}

export async function findOverlapWorks(
  userIdA: string,
  userIdB: string,
  minRating = 4
): Promise<Array<{ title: string; mediaType: MediaType; myRating: number; theirRating: number }>> {
  const [a, b] = await Promise.all([
    prisma.userWorkRating.findMany({
      where: { userId: userIdA, rating: { gte: minRating } },
      include: { workCache: true },
    }),
    prisma.userWorkRating.findMany({
      where: { userId: userIdB, rating: { gte: minRating } },
      include: { workCache: true },
    }),
  ]);
  const mapB = new Map<string, (typeof b)[0]>();
  for (const x of b) {
    const k = `${x.workCache.provider}:${x.workCache.externalId}:${x.workCache.mediaType}`;
    mapB.set(k, x);
  }
  const out: Array<{
    title: string;
    mediaType: MediaType;
    myRating: number;
    theirRating: number;
  }> = [];
  for (const x of a) {
    const k = `${x.workCache.provider}:${x.workCache.externalId}:${x.workCache.mediaType}`;
    const y = mapB.get(k);
    if (y) {
      out.push({
        title: x.workCache.title,
        mediaType: x.workCache.mediaType,
        myRating: x.rating,
        theirRating: y.rating,
      });
    }
  }
  return out;
}
