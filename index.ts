import Fastify from "fastify";
import cookie from "@fastify/cookie";
import jwtPlugin from "./plugins/jwt";
import rateLimitPlugin from "./plugins/rate-limit";
import websocketPlugin from "./plugins/websocket";
import queuesPlugin from "./plugins/queues";
import { authRoutes } from "./routes/auth";
import { brandRoutes } from "./routes/brand";
import { calendarRoutes } from "./routes/calendar";
import { publishRoutes } from "./routes/publish";
import { analyticsRoutes } from "./routes/analytics";
import { integrationRoutes } from "./routes/integrations";
import { runMigrations } from "./db/migrate";

const server = Fastify({ logger: true });

async function start() {
  server.register(cookie);
  server.register(jwtPlugin);
  server.register(rateLimitPlugin);
  server.register(websocketPlugin);
  server.register(queuesPlugin);

  server.register(authRoutes, { prefix: "/api/v1/auth" });
  server.register(brandRoutes, { prefix: "/api/v1/brand" });
  server.register(calendarRoutes, { prefix: "/api/v1/calendar" });
  server.register(publishRoutes, { prefix: "/api/v1/publish" });
  server.register(analyticsRoutes, { prefix: "/api/v1/analytics" });
  server.register(integrationRoutes, { prefix: "/api/v1/integrations" });

  try {
    await runMigrations();
    await server.listen({ port: 8080, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
start();
