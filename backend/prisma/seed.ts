import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureUser(email: string, password: string, friendCode: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      friendCode,
    },
  });
}

async function main() {
  await ensureUser("alice@demo.local", "demo1234", "SEEDTASTEALICE01");
  await ensureUser("bob@demo.local", "demo1234", "SEEDTASTEBOBO001");
  console.log("Seed OK: alice@demo.local, bob@demo.local (password: demo1234)");
  console.log("Friend codes: SEEDTASTEALICE01, SEEDTASTEBOBO001");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
