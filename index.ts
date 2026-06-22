import { Worker } from "bullmq";
import Redis from "ioredis";
import { Pool } from "pg";
import { orchestrateGeneration } from "./orchestrator";
import { applyAntiDetection } from "./anti-detection-client";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const worker = new Worker(
  "content-gen",
  async (job) => {
    switch (job.name) {
      case "generate": {
        const { userId, type, topic, variants = 1, toneSlider = 0, idempotencyKey } = job.data;
        const cacheKey = `idem:${idempotencyKey}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const results = [];
        for (let i = 0; i < variants; i++) {
          const rawText = await orchestrateGeneration(userId, type, topic, toneSlider);
          const finalText = await applyAntiDetection(rawText);
          results.push(finalText);
        }
        await redis.setex(cacheKey, 86400, JSON.stringify(results));
        return { results };
      }

      case "extract-voice": {
        const { userId, posts } = job.data;
        const openai = new (require("openai"))({ apiKey: process.env.OPENAI_API_KEY });
        const combined = posts.join("\n---\n");
        const embeddingResp = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: combined,
        });
        const embedding = embeddingResp.data[0].embedding;
        await pool.query(
          `UPDATE brand_voice SET embedding = $1 WHERE user_id = $2`,
          [JSON.stringify(embedding), userId]
        );
        return { voiceExtracted: true };
      }

      case "auto-fill": {
        const { userId, weeks } = job.data;
        const userRes = await pool.query(
          `SELECT tone_slider, banned_words FROM users WHERE id=$1`,
          [userId]
        );
        if (userRes.rowCount === 0) return { error: "User not found" };
        const user = userRes.rows[0];

        let pillarsRes = await pool.query(
          `SELECT pillar, weight FROM user_content_pillar_weights WHERE user_id=$1`,
          [userId]
        );
        let pillars = pillarsRes.rows;
        if (pillars.length === 0) {
          const defaults = ["promo", "educational", "behind-scenes"];
          for (const p of defaults) {
            await pool.query(
              `INSERT INTO user_content_pillar_weights (user_id, pillar, weight) VALUES ($1,$2,0.33) ON CONFLICT DO NOTHING`,
              [userId, p]
            );
          }
          pillarsRes = await pool.query(
            `SELECT pillar, weight FROM user_content_pillar_weights WHERE user_id=$1`,
            [userId]
          );
          pillars = pillarsRes.rows;
        }

        const platRes = await pool.query(
          `SELECT platform FROM user_platform_tokens WHERE user_id=$1`,
          [userId]
        );
        const platforms = platRes.rows.map((r: any) => r.platform);
        if (platforms.length === 0) return { skipped: "no platforms" };

        const now = new Date();
        for (let w = 0; w < weeks; w++) {
          for (let d = 0; d < 7; d++) {
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d + w * 7);
            for (const platform of platforms) {
              const hour = 10 + Math.floor(Math.random() * 8);
              const scheduledTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0);
              const pillar = weightedRandom(pillars.map((p: any) => ({ value: p.pillar, weight: p.weight })));
              const topic = `Topic for ${pillar} content on ${platform}`;
              const rawText = await orchestrateGeneration(userId, "auto", topic, user.tone_slider);
              let finalText = await applyAntiDetection(rawText);
              if (user.banned_words) {
                for (const word of user.banned_words) {
                  const regex = new RegExp(`\\b${word}\\b`, "gi");
                  finalText = finalText.replace(regex, "***");
                }
              }
              const idempotencyKey = require("uuid").v4();
              await pool.query(
                `INSERT INTO calendar_entries (user_id, platform, pillar, content, scheduled_time, status, idempotency_key)
                 VALUES ($1,$2,$3,$4,$5,'draft',$6)`,
                [userId, platform, pillar, finalText, scheduledTime, idempotencyKey]
              );
            }
          }
        }
        return { filled: true };
      }

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  },
  { connection: redis as any, concurrency: 10 }
);

function weightedRandom(items: { value: string; weight: number }[]) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[0].value;
}
