import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { generateFriendCode, hashPassword, signToken, verifyPassword } from "../lib/auth.js";

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string(),
});


type AuthUserOut = {
  id: string;
  email: string;
  friendCode: string;
  nickname: string | null;
  comparePublic: boolean;
};

function authUserOut(user: { id: string; email: string; friendCode: string } & Record<string, unknown>): AuthUserOut {
  const nickname = user["nickname"];
  const comparePublic = user["comparePublic"];
  return {
    id: user.id,
    email: user.email,
    friendCode: user.friendCode,
    nickname: typeof nickname === "string" || nickname === null ? nickname : null,
    comparePublic: comparePublic === false ? false : true,
  };
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", async (request, reply) => {
    const body = registerBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid body", details: body.error.flatten() });
    }
    const existing = await prisma.user.findUnique({
      where: { email: body.data.email },
    });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }
    let friendCode = generateFriendCode();
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.user.findUnique({ where: { friendCode } });
      if (!clash) break;
      friendCode = generateFriendCode();
    }
    const passwordHash = await hashPassword(body.data.password);
    const user = await prisma.user.create({
      data: {
        email: body.data.email,
        passwordHash,
        friendCode,
      },
    });
    const token = signToken({ sub: user.id, email: user.email });
    return {
      token,
      user: authUserOut(user),
    };
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid body", details: body.error.flatten() });
    }
    const user = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }
    const ok = await verifyPassword(body.data.password, user.passwordHash);
    if (!ok) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }
    const token = signToken({ sub: user.id, email: user.email });
    return {
      token,
      user: authUserOut(user),
    };
  });
};
