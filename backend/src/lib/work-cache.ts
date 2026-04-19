import type { MediaType as PrismaMedia } from "@prisma/client";
import type { NormalizedWork } from "../types/normalized-work.js";
import { prisma } from "./prisma.js";

export async function upsertWorkFromNormalized(w: NormalizedWork) {
  const mediaType = w.mediaType as PrismaMedia;
  return prisma.workCache.upsert({
    where: {
      provider_externalId_mediaType: {
        provider: w.externalRef.provider,
        externalId: w.externalRef.id,
        mediaType,
      },
    },
    create: {
      provider: w.externalRef.provider,
      externalId: w.externalRef.id,
      mediaType,
      title: w.title,
      year: w.year ?? undefined,
      genres: w.genres,
      synopsis: w.synopsis,
      originCountry: w.originCountry,
      language: w.language,
      ageRating: w.ageRating,
      posterOrCoverUrl: w.posterOrCoverUrl,
    },
    update: {
      title: w.title,
      year: w.year ?? undefined,
      genres: w.genres,
      synopsis: w.synopsis,
      originCountry: w.originCountry,
      language: w.language,
      ageRating: w.ageRating,
      posterOrCoverUrl: w.posterOrCoverUrl,
    },
  });
}
