import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate } from "../plugins/auth.js";
import { compareTastes } from "../lib/gemini.js";
import { buildTasteProfile } from "../lib/profile.js";
import { prisma } from "../lib/prisma.js";

const compareBody = z.object({
  friendCode: z.string().min(4).max(16),
});

export const compareRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/me/compare",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = compareBody.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: "Invalid body", details: body.error.flatten() });
      }
      const meId = request.user!.sub;
      const friend = await prisma.user.findUnique({
        where: { friendCode: body.data.friendCode.trim().toUpperCase() },
      });
      if (!friend) {
        return reply.status(404).send({ error: "Friend code not found" });
      }
      if (friend.id === meId) {
        return reply.status(400).send({ error: "Cannot compare with yourself" });
      }
      const [a, b] = await Promise.all([
        buildTasteProfile(meId),
        buildTasteProfile(friend.id),
      ]);
      const friendRatings = await prisma.userWorkRating.findMany({
        where: { userId: friend.id },
        include: { workCache: true },
        orderBy: { rating: "desc" },
      });
      const friendRatedTitles = friendRatings.map((r) => r.workCache.title);
      let result;
      try {
        result = await compareTastes(a, b, friendRatedTitles.slice(0, 30));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Compare failed";
        return reply.status(502).send({ error: msg });
      }
      return {
        friend: { email: maskEmail(friend.email), friendCode: friend.friendCode },
        result,
      };
    }
  );
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked =
    local.length <= 2
      ? `${local[0] ?? "*"}*`
      : `${local.slice(0, 2)}…`;
  return `${masked}@${domain}`;
}
