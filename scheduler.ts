import { Queue } from "bullmq";
import Redis from "ioredis";
import { Pool } from "pg";

export async function initScheduler(redis: Redis) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const contentGenQueue = new Queue("content-gen", { connection: redis as any });

  setInterval(async () => {
    try {
      const now = new Date();
      if (now.getUTCDay() === 0 && now.getUTCHours() === 2 && now.getUTCMinutes() === 0) {
        const users = await pool.query(`SELECT id FROM users`);
        for (const user of users.rows) {
          await contentGenQueue.add("auto-fill", { userId: user.id, weeks: 1 });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, 60_000);

  setInterval(async () => {
    const now = new Date();
    if (now.getUTCHours() === 3 && now.getUTCMinutes() === 0) {
      await runLearningLoop(pool);
    }
  }, 60_000);
}

async function runLearningLoop(pool: Pool) {
  const users = await pool.query(`SELECT id FROM users`);
  for (const user of users.rows) {
    const userId = user.id;
    const pillarsRes = await pool.query(
      `SELECT pillar, weight FROM user_content_pillar_weights WHERE user_id=$1`,
      [userId]
    );
    if (pillarsRes.rowCount === 0) continue;

    const metrics = await pool.query(
      `SELECT ce.pillar, SUM(pm.impressions) as impressions, SUM(pm.clicks) as clicks, COUNT(cev.id) as conversions
       FROM calendar_entries ce
       JOIN platform_metrics pm ON pm.post_id = ce.id
       LEFT JOIN conversion_events cev ON cev.post_id = ce.id
       WHERE ce.user_id = $1 AND ce.status = 'published'
         AND ce.scheduled_time > NOW() - INTERVAL '7 days'
       GROUP BY ce.pillar`,
      [userId]
    );

    const totalWeight = pillarsRes.rows.reduce((sum: number, p: any) => sum + p.weight, 0);

    for (const row of metrics.rows) {
      const { pillar, impressions, clicks, conversions } = row;
      if (impressions == 0) continue;
      const score = (parseInt(clicks) + 2 * parseInt(conversions)) / parseInt(impressions);
      const currentRow = pillarsRes.rows.find((p: any) => p.pillar === pillar);
      if (!currentRow) continue;
      let newWeight = currentRow.weight;
      if (score > 0.05) {
        newWeight = Math.min(0.5, newWeight * 1.1);
      } else if (score < 0.01) {
        newWeight = Math.max(0.05, newWeight * 0.9);
      }
      const otherSum = totalWeight - currentRow.weight;
      const maxAllowed = 0.5 * (otherSum + newWeight);
      if (newWeight > maxAllowed) {
        newWeight = maxAllowed;
      }
      if (newWeight !== currentRow.weight) {
        await pool.query(
          `UPDATE user_content_pillar_weights SET weight=$1 WHERE user_id=$2 AND pillar=$3`,
          [newWeight, userId, pillar]
        );
      }
    }
  }
}
