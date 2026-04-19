import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { searchWorks } from "../adapters/index.js";
import { mediaTypeSchema } from "../types/normalized-work.js";

const querySchema = z.object({
  q: z.string().optional().default(""),
  mediaType: mediaTypeSchema,
});

export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get("/search", async (request, reply) => {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query", details: parsed.error.flatten() });
    }
    try {
      const works = await searchWorks(parsed.data.q, parsed.data.mediaType);
      return { works };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Search failed";
      return reply.status(502).send({ error: msg });
    }
  });
};
