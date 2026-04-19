import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { compareRoutes } from "./routes/compare.js";
import { meRoutes } from "./routes/me.js";
import { searchRoutes } from "./routes/search.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  credentials: true,
});

await app.register(authPlugin);
await app.register(authRoutes);
await app.register(searchRoutes);
await app.register(meRoutes);
await app.register(compareRoutes);

app.get("/health", async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
