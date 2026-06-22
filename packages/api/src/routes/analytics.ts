import { FastifyInstance } from "fastify";
import { AnalyticsService } from "../services/analytics";
import pool from "../db";

export async function analyticsRoutes(fastify: FastifyInstance) {
  const analytics = new AnalyticsService(pool);

  fastify.get("/summary", { preHandler: [fastify.authenticate] }, async (req) => {
    const { days: rawDays } = req.query as { days?: string | number };
    const days = Number(rawDays) || 30;
    const summary = await analytics.getSummary(req.user.sub, days);
    return summary;
  });

  fastify.post("/event", async (req) => {
    const { postId, eventType, userId } = req.body as any;
    if (!postId || !eventType || !userId) return { error: "Missing required fields" };
    await analytics.recordConversion(userId, postId, eventType);
    return { recorded: true };
  });
}
