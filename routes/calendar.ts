import { FastifyInstance } from "fastify";
import pool from "../db";
import { ContentGenService } from "../services/content-gen";

export async function calendarRoutes(fastify: FastifyInstance) {
  const contentGen = new ContentGenService(fastify.redis);

  fastify.get("/", { preHandler: [fastify.authenticate] }, async (req) => {
    const { startDate, endDate } = req.query as any;
    const res = await pool.query(
      `SELECT * FROM calendar_entries WHERE user_id=$1 AND scheduled_time >= $2 AND scheduled_time <= $3 ORDER BY scheduled_time`,
      [req.user.sub, startDate, endDate]
    );
    return res.rows;
  });

  fastify.get("/posts/:postId", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { postId } = req.params as any;
    const res = await pool.query(`SELECT * FROM calendar_entries WHERE id=$1 AND user_id=$2`, [postId, req.user.sub]);
    if (res.rowCount === 0) return reply.status(404).send({ error: "Not found" });
    return res.rows[0];
  });

  fastify.post("/generate", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const userId = req.user.sub;
    const platRes = await pool.query(`SELECT 1 FROM user_platform_tokens WHERE user_id=$1 LIMIT 1`, [userId]);
    if (platRes.rowCount === 0) return reply.status(400).send({ error: "No social platforms connected" });
    const job = await contentGen.requestAutoFill(userId, 1);
    return { jobId: job.id };
  });

  fastify.put("/posts/:postId", { preHandler: [fastify.authenticate] }, async (req) => {
    const { postId } = req.params as any;
    const { content, scheduledTime } = req.body as any;
    if (content && content.length > 2200) return { error: "Caption too long" };
    await pool.query(
      `UPDATE calendar_entries SET content=COALESCE($1,content), scheduled_time=COALESCE($2,scheduled_time) WHERE id=$3 AND user_id=$4`,
      [content, scheduledTime, postId, req.user.sub]
    );
    return { postId };
  });

  fastify.post("/posts/:postId/regenerate", { preHandler: [fastify.authenticate] }, async (req) => {
    const { postId } = req.params as any;
    const userId = req.user.sub;
    const res = await pool.query(`SELECT content, platform, pillar FROM calendar_entries WHERE id=$1 AND user_id=$2`, [postId, userId]);
    if (res.rowCount === 0) return { error: "Post not found" };
    const post = res.rows[0];
    const job = await contentGen.requestGeneration({
      userId,
      type: post.pillar || "auto",
      topic: post.content,
      variants: 1,
      idempotencyKey: `regen-${postId}-${Date.now()}`,
    });
    return { jobId: job.id };
  });

  fastify.delete("/posts/:postId", { preHandler: [fastify.authenticate] }, async (req) => {
    const { postId } = req.params as any;
    await pool.query(`DELETE FROM calendar_entries WHERE id=$1 AND user_id=$2`, [postId, req.user.sub]);
    return { deleted: true };
  });
}
