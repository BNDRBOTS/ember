import { FastifyInstance } from "fastify";
import { z } from "zod";
import { UserService } from "../services/user";
import { ContentGenService } from "../services/content-gen";
import pool from "../db";

const voiceSchema = z.object({
  posts: z.array(z.string().min(100).max(1000).refine((s) => !/https?:\/\//.test(s))).length(3),
  brandName: z.string().optional(),
});

export async function brandRoutes(fastify: FastifyInstance) {
  const userService = new UserService(pool);
  const contentGen = new ContentGenService(fastify.redis);

  fastify.post("/voice", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { posts } = voiceSchema.parse(request.body);
    const userId = request.user.sub;
    await pool.query(
      `INSERT INTO brand_voice (user_id, example_posts) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET example_posts=$2`,
      [userId, posts]
    );
    await contentGen.requestVoiceExtraction(userId, posts);
    return { status: "analyzing" };
  });

  fastify.get("/settings", { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = request.user.sub;
    const settings = await userService.getBrandSettings(userId);
    return settings;
  });

  fastify.put("/settings", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { toneSlider, bannedWords } = request.body as any;
    if (typeof toneSlider !== "number" || toneSlider < -2 || toneSlider > 2)
      return reply.status(400).send({ error: "toneSlider must be between -2 and 2" });
    if (!Array.isArray(bannedWords) || bannedWords.length > 50)
      return reply.status(400).send({ error: "bannedWords must be array of up to 50 words" });
    for (const w of bannedWords) {
      if (!/^[a-zA-Z0-9 ]+$/.test(w)) return reply.status(400).send({ error: `Invalid banned word: ${w}` });
    }
    const userId = request.user.sub;
    await userService.updateBrandSettings(userId, toneSlider, bannedWords);
    return { status: "updated" };
  });
}
