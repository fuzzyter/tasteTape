import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate } from "../plugins/auth.js";
import { fetchWorkDetail } from "../adapters/index.js";
import { analyzeTaste, rankCandidates } from "../lib/gemini.js";
import { buildTasteProfile } from "../lib/profile.js";
import { prisma } from "../lib/prisma.js";
import { gatherRecommendationCandidates } from "../lib/recommend.js";
import { upsertWorkFromNormalized } from "../lib/work-cache.js";
import { mediaTypeSchema } from "../types/normalized-work.js";

const addWorkBody = z.object({
  provider: z.string(),
  externalId: z.string(),
  mediaType: mediaTypeSchema,
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const patchWorkBody = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", { preHandler: [authenticate] }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user!.sub },
      select: { id: true, email: true, friendCode: true },
    });
    return user;
  });

  app.get("/me/works", { preHandler: [authenticate] }, async (request) => {
    const rows = await prisma.userWorkRating.findMany({
      where: { userId: request.user!.sub },
      include: { workCache: true },
      orderBy: { updatedAt: "desc" },
    });
    return {
      works: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        reviewText: r.reviewText,
        tags: r.tags,
        work: {
          id: r.workCache.id,
          provider: r.workCache.provider,
          externalId: r.workCache.externalId,
          mediaType: r.workCache.mediaType,
          title: r.workCache.title,
          year: r.workCache.year,
          genres: r.workCache.genres,
          synopsis: r.workCache.synopsis,
          originCountry: r.workCache.originCountry,
          language: r.workCache.language,
          ageRating: r.workCache.ageRating,
          posterOrCoverUrl: r.workCache.posterOrCoverUrl,
        },
      })),
    };
  });

  app.post("/me/works", { preHandler: [authenticate] }, async (request, reply) => {
    const body = addWorkBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid body", details: body.error.flatten() });
    }
    let normalized;
    try {
      normalized = await fetchWorkDetail(
        body.data.mediaType,
        body.data.provider,
        body.data.externalId
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load work";
      return reply.status(502).send({ error: msg });
    }
    const cache = await upsertWorkFromNormalized(normalized);
    const rating = await prisma.userWorkRating.upsert({
      where: {
        userId_workCacheId: {
          userId: request.user!.sub,
          workCacheId: cache.id,
        },
      },
      create: {
        userId: request.user!.sub,
        workCacheId: cache.id,
        rating: body.data.rating,
        reviewText: body.data.reviewText,
        tags: body.data.tags ?? [],
      },
      update: {
        rating: body.data.rating,
        reviewText: body.data.reviewText,
        tags: body.data.tags ?? [],
      },
    });
    return { id: rating.id, workCacheId: cache.id };
  });

  app.patch(
    "/me/works/:ratingId",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { ratingId } = request.params as { ratingId: string };
      const body = patchWorkBody.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: "Invalid body", details: body.error.flatten() });
      }
      const existing = await prisma.userWorkRating.findFirst({
        where: { id: ratingId, userId: request.user!.sub },
      });
      if (!existing) {
        return reply.status(404).send({ error: "Not found" });
      }
      const updated = await prisma.userWorkRating.update({
        where: { id: ratingId },
        data: {
          rating: body.data.rating ?? undefined,
          reviewText:
            body.data.reviewText === undefined ? undefined : body.data.reviewText,
          tags: body.data.tags ?? undefined,
        },
      });
      return updated;
    }
  );

  app.delete(
    "/me/works/:ratingId",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { ratingId } = request.params as { ratingId: string };
      const existing = await prisma.userWorkRating.findFirst({
        where: { id: ratingId, userId: request.user!.sub },
      });
      if (!existing) {
        return reply.status(404).send({ error: "Not found" });
      }
      await prisma.userWorkRating.delete({ where: { id: ratingId } });
      return reply.status(204).send();
    }
  );

  app.post("/me/analyze", { preHandler: [authenticate] }, async (request, reply) => {
    const profile = await buildTasteProfile(request.user!.sub);
    if (profile.summary.totalRated < 1) {
      return reply.status(400).send({ error: "Rate at least one work first" });
    }
    let analysis;
    let ranked;
    try {
      analysis = await analyzeTaste(profile);
      const candidates = await gatherRecommendationCandidates(profile);
      const exclude = new Set(
        profile.items.map((i) => i.title.toLowerCase())
      );
      ranked = await rankCandidates(profile, candidates, exclude);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      return reply.status(502).send({ error: msg });
    }
    return { profile: profile.summary, analysis, recommendations: ranked };
  });
};
