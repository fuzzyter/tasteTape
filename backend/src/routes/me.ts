import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate } from "../plugins/auth.js";
import { fetchWorkDetail } from "../adapters/index.js";
import { analyzeTaste, rankCandidates } from "../lib/gemini.js";
import { buildTasteProfile } from "../lib/profile.js";
import { enrichWorkRefs } from "../lib/enrich.js";
import { prisma } from "../lib/prisma.js";
import { gatherRecommendationCandidates } from "../lib/recommend.js";
import { computeTasteStats } from "../lib/stats.js";
import { upsertWorkFromNormalized } from "../lib/work-cache.js";
import { mediaTypeSchema } from "../types/normalized-work.js";

const preferenceNoteSchema = z
  .string()
  .max(300)
  .optional()
  .nullable();

const addWorkBody = z.object({
  provider: z.string(),
  externalId: z.string(),
  mediaType: mediaTypeSchema,
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().optional(),
  preferenceNote: preferenceNoteSchema,
  tags: z.array(z.string()).optional(),
});

const patchWorkBody = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().nullable().optional(),
  preferenceNote: preferenceNoteSchema,
  tags: z.array(z.string()).optional(),
});

const patchMeBody = z.object({
  nickname: z.string().min(1).max(40).optional().nullable(),
  comparePublic: z.boolean().optional(),
});

const analyzeBodySchema = z.object({
  yearMin: z.number().int().min(1900).max(2100).optional(),
  yearMax: z.number().int().min(1900).max(2100).optional(),
  mediaTypes: z.array(z.enum(["book", "movie", "tv"])).optional(),
  save: z.boolean().optional(),
});

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", { preHandler: [authenticate] }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user!.sub },
      select: {
        id: true,
        email: true,
        friendCode: true,
        nickname: true,
        comparePublic: true,
      },
    });
    return user;
  });

  app.patch("/me", { preHandler: [authenticate] }, async (request, reply) => {
    const body = patchMeBody.safeParse(request.body ?? {});
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid body", details: body.error.flatten() });
    }
    const u = await prisma.user.update({
      where: { id: request.user!.sub },
      data: {
        nickname:
          body.data.nickname === undefined ? undefined : body.data.nickname,
        comparePublic: body.data.comparePublic,
      },
      select: {
        id: true,
        email: true,
        friendCode: true,
        nickname: true,
        comparePublic: true,
      },
    });
    return u;
  });

  app.get("/me/stats", { preHandler: [authenticate] }, async (request) => {
    const stats = await computeTasteStats(request.user!.sub);
    return { stats };
  });

  app.get("/me/snapshots", { preHandler: [authenticate] }, async (request) => {
    const rows = await prisma.savedSnapshot.findMany({
      where: { userId: request.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, kind: true, label: true, createdAt: true },
    });
    return { snapshots: rows };
  });

  app.get("/me/snapshots/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = await prisma.savedSnapshot.findFirst({
      where: { id, userId: request.user!.sub },
    });
    if (!row) return reply.status(404).send({ error: "Not found" });
    return row;
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
        preferenceNote: r.preferenceNote,
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
        preferenceNote: body.data.preferenceNote ?? null,
        tags: body.data.tags ?? [],
      },
      update: {
        rating: body.data.rating,
        reviewText: body.data.reviewText,
        preferenceNote: body.data.preferenceNote ?? undefined,
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
          preferenceNote:
            body.data.preferenceNote === undefined
              ? undefined
              : body.data.preferenceNote,
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
    const raw =
      request.body != null && typeof request.body === "object"
        ? (request.body as Record<string, unknown>)
        : {};
    const opts = analyzeBodySchema.safeParse(raw);
    if (!opts.success) {
      return reply.status(400).send({ error: "Invalid body", details: opts.error.flatten() });
    }

    const profile = await buildTasteProfile(request.user!.sub);
    if (profile.summary.totalRated < 1) {
      return reply.status(400).send({ error: "Rate at least one work first" });
    }

    const filters = {
      yearMin: opts.data.yearMin,
      yearMax: opts.data.yearMax,
      mediaTypes: opts.data.mediaTypes,
    };

    let stats;
    let analysis;
    let ranked;
    let candidates;
    try {
      stats = await computeTasteStats(request.user!.sub);
      analysis = await analyzeTaste(profile);
      candidates = await gatherRecommendationCandidates(profile, filters);
      const exclude = new Set(profile.items.map((i) => i.title.toLowerCase()));
      ranked = await rankCandidates(profile, candidates, exclude);
      const allowedKeys = new Set(
        candidates.map((c) =>
          `${c.externalRef.provider}:${c.externalRef.id}:${c.mediaType}`
        )
      );
      ranked = {
        ranked: ranked.ranked.filter((r) =>
          allowedKeys.has(`${r.provider}:${r.externalId}:${r.mediaType}`)
        ),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      return reply.status(502).send({ error: msg });
    }

    const enrichedRows = await enrichWorkRefs(
      ranked.ranked.map((r) => ({
        provider: r.provider,
        externalId: r.externalId,
        mediaType: r.mediaType,
        score: r.score,
        reasons: r.reasons,
        aiComment: r.aiComment,
        title: r.title,
      })),
      candidates
    );

    const payload = {
      profile: profile.summary,
      stats,
      analysis,
      recommendations: { ranked: enrichedRows },
    };

    if (opts.data.save) {
      await prisma.savedSnapshot.create({
        data: {
          userId: request.user!.sub,
          kind: "analyze",
          label: `분석 ${new Date().toISOString().slice(0, 16)}`,
          payload: payload as object,
        },
      });
    }

    return payload;
  });
};
