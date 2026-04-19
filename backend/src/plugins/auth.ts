import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { verifyToken, type JwtPayload } from "../lib/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  try {
    request.user = verifyToken(auth.slice(7));
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorate("authenticate", authenticate);
};

declare module "fastify" {
  interface FastifyInstance {
    authenticate: typeof authenticate;
  }
}
